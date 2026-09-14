import { BookOpen, Home, Settings, Target, UserRound } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OttoProductMode } from '@/lib/productMode';

export type BottomTab = 'home' | 'modules' | 'readiness' | 'account' | 'settings';

interface Props {
  active: BottomTab;
  onNavigate: (tab: BottomTab) => void;
  mode?: OttoProductMode;
}

const fullItems = [
  { id: 'home' as const, label: 'Сегодня', icon: Home },
  { id: 'modules' as const, label: 'Разделы', icon: BookOpen },
  { id: 'readiness' as const, label: 'Готовность', icon: Target },
  { id: 'account' as const, label: 'Кабинет', icon: UserRound },
  { id: 'settings' as const, label: 'Настройки', icon: Settings },
];

const basicItems = [
  { id: 'home' as const, label: 'Главная', icon: Home },
  { id: 'modules' as const, label: 'Разделы', icon: BookOpen },
  { id: 'account' as const, label: 'Кабинет', icon: UserRound },
  { id: 'settings' as const, label: 'Настройки', icon: Settings },
];

export function BottomNav({ active, onNavigate, mode = 'full' }: Props) {
  const items = mode === 'basic' ? basicItems : fullItems;
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
