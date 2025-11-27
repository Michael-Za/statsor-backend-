import { lazy, ComponentType, LazyExoticComponent } from 'react';

// Lazy loading utility with error handling
export const lazyLoad = <T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: ComponentType
): LazyExoticComponent<T> => {
  return lazy(async () => {
    try {
      const module = await importFunc();
      return module;
    } catch (error) {
      console.error('Failed to load component:', error);
      // Return fallback component or a default error component
      if (fallback) {
        return { default: fallback };
      }
      // Default error component
      const ErrorComponent = () => (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-destructive mb-2">
              Failed to load component
            </h3>
            <p className="text-sm text-muted-foreground">
              Please refresh the page to try again.
            </p>
          </div>
        </div>
      );
      return { default: ErrorComponent as T };
    }
  });
};

// Preload utility for critical routes
export const preloadRoute = (importFunc: () => Promise<any>) => {
  // Preload on idle or after a delay
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      importFunc().catch(console.error);
    });
  } else {
    setTimeout(() => {
      importFunc().catch(console.error);
    }, 2000);
  }
};

// Image lazy loading utility
export const createImageLoader = () => {
  const imageCache = new Map<string, Promise<string>>();
  
  return {
    loadImage: (src: string): Promise<string> => {
      if (imageCache.has(src)) {
        return imageCache.get(src)!;
      }
      
      const promise = new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(src);
        img.onerror = reject;
        img.src = src;
      });
      
      imageCache.set(src, promise);
      return promise;
    },
    
    preloadImages: (sources: string[]) => {
      sources.forEach(src => {
        if (!imageCache.has(src)) {
          imageCache.set(src, new Promise<string>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(src);
            img.onerror = reject;
            img.src = src;
          }));
        }
      });
    }
  };
};

// Bundle size analyzer utility
export const analyzeBundleSize = () => {
  if (process.env.NODE_ENV === 'development') {
    const getSize = (obj: any): number => {
      const str = JSON.stringify(obj);
      return new Blob([str]).size;
    };
    
    const analyzeComponent = (name: string, component: any) => {
      const size = getSize(component);
      console.log(`Component ${name} size: ${(size / 1024).toFixed(2)} KB`);
    };
    
    return { analyzeComponent };
  }
  
  return { analyzeComponent: () => {} };
};

// Memory usage monitoring
export const memoryMonitor = {
  start: () => {
    if (process.env.NODE_ENV === 'development' && 'memory' in performance) {
      const startMemory = (performance as any).memory.usedJSHeapSize;
      
      return {
        end: (label: string) => {
          const endMemory = (performance as any).memory.usedJSHeapSize;
          const diff = endMemory - startMemory;
          console.log(`Memory usage for ${label}: ${(diff / 1024 / 1024).toFixed(2)} MB`);
        }
      };
    }
    
    return { end: () => {} };
  }
};

// Performance timing utility
export const performanceTimer = {
  start: (label: string) => {
    if (process.env.NODE_ENV === 'development') {
      performance.mark(`${label}-start`);
      
      return {
        end: () => {
          performance.mark(`${label}-end`);
          performance.measure(label, `${label}-start`, `${label}-end`);
          
          const measure = performance.getEntriesByName(label)[0];
          console.log(`${label} took ${measure.duration.toFixed(2)}ms`);
          
          // Clean up
          performance.clearMarks(`${label}-start`);
          performance.clearMarks(`${label}-end`);
          performance.clearMeasures(label);
        }
      };
    }
    
    return { end: () => {} };
  }
};

// Debounce utility for performance optimization
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    
    const callNow = immediate && !timeout;
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func(...args);
  };
};

// Throttle utility for performance optimization
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Virtual scrolling utility for large lists
export const createVirtualScroller = ({
  itemHeight,
  containerHeight,
  overscan = 5
}: {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}) => {
  return {
    getVisibleRange: (scrollTop: number, totalItems: number) => {
      const visibleStart = Math.floor(scrollTop / itemHeight);
      const visibleEnd = Math.min(
        visibleStart + Math.ceil(containerHeight / itemHeight),
        totalItems - 1
      );
      
      return {
        start: Math.max(0, visibleStart - overscan),
        end: Math.min(totalItems - 1, visibleEnd + overscan)
      };
    },
    
    getItemStyle: (index: number) => ({
      position: 'absolute' as const,
      top: index * itemHeight,
      height: itemHeight,
      width: '100%'
    }),
    
    getTotalHeight: (totalItems: number) => totalItems * itemHeight
  };
};

// Resource hints utility
export const resourceHints = {
  preconnect: (href: string) => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = href;
    document.head.appendChild(link);
  },
  
  prefetch: (href: string) => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    document.head.appendChild(link);
  },
  
  preload: (href: string, as: string) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    document.head.appendChild(link);
  }
};