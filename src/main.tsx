import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Cross-browser Dynamic Chunk Auto-Recovery
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    const msg = event.message || '';
    if (
      msg.includes('Failed to fetch dynamically imported module') ||
      msg.includes('Loading chunk') ||
      msg.includes('dynamically imported module')
    ) {
      console.warn('[ChunkRecovery] Detected stale chunk error, reloading latest bundle...');
      try {
        const hasAttempted = sessionStorage.getItem('chunk_recovery_flag');
        if (!hasAttempted) {
          sessionStorage.setItem('chunk_recovery_flag', 'true');
          window.location.reload();
        }
      } catch {
        window.location.reload();
      }
    }
  });

  // Safe Service Worker Registration
  try {
    if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(registration => {
            console.log('SW registered: ', registration);
          })
          .catch(err => {
            console.warn('SW registration skipped or blocked:', err);
          });
      });
    }
  } catch (e) {
    console.warn('Service worker check error:', e);
  }
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
