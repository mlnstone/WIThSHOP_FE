import 'bootstrap/dist/css/bootstrap.min.css';   // 부트스트랩 전역
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';   // 변경된 경로

import './index.css';          // 전역 스타일 있으면 유지

const root = createRoot(document.getElementById('root'));
root.render(<App />);