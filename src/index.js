// src/index.js
import 'bootstrap/dist/css/bootstrap.min.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';
import './index.css';
import { MeProvider } from './providers/MeProvider';
import "bootstrap-icons/font/bootstrap-icons.css";

const rootEl = document.getElementById('root');
const root = createRoot(rootEl);

root.render(
    <MeProvider>
      <App />
    </MeProvider>
);

(function ensureIamport() {
  if (window.IMP) return;
  const exists = Array.from(document.getElementsByTagName('script'))
    .some(s => s.src === 'https://cdn.iamport.kr/v1/iamport.js');
  if (exists) return;

  const script = document.createElement('script');
  script.src = 'https://cdn.iamport.kr/v1/iamport.js';
  script.async = true;
  document.body.appendChild(script);
})();