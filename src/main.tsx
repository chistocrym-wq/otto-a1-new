import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './ottoPremiumSystem.css';
import './ottoPremiumVoice.css';
import { installGermanSpeechPolicy } from './lib/germanSpeechPolicy';
import { initPwaInstall } from './lib/pwaInstall';

installGermanSpeechPolicy();
initPwaInstall();

createRoot(document.getElementById('root')!).render(
  <StrictMode><App /></StrictMode>
);
