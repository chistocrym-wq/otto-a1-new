import { useState } from 'react';
import { Bell, ChevronDown, Globe2, Play, Smartphone, Volume1, Volume2 } from 'lucide-react';
import { OttoScene } from '@/components/OttoScene';

const items = [
  {
    id: 'language',
    title: 'Язык интерфейса',
    subtitle: 'Русский · перевод немецких заданий по кнопке с глазом',
    details: 'Основной интерфейс OTTO сейчас работает на русском языке. В учебных заданиях немецкий текст можно перевести прямо в карточке через значок глаза — перевод открывается поверх задания и не меняет его содержание.',
    icon: Globe2,
  },
  {
    id: 'audio',
    title: 'Звук и микрофон',
    subtitle: 'Используются в Hören и Sprechen',
    details: 'Аудио Hören воспроизводится внутри задания и может использовать разные голоса, как на реальном экзамене. Фирменные подсказки Отто используют один выбранный немецкий голос. Доступ к микрофону запрашивается только там, где он действительно нужен.',
    icon: Volume2,
  },
  {
    id: 'notifications',
    title: 'Уведомления',
    subtitle: 'Управляются Telegram или браузером',
    details: 'У OTTO нет скрытого внутреннего переключателя уведомлений. Разрешения на уведомления настраиваются средствами Telegram или браузера, поэтому здесь показано фактическое поведение приложения.',
    icon: Bell,
  },
  {
    id: 'install',
    title: 'Установка приложения',
    subtitle: 'Можно добавить OTTO на главный экран телефона',
    details: 'Откройте меню браузера или Telegram и выберите «Добавить на главный экран» / «Установить приложение», если этот пункт доступен на устройстве. После установки OTTO запускается как отдельное приложение.',
    icon: Smartphone,
  },
] as const;

type ItemId = (typeof items)[number]['id'];
type SpeechMode = 'normal' | 'slow';
type OttoSpeechApi = {
  play?: (text: string, options?: { mode?: SpeechMode }) => Promise<boolean>;
  setMode?: (mode: SpeechMode) => void;
  getMode?: () => SpeechMode;
};

function speechApi() {
  return (window as Window & { OttoSpeech?: OttoSpeechApi }).OttoSpeech;
}

export function SettingsPage() {
  const [open, setOpen] = useState<ItemId | null>('language');
  const [voiceMode, setVoiceMode] = useState<SpeechMode>(() => {
    try { return localStorage.getItem('ottoSpeechModeV1') === 'slow' ? 'slow' : 'normal'; }
    catch { return 'normal'; }
  });

  const changeVoiceMode = (mode: SpeechMode) => {
    setVoiceMode(mode);
    speechApi()?.setMode?.(mode);
    try { localStorage.setItem('ottoSpeechModeV1', mode); } catch {}
  };

  const testVoice = () => {
    const text = 'Hallo. Ich heiße Otto. Schön, dass du da bist.';
    void speechApi()?.play?.(text, { mode: voiceMode });
  };

  return (
    <div className="otto-hub-screen otto-settings-screen animate-fade-in">
      <section className="otto-page-hero">
        <div>
          <p className="otto-kicker">Настройки</p>
          <h1>Тренажёр OTTO</h1>
          <p className="mt-1 max-w-lg text-sm text-slate-600">Комфортная скорость речи, понятные настройки и только те разрешения, которые действительно нужны для обучения.</p>
        </div>
        <div className="otto-page-hero-character" aria-hidden="true"><OttoScene scene="guide" className="otto-page-hero-scene" /></div>
      </section>

      <section className="otto-voice-settings" aria-labelledby="otto-voice-heading">
        <div className="otto-voice-heading-row">
          <span className="otto-setting-icon"><Volume2 /></span>
          <div>
            <p className="otto-kicker">Фирменный голос</p>
            <h2 id="otto-voice-heading">Как говорит Отто</h2>
          </div>
        </div>
        <p className="otto-voice-copy">Выбери естественный темп или чуть более медленную речь. Медленный режим сохраняет нормальный немецкий ритм — звуки не растягиваются искусственно.</p>
        <div className="otto-voice-mode" role="group" aria-label="Скорость немецкой речи">
          <button type="button" className={voiceMode === 'normal' ? 'is-active' : ''} onClick={() => changeVoiceMode('normal')} aria-pressed={voiceMode === 'normal'}><Volume2 aria-hidden="true" />Нормально</button>
          <button type="button" className={voiceMode === 'slow' ? 'is-active' : ''} onClick={() => changeVoiceMode('slow')} aria-pressed={voiceMode === 'slow'}><Volume1 aria-hidden="true" />Медленнее</button>
        </div>
        <button type="button" className="otto-voice-test" onClick={testVoice}><Play aria-hidden="true" />Послушать голос Отто</button>
        <p className="otto-voice-disclosure">Основная озвучка Отто создаётся AI‑голосом. Если нейросинтез временно недоступен, приложение автоматически использует лучший немецкий голос устройства. Записи Hören остаются отдельными экзаменационными аудиоматериалами.</p>
      </section>

      <section className="otto-settings-list" aria-label="Настройки приложения">
        {items.map(({ id, title, subtitle, details, icon: Icon }) => {
          const expanded = open === id;
          return (
            <button
              key={id}
              type="button"
              className={`otto-setting-row otto-setting-action${expanded ? ' is-open' : ''}`}
              onClick={() => setOpen(expanded ? null : id)}
              aria-expanded={expanded}
            >
              <span className="otto-setting-icon"><Icon /></span>
              <div className="otto-setting-copy">
                <strong>{title}</strong>
                <small>{subtitle}</small>
                {expanded && <span className="otto-setting-details">{details}</span>}
              </div>
              <ChevronDown className="otto-setting-chevron" aria-hidden="true" />
            </button>
          );
        })}
      </section>
    </div>
  );
}
