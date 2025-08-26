// src/index.js
import 'bootstrap/dist/css/bootstrap.min.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';
import './index.css';
import { MeProvider } from './providers/MeProvider';

// ✅ root는 단 한 번만 만들고, Provider 트리도 한 번만 감쌉니다.
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