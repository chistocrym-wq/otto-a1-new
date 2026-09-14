import type { ReadingTeil2Task } from '@/types';
import { Teil2OptionCard } from './Teil2OptionCard';

interface Teil2VisualProps {
  task: ReadingTeil2Task;
  selectedAnswer: 'a' | 'b' | null;
  onSelect: (answer: 'a' | 'b') => void;
  disabled: boolean;
}

export function Teil2Visual({
  task,
  selectedAnswer,
  onSelect,
  disabled,
}: Teil2VisualProps) {
  const statusFor = (answer: 'a' | 'b') => {
    if (selectedAnswer === null) return 'neutral' as const;
    if (answer === task.correctAnswer) return 'correct' as const;
    if (answer === selectedAnswer) return 'wrong' as const;
    return 'neutral' as const;
  };

  return (
    <div className="space-y-5">
      {/* Ситуация */}
      <div className="border border-slate-400 bg-white px-5 py-5">
        <div className="mb-2 text-[15px] font-semibold uppercase tracking-wide text-slate-500">
          Situation
        </div>

        <p className="text-[19px] font-medium leading-8 text-slate-900">
          {task.situation}
        </p>
      </div>

      {/* Два источника */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Teil2OptionCard
          option={task.options.a}
          label="A"
          status={statusFor('a')}
          onClick={() => onSelect('a')}
          disabled={disabled}
        />

        <Teil2OptionCard
          option={task.options.b}
          label="B"
          status={statusFor('b')}
          onClick={() => onSelect('b')}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
