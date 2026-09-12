import { cn } from '@/lib/utils';

export type BottomTab = 'home' | 'settings' | 'guides' | 'share' | 'support';

interface Props {
  active: BottomTab | null;
  onNavigate: (tab: BottomTab) => void;
}

function HomeIcon() {
  return <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M6 23 24 8l18 15v18H29V29H19v12H6V23Z" fill="currentColor" /></svg>;
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M20 5h8l2 6 5 2 6-2 4 7-4 5v6l4 5-4 7-6-2-5 2-2 6h-8l-2-6-5-2-6 2-4-7 4-5v-6l-4-5 4-7 6 2 5-2 2-6Z" fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
      <circle cx="24" cy="26" r="7" fill="none" stroke="currentColor" strokeWidth="3" />
    </svg>
  );
}

function CompassIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="18" fill="none" stroke="currentColor" strokeWidth="3" />
      <path d="m29.5 17.5-4 10-10 4 4-10 10-4Z" fill="currentColor" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="13" cy="24" r="5" fill="none" stroke="currentColor" strokeWidth="3" />
      <circle cx="35" cy="11" r="5" fill="none" stroke="currentColor" strokeWidth="3" />
      <circle cx="35" cy="37" r="5" fill="none" stroke="currentColor" strokeWidth="3" />
      <path d="m17 21 13-7M17 27l13 7" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function HelpIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="17" fill="currentColor" />
      <path d="M19 18c.8-4 4-6 8-6 5 0 8 3 8 7 0 5-5 6-7 9-.7 1-1 2.2-1 3.5" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" />
      <circle cx="26.5" cy="37" r="2" fill="white" />
    </svg>
  );
}

const items = [
  { id: 'home' as const, label: 'Главная', Icon: HomeIcon },
  { id: 'settings' as const, label: 'Настройки', Icon: SettingsIcon },
  { id: 'guides' as const, label: 'Гайды', Icon: CompassIcon },
  { id: 'share' as const, label: 'Поделиться', Icon: ShareIcon },
  { id: 'support' as const, label: 'Поддержка', Icon: HelpIcon },
];

export function BottomNav({ active, onNavigate }: Props) {
  return (
    <nav className="otto-bottom-nav" aria-label="Основная навигация">
      <div className="otto-bottom-nav-inner">
        {items.map(({ id, label, Icon }) => {
          const selected = active === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              className={cn('otto-bottom-nav-item', selected && 'is-active')}
              aria-current={selected ? 'page' : undefined}
              title={id === 'share' || id === 'support' ? 'Функция будет подключена позже' : undefined}
            >
              <span className="otto-bottom-nav-icon-wrap"><Icon /></span>
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
