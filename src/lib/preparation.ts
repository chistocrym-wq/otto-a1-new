import type { ActivityEntry, ModuleId, ModuleProgress, Progress } from '@/types';

export const MODULE_ORDER: ModuleId[] = ['schreiben', 'sprechen', 'horen', 'lesen'];

export const MODULE_META: Record<ModuleId, { title: string; label: string; icon: string }> = {
  schreiben: { title: 'Schreiben', label: 'Письмо', icon: '✍️' },
  sprechen: { title: 'Sprechen', label: 'Говорение', icon: '🗣️' },
  lesen: { title: 'Lesen', label: 'Чтение', icon: '📖' },
  horen: { title: 'Hören', label: 'Аудирование', icon: '👂' },
};

export interface ModuleReadiness {
  id: ModuleId;
  score: number;
  accuracy: number;
  recent: number;
  stability: number;
  attempts: number;
  answered: number;
  status: 'ready' | 'almost' | 'train';
  note: string;
}

export interface ReadinessSummary {
  overall: number;
  modules: Record<ModuleId, ModuleReadiness>;
  weakest: ModuleId;
  mockStatus: 'early' | 'try' | 'recommended';
  mockLabel: string;
  recommendation: string;
}

export interface PlanItem {
  module: ModuleId;
  title: string;
  detail: string;
  minutes: number;
  reason: string;
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function standardDeviation(values: number[]) {
  if (values.length < 2) return 0;
  const avg = average(values);
  return Math.sqrt(average(values.map((value) => (value - avg) ** 2)));
}

function getRecentScores(item?: ModuleProgress) {
  const stored = item?.recentScores?.filter(Number.isFinite) ?? [];
  if (stored.length) return stored.slice(-5);
  if (item?.attempts && Number.isFinite(item.lastScore)) return [item.lastScore];
  return [];
}

export function getModuleReadiness(id: ModuleId, item?: ModuleProgress): ModuleReadiness {
  const attempts = item?.attempts ?? 0;
  const answered = item?.answered ?? item?.completed ?? 0;
  const correct = item?.correct ?? 0;
  const accuracy = answered > 0 ? clamp(Math.round((correct / answered) * 100)) : 0;
  const recentScores = getRecentScores(item);
  const recent = recentScores.length ? Math.round(average(recentScores)) : accuracy;

  if (!attempts) {
    return {
      id,
      score: 0,
      accuracy: 0,
      recent: 0,
      stability: 0,
      attempts: 0,
      answered,
      status: 'train',
      note: id === 'schreiben' ? 'Начнём отсюда: после Otto Start первым идёт Schreiben.' : 'Пока недостаточно данных.',
    };
  }

  const stability = recentScores.length >= 3
    ? clamp(Math.round(100 - standardDeviation(recentScores) * 2.2))
    : Math.min(60, attempts * 20);
  const confidence = Math.min(1, attempts / 4);
  const raw = recent * 0.5 + accuracy * 0.3 + stability * 0.2;
  const score = clamp(Math.round(raw * (0.7 + confidence * 0.3)));
  const status = score >= 80 ? 'ready' : score >= 65 ? 'almost' : 'train';
  const note = status === 'ready'
    ? 'Результат уже достаточно уверенный и повторяется.'
    : status === 'almost'
      ? 'Почти готово — нужно ещё несколько устойчивых попыток.'
      : 'Сейчас этому навыку полезно уделить больше внимания.';

  return { id, score, accuracy, recent, stability, attempts, answered, status, note };
}

export function getReadiness(progress: Progress): ReadinessSummary {
  const moduleList = MODULE_ORDER.map((id) => getModuleReadiness(id, progress[id]));
  const modules = Object.fromEntries(moduleList.map((item) => [item.id, item])) as Record<ModuleId, ModuleReadiness>;
  const overall = Math.round(average(moduleList.map((item) => item.score)));
  const weakest = moduleList.reduce((a, b) => (b.score < a.score ? b : a)).id;
  const allStarted = moduleList.every((item) => item.attempts > 0);
  const noCriticalWeakness = moduleList.every((item) => item.score >= 65);
  const stableEnough = moduleList.every((item) => item.attempts >= 3);

  let mockStatus: ReadinessSummary['mockStatus'] = 'early';
  let mockLabel = 'Пока рано';
  if (allStarted && overall >= 60) {
    mockStatus = 'try';
    mockLabel = 'Можно попробовать';
  }
  if (overall >= 78 && noCriticalWeakness && stableEnough) {
    mockStatus = 'recommended';
    mockLabel = 'Рекомендуем пройти';
  }

  const weakMeta = MODULE_META[weakest];
  const recommendation = overall === 0
    ? 'Начните со Schreiben: письмо поможет сразу включить слова, фразы и структуру немецкого.'
    : `Сегодня больше внимания ${weakMeta.title}: сейчас это самый слабый из измеренных навыков.`;

  return { overall, modules, weakest, mockStatus, mockLabel, recommendation };
}

function taskCopy(module: ModuleId, firstRun: boolean) {
  if (module === 'schreiben') return firstRun
    ? { title: 'Первое письмо вместе с Отто', detail: 'Разобрать задание и написать одно короткое письмо.' }
    : { title: 'Schreiben', detail: 'Написать одно письмо и разобрать обратную связь Отто.' };
  if (module === 'sprechen') return { title: 'Sprechen', detail: 'Повторить несколько карточек и ответить голосом.' };
  if (module === 'horen') return { title: 'Hören', detail: 'Сделать короткую серию заданий на слух.' };
  return { title: 'Lesen', detail: 'Сделать короткую серию заданий на понимание текста.' };
}

export function buildDailyPlan(progress: Progress, minutes: 5 | 15 | 30): PlanItem[] {
  const readiness = getReadiness(progress);
  const ranked = MODULE_ORDER
    .map((id, index) => ({ id, score: readiness.modules[id].score, index }))
    .sort((a, b) => a.score - b.score || a.index - b.index);
  const firstRun = MODULE_ORDER.every((id) => (progress[id]?.attempts ?? 0) === 0);
  const sequence: ModuleId[] = firstRun
    ? ['schreiben', 'sprechen', 'horen', 'lesen']
    : ranked.map((item) => item.id);

  const slots = minutes === 5 ? [5] : minutes === 15 ? [7, 4, 4] : [10, 7, 7, 6];
  return slots.map((slot, index) => {
    const module = sequence[index % sequence.length];
    const copy = taskCopy(module, firstRun && module === 'schreiben');
    const metric = readiness.modules[module];
    const reason = metric.attempts === 0
      ? 'Этот навык ещё не измерен.'
      : metric.status === 'ready'
        ? 'Короткое повторение, чтобы результат оставался устойчивым.'
        : `Текущая тренировочная готовность: ${metric.score}%.`;
    return { module, minutes: slot, reason, ...copy };
  });
}

export function getTodayActivity(activity: ActivityEntry[]) {
  const now = new Date();
  const items = activity.filter((entry) => {
    const date = new Date(entry.at);
    return date.getFullYear() === now.getFullYear()
      && date.getMonth() === now.getMonth()
      && date.getDate() === now.getDate();
  });
  const attempts = items.length;
  const seconds = items.reduce((sum, entry) => sum + Math.max(0, entry.durationSeconds ?? 0), 0);
  const minutes = seconds ? Math.max(1, Math.round(seconds / 60)) : 0;
  const byModule = MODULE_ORDER.reduce((result, id) => {
    result[id] = items.filter((entry) => entry.module === id).length;
    return result;
  }, {} as Record<ModuleId, number>);
  return { attempts, minutes, byModule };
}

export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 6) return 'Доброй ночи';
  if (hour < 12) return 'Доброе утро';
  if (hour < 18) return 'Добрый день';
  return 'Добрый вечер';
}
