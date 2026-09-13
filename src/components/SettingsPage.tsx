import { useState } from 'react';
import { Bell, ChevronDown, Globe2, Smartphone, Volume2 } from 'lucide-react';
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
    details: 'Аудио Hören воспроизводится внутри задания. Доступ к микрофону запрашивается только там, где он действительно нужен. Разрешение можно изменить в настройках Telegram или браузера.',
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

export function SettingsPage() {
  const [open, setOpen] = useState<ItemId | null>('language');

  return (
    <div className="otto-hub-screen otto-settings-screen animate-fade-in">
      <section className="otto-page-hero">
        <div>
          <p className="otto-kicker">Настройки</p>
          <h1>Тренажёр OTTO</h1>
          <p className="mt-1 max-w-lg text-sm text-slate-600">Все пункты ниже открываются и объясняют, как соответствующая функция работает в приложении.</p>
        </div>
        <div className="otto-page-hero-character" aria-hidden="true"><OttoScene scene="guide" className="otto-page-hero-scene" /></div>
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
              <span className="otto-setting-copy">
                <strong>{title}</strong>
                <small>{subtitle}</small>
                {expanded && <span className="otto-setting-details">{details}</span>}
              </span>
              <ChevronDown className="otto-setting-chevron" aria-hidden="true" />
            </button>
          );
        })}
      </section>
    </div>
  );
}
