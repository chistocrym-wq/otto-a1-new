import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './ottoPremiumSystem.css';
import './ottoPremiumVoice.css';
import { installGermanSpeechPolicy } from './lib/germanSpeechPolicy';
import { initPwaInstall } from './lib/pwaInstall';
import { installTextSizePreference } from './lib/textSizePreference';

const ROUTE_RECOVERY_KEY = 'otto-a1-route-recovery-at';
const routePreloaders = [
  () => import('./components/Instructions'),
  () => import('./components/ExamGuide'),
  () => import('./components/MockExam'),
  () => import('./components/ModulesHub'),
  () => import('./components/AccountPage'),
  () => import('./components/ReadinessPage'),
  () => import('./components/PhraseSpeakingPractice'),
  () => import('./components/SettingsPage'),
  () => import('./components/NewsPage'),
  () => import('./components/SupportPage'),
  () => import('./components/DailyTrainingPage'),
  () => import('./components/HowToTrainPage'),
  () => import('./components/modules/ReadingModule'),
  () => import('./components/modules/ListeningModule'),
  () => import('./components/modules/WritingModule'),
  () => import('./components/modules/SpeakingModule'),
] as const;

function installRoutePreloadRecovery() {
  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    const now = Date.now();
    let lastRecovery = 0;
    try {
      lastRecovery = Number(sessionStorage.getItem(ROUTE_RECOVERY_KEY) || 0);
      sessionStorage.setItem(ROUTE_RECOVERY_KEY, String(now));
    } catch {
      // sessionStorage may be unavailable in restricted webviews.
    }
    if (now - lastRecovery >= 15000) window.location.reload();
  });

  window.setTimeout(() => {
    void Promise.allSettled(routePreloaders.map((load) => load()));
  }, 350);
}

installGermanSpeechPolicy();
installTextSizePreference();
initPwaInstall();
installRoutePreloadRecovery();

createRoot(document.getElementById('root')!).render(
  <StrictMode><App /></StrictMode>
);