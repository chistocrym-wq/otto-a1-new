import { useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  CheckCircle2,
  CircleAlert,
  Eye,
  FileText,
  Lightbulb,
  Loader2,
  PenLine,
  Sparkles,
  X,
} from 'lucide-react';
import { schreibenTeil1Tasks } from '@/data/schreiben/teil1';
import { schreibenTeil2Tasks } from '@/data/schreiben/teil2';
import { CompactTranslationEye } from '@/components/common/CompactTranslationEye';
import { HoverTranslateText } from '@/components/common/HoverTranslateText';
import { recordWritingLearning } from '@/lib/learningProfile';
import { cn } from '@/lib/utils';

interface Props {
  onBack: () => void;
  onComplete: (score: number, total: number) => void;
}

type Screen = 'home' | 'teil1' | 'guided' | 'coach' | 'solo';
type WritingMode = 'guided' | 'coach' | 'solo';

interface AiPoint {
  point: string;
  earned: number;
  status: 'erfuellt' | 'teilweise' | 'fehlt';
  commentRu: string;
}

interface AiFeedback {
  score: number;
  earned: number;
  max: number;
  wordCount: number;
  contentPoints: AiPoint[];
  communication: { earned: number; commentRu: string };
  feedbackRu: string;
  feedbackDe: string;
  corrections: Array<{ original: string; corrected: string; explanation: string }>;
  recognizedText?: string;
}

interface ExamplePayload {
  example: string;
  noteRu: string;
}

function norm(value: string) {
  return value.toLocaleLowerCase('de-DE').replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/[^a-z0-9@]+/g, ' ').trim();
}

function matches(a: string, b: string) {
  const x = norm(a);
  const y = norm(b);
  return Boolean(x && y && (x === y || x.includes(y) || y.includes(x)));
}

