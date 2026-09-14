export interface ReminderConfig {
  enabled: boolean;
  days: number[];
  time: string;
  lastSentDate?: string;
}

export const REMINDER_KEY = 'otto-a1-reminders-v1';
export const DEFAULT_REMINDER: ReminderConfig = { enabled: false, days: [1,2,3,4,5], time: '19:00' };

export function readReminderConfig(): ReminderConfig {
  try {
    const raw = JSON.parse(localStorage.getItem(REMINDER_KEY) || '{}') as Partial<ReminderConfig>;
    return {
      enabled: Boolean(raw.enabled),
      days: Array.isArray(raw.days) ? raw.days.map(Number).filter((d) => d >= 0 && d <= 6) : DEFAULT_REMINDER.days,
      time: /^([01]\d|2[0-3]):[0-5]\d$/.test(String(raw.time || '')) ? String(raw.time) : DEFAULT_REMINDER.time,
      lastSentDate: typeof raw.lastSentDate === 'string' ? raw.lastSentDate : undefined,
    };
  } catch { return { ...DEFAULT_REMINDER, days: [...DEFAULT_REMINDER.days] }; }
}

export function saveReminderConfig(config: ReminderConfig) {
  try { localStorage.setItem(REMINDER_KEY, JSON.stringify(config)); } catch { /* restricted webview */ }
  window.dispatchEvent(new CustomEvent('otto:reminders-changed'));
}

function localDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}

export function checkStudyReminder() {
  const config = readReminderConfig();
  if (!config.enabled || !config.days.includes(new Date().getDay())) return;
  const now = new Date();
  const [hour, minute] = config.time.split(':').map(Number);
  if (now.getHours() !== hour || now.getMinutes() !== minute) return;
  const today = localDateKey(now);
  if (config.lastSentDate === today) return;
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  new Notification('Время позаниматься с Отто', { body: 'Короткая тренировка A1 уже готова. Даже 5 минут сегодня считаются.' });
  saveReminderConfig({ ...config, lastSentDate: today });
}

export function startStudyReminderScheduler() {
  checkStudyReminder();
  const id = window.setInterval(checkStudyReminder, 30_000);
  return () => window.clearInterval(id);
}
