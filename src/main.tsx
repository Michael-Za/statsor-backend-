import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// PWA Install Prompt
let deferredPrompt: any;
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault();
  // Stash the event so it can be triggered later
  deferredPrompt = e;
  
  // Show install button or banner
  const installBanner = document.createElement('div');
  
  // Create the main container
  const bannerContainer = document.createElement('div');
  bannerContainer.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 20px;
    right: 20px;
    background: #4ADE80;
    color: white;
    padding: 16px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-family: system-ui, -apple-system, sans-serif;
  `;
  
  // Create text content
  const textDiv = document.createElement('div');
  const titleDiv = document.createElement('div');
  titleDiv.style.cssText = 'font-weight: 600; margin-bottom: 4px;';
  titleDiv.textContent = 'Install Statsor';
  const subtitleDiv = document.createElement('div');
  subtitleDiv.style.cssText = 'font-size: 14px; opacity: 0.9;';
  subtitleDiv.textContent = 'Add to your home screen for quick access';
  textDiv.appendChild(titleDiv);
  textDiv.appendChild(subtitleDiv);
  
  // Create buttons container
  const buttonsDiv = document.createElement('div');
  
  // Create install button
  const installBtn = document.createElement('button');
  installBtn.id = 'install-btn';
  installBtn.style.cssText = `
    background: white;
    color: #4ADE80;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    font-weight: 600;
    margin-right: 8px;
    cursor: pointer;
  `;
  installBtn.textContent = 'Install';
  
  // Create dismiss button
  const dismissBtn = document.createElement('button');
  dismissBtn.id = 'dismiss-btn';
  dismissBtn.style.cssText = `
    background: transparent;
    color: white;
    border: 1px solid rgba(255,255,255,0.3);
    padding: 8px 12px;
    border-radius: 6px;
    cursor: pointer;
  `;
  dismissBtn.textContent = '×';
  
  // Assemble the banner
  buttonsDiv.appendChild(installBtn);
  buttonsDiv.appendChild(dismissBtn);
  bannerContainer.appendChild(textDiv);
  bannerContainer.appendChild(buttonsDiv);
  installBanner.appendChild(bannerContainer);
  
  document.body.appendChild(installBanner);
  
  // Add event listeners using proper event delegation
  installBanner.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    
    if (target.id === 'install-btn') {
      installBanner.remove();
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult: any) => {
          if (choiceResult.outcome === 'accepted') {
            console.log('User accepted the A2HS prompt');
          } else {
            console.log('User dismissed the A2HS prompt');
          }
          deferredPrompt = null;
        });
      }
    } else if (target.id === 'dismiss-btn') {
      installBanner.remove();
    }
  });
});

// Ensure the root element exists before rendering
const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(<App />);
} else {
  console.error("Failed to find the root element");
}
