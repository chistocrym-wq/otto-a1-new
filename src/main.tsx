import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { initializeLocale } from '@/lib/i18n';
import { startStudyReminderScheduler } from '@/lib/reminders';
import './index.css';
import './ottoPremiumSystem.css';
import './ottoPremiumVoice.css';

initializeLocale();
startStudyReminderScheduler();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
