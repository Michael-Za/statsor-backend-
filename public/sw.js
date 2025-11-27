// Service Worker for TeamPlaymate Sports Analytics Platform
// Handles offline functionality, caching, and background sync

const CACHE_NAME = 'teamplaymate-v1';
const STATIC_CACHE = 'teamplaymate-static-v1';
const DYNAMIC_CACHE = 'teamplaymate-dynamic-v1';

// Resources to cache immediately
const STATIC_ASSETS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.ico'
];

// API endpoints to cache
const CACHEABLE_APIS = [
  '/api/players',
  '/api/teams',
  '/api/matches',
  '/api/stats'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Static assets cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Failed to cache static assets', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }
  
  // Handle static assets
  if (STATIC_ASSETS.some(asset => url.pathname.endsWith(asset))) {
    event.respondWith(handleStaticAsset(request));
    return;
  }
  
  // Handle other requests with network-first strategy
  event.respondWith(handleNetworkFirst(request));
});

// Handle API requests with cache-first strategy for GET requests
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  // Check if this API endpoint should be cached
  const shouldCache = CACHEABLE_APIS.some(api => url.pathname.startsWith(api));
  
  if (!shouldCache) {
    // For non-cacheable APIs, try network first
    try {
      const response = await fetch(request);
      return response;
    } catch (error) {
      console.log('Service Worker: Network failed for API request', error);
      return new Response(
        JSON.stringify({ error: 'Network unavailable', offline: true }),
        { 
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }
  
  try {
    // Try cache first for cacheable APIs
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Return cached response and update in background
      fetchAndCache(request, cache);
      return cachedResponse;
    }
    
    // If not in cache, fetch from network
    const response = await fetch(request);
    
    if (response.ok) {
      // Cache successful responses
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('Service Worker: Failed to fetch API request', error);
    
    // Try to return cached version as fallback
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response
    return new Response(
      JSON.stringify({ error: 'Data unavailable offline', offline: true }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Handle static assets with cache-first strategy
async function handleStaticAsset(request) {
  try {
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const response = await fetch(request);
    
    if (response.ok) {
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('Service Worker: Failed to fetch static asset', error);
    
    // Return a fallback response for critical assets
    if (request.url.includes('.html')) {
      return new Response(
        '<html><body><h1>Offline</h1><p>Please check your connection</p></body></html>',
        { headers: { 'Content-Type': 'text/html' } }
      );
    }
    
    return new Response('Asset unavailable offline', { status: 503 });
  }
}

// Handle other requests with network-first strategy
async function handleNetworkFirst(request) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('Service Worker: Network failed, trying cache', error);
    
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return new Response('Content unavailable offline', { status: 503 });
  }
}

// Background fetch and cache function
async function fetchAndCache(request, cache) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      cache.put(request, response.clone());
    }
  } catch (error) {
    console.log('Service Worker: Background fetch failed', error);
  }
}

// Background sync event
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered', event.tag);
  
  if (event.tag === 'sync-data') {
    event.waitUntil(syncPendingData());
  }
  
  if (event.tag === 'upload-file') {
    event.waitUntil(syncPendingUploads());
  }
  
  if (event.tag === 'update-profile') {
    event.waitUntil(syncProfileUpdates());
  }
});

// Sync pending data when back online
async function syncPendingData() {
  try {
    // Get pending actions from IndexedDB or localStorage
    const pendingActions = await getPendingActions();
    
    for (const action of pendingActions) {
      try {
        await fetch(action.url, {
          method: action.method,
          headers: action.headers,
          body: action.body
        });
        
        // Remove successful action from pending list
        await removePendingAction(action.id);
        
        // Notify clients of successful sync
        self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'SYNC_SUCCESS',
              action: action.type
            });
          });
        });
      } catch (error) {
        console.log('Service Worker: Failed to sync action', action, error);
      }
    }
  } catch (error) {
    console.error('Service Worker: Sync failed', error);
  }
}

// Sync pending file uploads
async function syncPendingUploads() {
  try {
    const pendingUploads = await getPendingUploads();
    
    for (const upload of pendingUploads) {
      try {
        const formData = new FormData();
        formData.append('file', upload.file);
        
        await fetch('/api/upload', {
          method: 'POST',
          body: formData,
          headers: upload.headers
        });
        
        await removePendingUpload(upload.id);
        
        // Notify clients
        self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'UPLOAD_SUCCESS',
              filename: upload.filename
            });
          });
        });
      } catch (error) {
        console.log('Service Worker: Failed to sync upload', upload, error);
      }
    }
  } catch (error) {
    console.error('Service Worker: Upload sync failed', error);
  }
}

// Sync profile updates
async function syncProfileUpdates() {
  try {
    const pendingUpdates = await getPendingProfileUpdates();
    
    for (const update of pendingUpdates) {
      try {
        await fetch('/api/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...update.headers
          },
          body: JSON.stringify(update.data)
        });
        
        await removePendingProfileUpdate(update.id);
        
        // Notify clients
        self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'PROFILE_UPDATE_SUCCESS'
            });
          });
        });
      } catch (error) {
        console.log('Service Worker: Failed to sync profile update', update, error);
      }
    }
  } catch (error) {
    console.error('Service Worker: Profile sync failed', error);
  }
}

// Helper functions for IndexedDB operations
async function getPendingActions() {
  // Implementation would use IndexedDB to store/retrieve pending actions
  // For now, return empty array
  return [];
}

async function removePendingAction(id) {
  // Implementation would remove action from IndexedDB
  console.log('Removing pending action:', id);
}

async function getPendingUploads() {
  // Implementation would use IndexedDB to store/retrieve pending uploads
  return [];
}

async function removePendingUpload(id) {
  // Implementation would remove upload from IndexedDB
  console.log('Removing pending upload:', id);
}

async function getPendingProfileUpdates() {
  // Implementation would use IndexedDB to store/retrieve pending profile updates
  return [];
}

async function removePendingProfileUpdate(id) {
  // Implementation would remove profile update from IndexedDB
  console.log('Removing pending profile update:', id);
}

// Message event - handle messages from main thread
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CACHE_URLS':
      if (data && data.urls) {
        cacheUrls(data.urls);
      }
      break;
      
    case 'CLEAR_CACHE':
      clearAllCaches();
      break;
      
    default:
      console.log('Service Worker: Unknown message type', type);
  }
});

// Cache specific URLs
async function cacheUrls(urls) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    await cache.addAll(urls);
    console.log('Service Worker: URLs cached successfully');
  } catch (error) {
    console.error('Service Worker: Failed to cache URLs', error);
  }
}

// Clear all caches
async function clearAllCaches() {
  try {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
    console.log('Service Worker: All caches cleared');
  } catch (error) {
    console.error('Service Worker: Failed to clear caches', error);
  }
}

console.log('Service Worker: Script loaded');