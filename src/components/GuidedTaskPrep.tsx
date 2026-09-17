import { Sparkles } from 'lucide-react';
import { HoverTranslateText } from '@/components/common/HoverTranslateText';
import { getStoredLearningMode } from '@/hooks/useUserProfile';

interface Props {
  focus: string;
  tip: string;
}

export function GuidedTaskPrep({ focus, tip }: Props) {
  if (getStoredLearningMode() !== 'guided' || !focus.trim()) return null;

  return (
    <aside className="mb-4 rounded-2xl border border-teal-100 bg-teal-50/70 p-4" aria-label="Подготовка перед заданием">
      <div className="flex items-center gap-2 text-teal-800"><Sparkles className="h-4 w-4" /><b className="text-sm">Перед заданием</b></div>
      <p className="mt-2 text-xs leading-5 text-slate-600">Разберите ключевую фразу. Нажмите на немецкие слова: Отто покажет значение в контексте и произнесёт выбранную конструкцию.</p>
      <div className="mt-3 rounded-xl bg-white px-3 py-2.5 text-sm font-bold leading-6 text-slate-900"><HoverTranslateText text={focus} /></div>
      <p className="mt-2 text-xs font-semibold leading-5 text-teal-900">{tip}</p>
    </aside>
  );
}
