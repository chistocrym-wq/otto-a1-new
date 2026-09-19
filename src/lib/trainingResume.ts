export interface TrainingResume {
  schreibenTeil1: number;
  schreibenTeil2: number;
  sprechenTeil2: number;
  sprechenFree: number;
  sprechenTeil3: number;
}

const KEY = 'otto-training-resume-v1';
const EMPTY: TrainingResume = { schreibenTeil1: 0, schreibenTeil2: 0, sprechenTeil2: 0, sprechenFree: 0, sprechenTeil3: 0 };

function safeNumber(value: unknown, max: number) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(max, Math.floor(number)));
}

export function readTrainingResume(): TrainingResume {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}') as Partial<TrainingResume>;
    return {
      schreibenTeil1: safeNumber(raw.schreibenTeil1, 999),
      schreibenTeil2: safeNumber(raw.schreibenTeil2, 999),
      sprechenTeil2: safeNumber(raw.sprechenTeil2, 999),
      sprechenFree: safeNumber(raw.sprechenFree, 999),
      sprechenTeil3: safeNumber(raw.sprechenTeil3, 999),
    };
  } catch {
    return { ...EMPTY };
  }
}

export function saveTrainingResume(patch: Partial<TrainingResume>) {
  try {
    const current = readTrainingResume();
    localStorage.setItem(KEY, JSON.stringify({ ...current, ...patch }));
  } catch {
    /* local persistence is best-effort */
  }
}
