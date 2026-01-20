// src/popup/index.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import './App.css';
import App from './App';

console.log('[DMM Helper - Popup] Initializing popup...');

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

console.log('[DMM Helper - Popup] Popup rendered');