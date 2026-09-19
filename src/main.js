/**
 * Main Application Entry Point
 */

import './scss/main.scss';
import { state } from './js/state.js';
import { UIRenderer } from './js/ui.js';

// Initialize core application state and storage
state.init();

// Initialize UI controller
const ui = new UIRenderer(state);
document.addEventListener('DOMContentLoaded', () => {
  ui.init();
});

// Register PWA service worker if supported
if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => console.log('ServiceWorker registered with scope:', reg.scope))
      .catch((err) => console.log('ServiceWorker registration skipped:', err.message));
  });
}
