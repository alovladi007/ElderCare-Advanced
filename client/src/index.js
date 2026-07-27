import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register the service worker for PWA functionality in production only.
// In development it intercepts dev-server requests for assets that only exist
// under content-hashed names, which surfaces as a stream of "Proxy error:
// Could not proxy request /static/js/main.js" and can serve a stale shell
// after a code change. unregister() also cleans up any worker a developer
// picked up from an earlier build.
if (process.env.NODE_ENV === 'production') {
  serviceWorkerRegistration.register();
} else {
  serviceWorkerRegistration.unregister();
}
