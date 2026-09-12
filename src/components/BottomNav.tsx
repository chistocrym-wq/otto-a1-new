import { CircleHelp, Compass, Home, Settings, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type BottomTab = 'home' | 'settings' | 'guides' | 'share' | 'support';

interface Props {
  active: BottomTab | null;
  onNavigate: (tab: BottomTab) => void;
}

const items = [
  { id: 'home' as const, label: 'Главная', icon: Home },
  { id: 'settings' as const, label: 'Настройки', icon: Settings },
  { id: 'guides' as const, label: 'Гайды', icon: Compass },
  { id: 'share' as const, label: 'Поделиться', icon: Share2 },
  { id: 'support' as const, label: 'Поддержка', icon: CircleHelp },
];

export function BottomNav({ active, onNavigate }: Props) {
  return (
    <nav className="otto-bottom-nav" aria-label="Основная навигация">
      <div className="otto-bottom-nav-inner">
        {items.map(({ id, label, icon: Icon }) => {
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
              <Icon className="otto-bottom-nav-icon" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
