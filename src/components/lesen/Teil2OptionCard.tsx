import type { LesenTeil2Option } from '@/types';

interface Teil2OptionCardProps {
  option: LesenTeil2Option;
  label: 'A' | 'B';
  status: 'neutral' | 'correct' | 'wrong';
  onClick: () => void;
  disabled: boolean;
}

export function Teil2OptionCard({
  option,
  label,
  status,
  onClick,
  disabled,
}: Teil2OptionCardProps) {
  const stateClass =
    status === 'correct'
      ? 'ring-2 ring-emerald-500'
      : status === 'wrong'
        ? 'ring-2 ring-red-500'
        : 'hover:ring-1 hover:ring-slate-300';

  const cardClass =
    status === 'correct'
      ? 'border-emerald-400 bg-emerald-50'
      : status === 'wrong'
        ? 'border-red-400 bg-red-50'
        : 'border-slate-400 bg-white';

  const headerClass =
    status === 'correct'
      ? 'border-emerald-300 bg-emerald-100'
      : status === 'wrong'
        ? 'border-red-300 bg-red-100'
        : 'border-slate-300 bg-slate-50';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full text-left transition-all ${stateClass}`}
    >
      <div className={`border ${cardClass}`}>
        <div className={`border-b px-4 py-3 ${headerClass}`}>
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
