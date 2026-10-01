import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

// Programmatically set favicon and document title using pure React/JS
if (typeof document !== 'undefined') {
  document.title = 'RecruitAI - AI Recruitment & Talent Evaluation Platform';
  let faviconLink: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
  if (!faviconLink) {
    faviconLink = document.createElement('link');
    faviconLink.type = 'image/svg+xml';
    faviconLink.rel = 'icon';
    document.getElementsByTagName('head')[0].appendChild(faviconLink);
  }
  faviconLink.href = '/favicon.svg';
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
