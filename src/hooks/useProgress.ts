import { useCallback, useEffect, useState } from 'react';
import type { ActivityEntry, ModuleProgress, Progress } from '@/types';

const STORAGE_KEY = 'goethe-a1-progress';
const ACTIVITY_KEY = 'otto-a1-activity-v1';

function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function loadActivity(): ActivityEntry[] {
  try {
    const raw = localStorage.getItem(ACTIVITY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function useProgress() {
  const [progress, setProgress] = useState<Progress>(loadProgress);
  const [activity, setActivity] = useState<ActivityEntry[]>(loadActivity);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); } catch { /* ignore */ }
  }, [progress]);

  useEffect(() => {
    try { localStorage.setItem(ACTIVITY_KEY, JSON.stringify(activity)); } catch { /* ignore */ }
  }, [activity]);

  const recordScore = useCallback((key: string, score: number, total: number, durationSeconds = 0) => {
    if (!Number.isFinite(score) || !Number.isFinite(total) || total <= 0) return;
    const percentageResult = total === 100;
    const unitTotal = percentageResult ? 1 : total;
    const unitScore = percentageResult ? Math.max(0, Math.min(100, score)) / 100 : Math.max(0, Math.min(total, score));
    const scorePercent = Math.round((unitScore / unitTotal) * 100);

    setProgress((prev) => {
      const existing = prev[key];
      const answered = (existing?.answered ?? 0) + unitTotal;
      const correct = (existing?.correct ?? 0) + unitScore;
      const recentScores = [...(existing?.recentScores ?? []), scorePercent].slice(-8);
      return {
        ...prev,
        [key]: {
          completed: answered,
          total: answered,
          answered,
          correct,
          bestScore: Math.max(existing?.bestScore ?? 0, scorePercent),
          lastScore: scorePercent,
          attempts: (existing?.attempts ?? 0) + 1,
          recentScores,
        } as ModuleProgress,
      };
    });

    setActivity((prev) => [{
      id: `${Date.now()}-${key}`,
      module: key,
      score,
      total,
      percent: scorePercent,
      at: new Date().toISOString(),
      durationSeconds: Math.max(0, Math.min(30 * 60, Math.round(durationSeconds))),
    }, ...prev].slice(0, 300));
  }, []);

  const markCompleted = useCallback((key: string, total: number) => recordScore(key, total, total), [recordScore]);
  const resetProgress = useCallback(() => {
    setProgress({});
    setActivity([]);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(ACTIVITY_KEY);
  }, []);

  return { progress, activity, recordScore, markCompleted, resetProgress };
}
