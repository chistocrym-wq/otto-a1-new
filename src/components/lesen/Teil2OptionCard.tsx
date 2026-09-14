import type { LesenTeil2Option } from '@/types';

interface Teil2OptionCardProps {
  option: LesenTeil2Option;
  label: 'A' | 'B';
  selected: boolean;
  correct: boolean;
  revealed: boolean;
  onClick: () => void;
  disabled: boolean;
}

export function Teil2OptionCard({
  option,
  label,
  selected,
  correct,
  revealed,
  onClick,
  disabled,
}: Teil2OptionCardProps) {
  const stateClass = revealed
    ? correct
      ? 'ring-2 ring-emerald-500'
      : selected
        ? 'ring-2 ring-red-500'
        : ''
    : 'hover:ring-1 hover:ring-slate-300';

  const cardClass = revealed
    ? correct
      ? 'border-emerald-500 bg-emerald-50'
      : selected
        ? 'border-red-500 bg-red-50'
        : 'border-slate-400 bg-white'
    : 'border-slate-400 bg-white';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full text-left transition-all ${stateClass}`}
    >
      <div className={`border ${cardClass}`}>
        <div className="border-b border-slate-300 bg-slate-50 px-4 py-3">
          <div className="text-[18px] font-bold text-slate-900">
            {label}
          </div>
        </div>

        <div className="px-5 py-5">
          <div className="mb-3 text-[18px] font-semibold leading-7 text-slate-900">
            {option.title}
          </div>

          <p className="whitespace-pre-line text-[18px] leading-8 text-slate-900">
            {option.text}
          </p>
        </div>
      </div>
    </button>
  );
}