function countWords(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function getPathStage() {
  try {
    const value = Number(localStorage.getItem('otto-schreiben-path-stage') || 1);
    return value === 2 || value === 3 ? value : 1;
  } catch {
    return 1;
  }
}

function setPathStage(value: 1 | 2 | 3) {
  try { localStorage.setItem('otto-schreiben-path-stage', String(value)); } catch { /* ignore */ }
}

const MODE_META: Record<WritingMode, { step: string; title: string; description: string }> = {
  guided: {
    step: 'Этап 1',
    title: 'Учусь на примере',
    description: 'Разберите задание, посмотрите короткий пример, закройте его и попробуйте воспроизвести письмо самостоятельно.',
  },
  coach: {
    step: 'Этап 2',
    title: 'Пишу вместе с Отто',
    description: 'Пишите сами, но используйте точечные подсказки, если застряли. После отправки Отто разберёт ошибки.',
  },
  solo: {
    step: 'Этап 3',
    title: 'Пишу сам',
    description: 'Без готового примера и без подсказок. Только задание, ваш текст и разбор после завершения.',
  },
};

export function WritingModule({ onBack, onComplete }: Props) {
  const [screen, setScreen] = useState<Screen>('home');
  const [pathStage, setStage] = useState(getPathStage);

  const openMode = (mode: WritingMode) => setScreen(mode);
  const finishStage = (mode: WritingMode) => {
    const nextStage: 1 | 2 | 3 = mode === 'guided' ? 2 : 3;
    if (nextStage > pathStage) {
      setStage(nextStage);
      setPathStage(nextStage);
    }
  };

  if (screen === 'home') {
    return <Home onBack={onBack} onOpen={setScreen} onOpenMode={openMode} pathStage={pathStage} />;
  }
  if (screen === 'teil1') {
    return <Teil1 onBack={() => setScreen('home')} onComplete={onComplete} />;
  }
  return <Teil2 mode={screen} onBack={() => setScreen('home')} onComplete={onComplete} onStageDone={() => finishStage(screen)} />;
}

function Home({
  onBack,
  onOpen,
  onOpenMode,
  pathStage,
}: {
  onBack: () => void;
  onOpen: (screen: Screen) => void;
  onOpenMode: (mode: WritingMode) => void;
  pathStage: number;
}) {
  const recommended: WritingMode = pathStage === 1 ? 'guided' : pathStage === 2 ? 'coach' : 'solo';
  const meta = MODE_META[recommended];

  return (
    <div className="animate-fade-in pb-8">
      <Header onBack={onBack} title="Schreiben A1" subtitle="От примера к самостоятельному письму" />

      <section className="rounded-[24px] border border-teal-100 bg-teal-50/70 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-teal-700"><Sparkles className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black uppercase tracking-[.14em] text-teal-700">Отто рекомендует продолжить</p>
            <h2 className="mt-1 text-xl font-black text-slate-950">{meta.title}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">{meta.description}</p>
          </div>
        </div>
        <button type="button" onClick={() => onOpenMode(recommended)} className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 font-black text-white">Продолжить Schreiben <ArrowRight className="h-4 w-4" /></button>
      </section>

      <section className="mt-5 rounded-[24px] border border-amber-200 bg-amber-50 p-4">
        <p className="text-xs font-black uppercase tracking-[.14em] text-amber-800">Перед первым письмом · 2 минуты</p>
        <h2 className="mt-1 font-black text-slate-950">Как устроено короткое письмо A1</h2>
        <div className="mt-3 grid gap-2 text-sm text-slate-700">
          <p className="rounded-xl bg-white/80 px-3 py-2"><b>1.</b> Anrede — обращение.</p>
          <p className="rounded-xl bg-white/80 px-3 py-2"><b>2.</b> Ответьте на все три пункта задания простыми фразами.</p>
          <p className="rounded-xl bg-white/80 px-3 py-2"><b>3.</b> Gruß — уместное прощание.</p>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-xl font-black text-slate-950">Путь Schreiben</h2>
        <div className="mt-3 space-y-3">
          {(['guided', 'coach', 'solo'] as WritingMode[]).map((mode, index) => {
            const item = MODE_META[mode];
            const unlocked = index + 1 <= pathStage;
            return (
              <button key={mode} type="button" onClick={() => onOpenMode(mode)} className={cn('w-full rounded-2xl border bg-white p-4 text-left shadow-sm', mode === recommended ? 'border-teal-300 ring-2 ring-teal-100' : 'border-slate-200')}>
                <div className="flex items-start gap-3">
                  <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black', unlocked ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-500')}>{index + 1}</span>
                  <span className="min-w-0 flex-1"><span className="text-xs font-black uppercase tracking-wider text-slate-400">{item.step}</span><strong className="mt-0.5 block text-base text-slate-950">{item.title}</strong><small className="mt-1 block text-sm leading-5 text-slate-500">{item.description}</small></span>
                  <ArrowRight className="mt-2 h-4 w-4 shrink-0 text-slate-300" />
                </div>
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-slate-500">Этапы не блокируются: если хотите, можно сразу попробовать самостоятельный режим.</p>
      </section>

      <section className="mt-6">
        <h2 className="text-xl font-black text-slate-950">Экзаменационная часть</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <PartCard icon={FileText} title="Teil 1 · Formular" text="Прочитайте ситуацию и заполните 5 недостающих данных." onClick={() => onOpen('teil1')} />
          <PartCard icon={PenLine} title="Teil 2 · Brief" text="Тренируйте письма по трём обязательным пунктам в любом из трёх режимов выше." onClick={() => onOpenMode(recommended)} />
        </div>
      </section>
    </div>
  );
}

function Teil1({ onBack, onComplete }: { onBack: () => void; onComplete: (score: number, total: number) => void }) {
  const [index, setIndex] = useState(0);
  const [draft, setDraft] = useState<Record<number, string>>({});
  const [result, setResult] = useState<Record<number, boolean> | null>(null);
  const task = schreibenTeil1Tasks[index];
  const editable = task.rows.map((row, rowIndex) => ({ row, rowIndex })).filter(({ row }) => Boolean(row.answer));

  const check = () => {
    const next: Record<number, boolean> = {};
    editable.forEach(({ row, rowIndex }) => { next[rowIndex] = matches(draft[rowIndex] || '', row.answer || ''); });
    setResult(next);
  };

  const next = () => {
    const score = result ? Object.values(result).filter(Boolean).length : 0;
    onComplete(score, editable.length || 5);
    if (index === schreibenTeil1Tasks.length - 1) {
      setIndex(0);
      setDraft({});
      setResult(null);
      onBack();
      return;
    }
    setIndex((value) => value + 1);
    setDraft({});
    setResult(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="animate-fade-in pb-8">
      <Header onBack={onBack} title="Schreiben · Teil 1" subtitle={`Задание ${index + 1} из ${schreibenTeil1Tasks.length}`} />
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div><h2 className="text-xl font-black text-slate-950">{task.title}</h2><p className="mt-2 text-sm leading-6 text-slate-700"><HoverTranslateText text={task.scenario} /></p></div>
          <CompactTranslationEye parts={[task.scenario, task.instruction]} />
        </div>
        <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-700"><HoverTranslateText text={task.instruction} /></p>
      </section>
      <section className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="divide-y divide-slate-100">
          {task.rows.map((row, rowIndex) => (
            <div key={`${row.label}-${rowIndex}`} className="grid grid-cols-[minmax(100px,.8fr)_minmax(0,1.2fr)] items-center gap-3 px-4 py-3 sm:grid-cols-[220px_1fr]">
              <label className="text-sm font-semibold text-slate-700">{row.label}</label>
              {row.answer ? (
                <div>
                  <input value={draft[rowIndex] || ''} onChange={(event) => { setDraft((value) => ({ ...value, [rowIndex]: event.target.value })); setResult(null); }} disabled={Boolean(result)} className={cn('min-h-11 w-full rounded-xl border px-3 py-2 outline-none', result?.[rowIndex] === true && 'border-emerald-400 bg-emerald-50', result?.[rowIndex] === false && 'border-rose-400 bg-rose-50')} />
                  {result?.[rowIndex] === false && <p className="mt-1 text-xs text-rose-700">Правильно: {row.answer}</p>}
                </div>
              ) : <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">{row.value}</div>}
            </div>
          ))}
        </div>
      </section>
      <div className="mt-5 flex justify-end">
        {!result ? <button onClick={check} disabled={editable.some(({ rowIndex }) => !(draft[rowIndex] || '').trim())} className="min-h-12 rounded-xl bg-slate-900 px-6 font-bold text-white disabled:opacity-40">Проверить</button> : <button onClick={next} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-slate-900 px-6 font-bold text-white">{index === schreibenTeil1Tasks.length - 1 ? 'Завершить' : 'Следующее'}<ArrowRight className="h-4 w-4" /></button>}
      </div>
    </div>
  );
}

function Teil2({
  mode,
  onBack,
  onComplete,
  onStageDone,
}: {
  mode: WritingMode;
  onBack: () => void;
  onComplete: (score: number, total: number) => void;
  onStageDone: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [hint, setHint] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState<AiFeedback | null>(null);
  const [image, setImage] = useState('');
  const [imageName, setImageName] = useState('');
  const [example, setExample] = useState<ExamplePayload | null>(null);
  const [exampleLoading, setExampleLoading] = useState(false);
  const [exampleClosed, setExampleClosed] = useState(mode !== 'guided');
  const fileRef = useRef<HTMLInputElement>(null);
  const task = schreibenTeil2Tasks[index];
  const text = drafts[task.id] || '';
  const meta = MODE_META[mode];

  const setText = (value: string) => {
    setDrafts((draft) => ({ ...draft, [task.id]: value }));
    setFeedback(null);
    setError('');
  };

  const loadExample = async () => {
    if (exampleLoading || example) return;
    setExampleLoading(true);
    setError('');
    try {
      const response = await fetch('/api/schreiben-example', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situation: task.situation, points: task.points }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'Не удалось подготовить пример.');
      setExample(payload as ExamplePayload);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось подготовить пример.');
    } finally {
      setExampleLoading(false);
    }
  };

  const chooseImage = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Выберите фото письма.'); return; }
    if (file.size > 6 * 1024 * 1024) { setError('Фото слишком большое. Максимум 6 МБ.'); return; }
    const reader = new FileReader();
    reader.onload = () => { setImage(String(reader.result || '')); setImageName(file.name); setFeedback(null); setError(''); };
    reader.readAsDataURL(file);
  };

  const check = async () => {
    if ((!text.trim() && !image) || loading) return;
    setLoading(true);
    setError('');
    setFeedback(null);
    try {
      const response = await fetch('/api/check-schreiben', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, situation: task.situation, points: task.points, imageDataUrl: image }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'Не удалось проверить письмо.');
      const checked = payload as AiFeedback;
      setFeedback(checked);
      const learningText = text.trim() || checked.recognizedText || '';
      if (!text.trim() && checked.recognizedText) setDrafts((draft) => ({ ...draft, [task.id]: String(checked.recognizedText) }));
      if (learningText) recordWritingLearning(learningText, checked);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось проверить письмо.');
    } finally {
      setLoading(false);
    }
  };

  const next = () => {
    if (!feedback) return;
    onComplete(feedback.score, 100);
    onStageDone();
    if (index === schreibenTeil2Tasks.length - 1) {
      onBack();
      return;
    }
    setIndex((value) => value + 1);
    setHint(false);
    setFeedback(null);
    setError('');
    setImage('');
    setImageName('');
    setExample(null);
    setExampleClosed(mode !== 'guided');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const canWrite = mode !== 'guided' || exampleClosed;

  return (
    <div className="animate-fade-in pb-8">
      <Header onBack={onBack} title={`Schreiben · ${meta.title}`} subtitle={`Письмо ${index + 1} из ${schreibenTeil2Tasks.length}`} />

      <div className="mb-4 rounded-2xl border border-teal-100 bg-teal-50/70 p-3 text-sm leading-6 text-slate-700"><b className="text-teal-800">{meta.step}.</b> {meta.description}</div>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0"><p className="text-xs font-black uppercase tracking-wider text-amber-800">Aufgabe {task.number}</p><p className="mt-2 text-[15px] leading-7 text-slate-900"><HoverTranslateText text={task.situation} /></p></div>
          {mode !== 'solo' && <CompactTranslationEye parts={[task.situation, ...task.points]} />}
        </div>
        <ul className="mt-4 space-y-2">{task.points.map((point, pointIndex) => <li key={point} className="rounded-xl bg-white/80 px-3 py-2 text-sm font-semibold text-slate-800"><HoverTranslateText text={`${pointIndex + 1}. ${point}`} /></li>)}</ul>
      </section>

      {mode === 'guided' && !exampleClosed && (
        <section className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 p-4 sm:p-5">
          <div className="flex items-start gap-3"><Eye className="mt-0.5 h-5 w-5 shrink-0 text-sky-700" /><div><p className="text-xs font-black uppercase tracking-wider text-sky-800">Посмотрел → закрыл → попробовал сам</p><h2 className="mt-1 text-lg font-black text-slate-950">Сначала разберите хороший пример</h2><p className="mt-1 text-sm leading-6 text-slate-600">На слова в примере можно нажимать: увидите перевод и сможете услышать произношение.</p></div></div>
          {!example ? (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <button type="button" onClick={loadExample} disabled={exampleLoading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-800 px-4 font-bold text-white disabled:opacity-50">{exampleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}{exampleLoading ? 'Отто готовит пример…' : 'Показать пример'}</button>
              <button type="button" onClick={() => setExampleClosed(true)} className="min-h-11 rounded-xl border border-sky-300 bg-white px-4 font-bold text-sky-900">Сразу попробовать самой</button>
            </div>
          ) : (
            <div className="mt-4">
              <div className="whitespace-pre-wrap rounded-2xl bg-white p-4 text-[15px] leading-7 text-slate-900 shadow-sm"><HoverTranslateText text={example.example} /></div>
              <p className="mt-2 text-xs leading-5 text-sky-900">💡 {example.noteRu}</p>
              <button type="button" onClick={() => setExampleClosed(true)} className="mt-3 min-h-11 w-full rounded-xl bg-slate-950 px-4 font-black text-white">Закрыть пример и написать самой</button>
            </div>
          )}
        </section>
      )}

      {mode === 'coach' && (
        <>
          <button type="button" onClick={() => setHint((value) => !value)} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm font-bold text-amber-900"><Lightbulb className="h-4 w-4" />{hint ? 'Скрыть подсказку' : 'Нужна маленькая подсказка'}</button>
          {hint && <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-4"><p className="mb-2 text-xs font-black uppercase tracking-wider text-amber-800">Отто подсказывает только нужную конструкцию</p>{task.points.map((point, pointIndex) => <p key={point} className="mt-1 text-sm leading-6 text-slate-700">{pointIndex + 1}. <HoverTranslateText text={hintFor(point)} /></p>)}</div>}
        </>
      )}

      {canWrite && (
        <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-bold text-slate-700">Ваш ответ · {countWords(text)} слов</span>
            <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700"><Camera className="h-4 w-4" />Добавить фото письма</button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(event) => chooseImage(event.target.files?.[0])} />
          </div>
          {imageName && <div className="mb-3 flex items-center justify-between rounded-xl bg-sky-50 px-3 py-2 text-sm text-sky-800"><span className="truncate">Фото: {imageName}</span><button onClick={() => { setImage(''); setImageName(''); }} aria-label="Удалить фото"><X className="h-4 w-4" /></button></div>}
          <textarea value={text} onChange={(event) => setText(event.target.value)} placeholder={mode === 'solo' ? 'Напишите письмо без подсказок…' : 'Теперь попробуйте написать письмо сами…'} className="min-h-[210px] w-full resize-y rounded-xl border border-slate-300 p-4 text-base leading-7 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100" />
          <p className="mt-2 text-xs text-slate-500">Отто проверит выполнение всех трёх пунктов, структуру, понятность и реальные ошибки уровня A1.</p>
        </section>
      )}

      {error && <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}

      {canWrite && !feedback && <div className="mt-5 flex justify-end"><button type="button" onClick={check} disabled={loading || (!text.trim() && !image)} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-slate-900 px-6 font-bold text-white disabled:opacity-40">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}{loading ? 'Отто проверяет…' : 'Проверить с Отто'}</button></div>}

      {feedback && <Feedback data={feedback} />}
      {feedback && <div className="mt-5 flex justify-end"><button onClick={next} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-teal-700 px-6 font-bold text-white">{index === schreibenTeil2Tasks.length - 1 ? 'Завершить' : 'Следующее письмо'}<ArrowRight className="h-4 w-4" /></button></div>}
    </div>
  );
}

function Feedback({ data }: { data: AiFeedback }) {
  const [fixing, setFixing] = useState(false);
  const [fixes, setFixes] = useState<Record<number, string>>({});
  const [fixChecked, setFixChecked] = useState(false);
  const goodPoints = data.contentPoints?.filter((point) => point.status === 'erfuellt') ?? [];
  const problemPoints = data.contentPoints?.filter((point) => point.status !== 'erfuellt') ?? [];

  return (
    <section className="mt-5 space-y-4 rounded-2xl border border-teal-200 bg-teal-50 p-4 sm:p-5">
      <div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-wider text-teal-800">Проверка Отто</p><h3 className="text-2xl font-black text-slate-950">{data.score}%</h3></div><CheckCircle2 className="h-8 w-8 text-teal-700" /></div>

      {data.recognizedText && <div className="rounded-xl bg-white p-3 text-sm"><b>Распознано с фото:</b><p className="mt-1 whitespace-pre-wrap text-slate-700">{data.recognizedText}</p></div>}

      <div className="rounded-2xl bg-white p-4">
        <h4 className="font-black text-emerald-800">Хорошо</h4>
        <div className="mt-2 space-y-2 text-sm text-slate-700">
          {goodPoints.map((point, index) => <p key={`${point.point}-${index}`}>✓ {point.point}: {point.commentRu}</p>)}
          {data.communication?.earned >= 0.5 && <p>✓ Структура письма: {data.communication.commentRu}</p>}
          {!goodPoints.length && data.communication?.earned < 0.5 && <p>Сначала закрепим базовую структуру — это нормально для тренировки.</p>}
        </div>
      </div>

      {(problemPoints.length > 0 || data.corrections?.length > 0 || data.communication?.earned < 1) && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <h4 className="flex items-center gap-2 font-black text-amber-900"><CircleAlert className="h-4 w-4" />Исправим</h4>
          {problemPoints.map((point, index) => <p key={`${point.point}-${index}`} className="mt-2 text-sm leading-6 text-slate-700">• {point.point}: {point.commentRu}</p>)}
          {data.communication?.earned < 1 && <p className="mt-2 text-sm leading-6 text-slate-700">• Структура: {data.communication.commentRu}</p>}
          {data.corrections?.map((correction, index) => (
            <div key={`${correction.original}-${index}`} className="mt-3 rounded-xl bg-white p-3">
              <p className="text-sm"><span className="text-rose-700 line-through">{correction.original}</span></p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{correction.explanation}</p>
              {fixing && !fixChecked && <input value={fixes[index] || ''} onChange={(event) => setFixes((value) => ({ ...value, [index]: event.target.value }))} placeholder="Исправьте эту фразу сами" className="mt-2 min-h-10 w-full rounded-lg border border-amber-200 px-3 text-sm outline-none focus:border-amber-500" />}
              {fixChecked && <div className="mt-2"><p className={cn('text-xs font-bold', matches(fixes[index] || '', correction.corrected) ? 'text-emerald-700' : 'text-amber-800')}>{matches(fixes[index] || '', correction.corrected) ? '✓ Получилось' : 'Вариант Отто:'}</p><p className="mt-1 text-sm font-semibold text-emerald-700">{correction.corrected}</p></div>}
            </div>
          ))}
          {data.corrections?.length > 0 && !fixing && <button type="button" onClick={() => setFixing(true)} className="mt-3 min-h-10 w-full rounded-xl bg-amber-900 px-4 text-sm font-black text-white">Попробовать исправить самой</button>}
          {data.corrections?.length > 0 && fixing && !fixChecked && <button type="button" onClick={() => setFixChecked(true)} disabled={data.corrections.some((_, index) => !(fixes[index] || '').trim())} className="mt-3 min-h-10 w-full rounded-xl bg-amber-900 px-4 text-sm font-black text-white disabled:opacity-40">Проверить мои исправления</button>}
        </div>
      )}

      <div className="rounded-xl bg-white p-3 text-sm leading-6 text-slate-700"><b>Подсказка Отто:</b> {data.feedbackRu}</div>
    </section>
  );
}

function hintFor(point: string) {
  const value = point.toLowerCase();
  if (value.includes('preis') || value.includes('kost')) return 'Wie viel kostet der Kurs?';
  if (value.includes('wann') || value.includes('termin')) return 'Wann können wir uns treffen?';
  if (value.includes('warum')) return 'Ich schreibe, weil …';
  if (value.includes('hotel')) return 'Bitte schicken Sie mir Hoteladressen.';
  if (value.includes('information')) return 'Bitte schicken Sie mir Informationen.';
  if (value.includes('dank')) return 'Vielen Dank für die Einladung.';
  if (value.includes('nicht kommen') || value.includes('leider')) return 'Leider kann ich nicht kommen.';
  if (value.includes('helfen') || value.includes('hilfe')) return 'Können Sie mir bitte helfen?';
  if (value.startsWith('wo')) return 'Wo treffen wir uns?';
  if (value.includes('tage') || value.includes('arbeiten')) return 'Ich kann am Montag und Mittwoch.';
  return `Ich möchte gern wissen: ${point.replace(/\.$/, '')}?`;
}

function Header({ onBack, title, subtitle }: { onBack: () => void; title: string; subtitle: string }) {
  return <div className="mb-5 flex items-center gap-3"><button type="button" onClick={onBack} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white"><ArrowLeft className="h-5 w-5 text-slate-600" /></button><div className="min-w-0"><h1 className="break-words text-2xl font-black text-slate-950">{title}</h1><p className="text-sm text-slate-500">{subtitle}</p></div></div>;
}

function PartCard({ icon: Icon, title, text, onClick }: { icon: typeof FileText; title: string; text: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="min-h-[170px] rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-amber-300 hover:shadow-lg"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50"><Icon className="h-6 w-6 text-amber-700" /></span><h2 className="mt-4 text-xl font-black text-slate-950">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p></button>;
}
