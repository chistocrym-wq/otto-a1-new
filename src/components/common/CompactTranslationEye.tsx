import { useMemo, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  parts: string[];
  translations?: string[];
  className?: string;
  title?: string;
}

function keyFor(parts: string[]) {
  let h = 2166136261;
  for (const ch of parts.join('|')) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return `otto-eye-${(h >>> 0).toString(16)}`;
}

export function CompactTranslationEye({ parts, translations: preset, className, title = 'Перевод' }: Props) {
  const clean = useMemo(() => parts.map(String).map((v) => v.trim()).filter(Boolean), [parts]);
  const key = useMemo(() => keyFor(clean), [clean]);
  const validPreset = preset && preset.length === clean.length ? preset : null;
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [translations, setTranslations] = useState<string[] | null>(() => {
    if (validPreset) return validPreset;
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : null;
    } catch {
      return null;
    }
  });

  const load = async () => {
    if (translations || loading || !clean.length) return;
    setLoading(true);
    setError('');
    try {
      const r = await fetch('/api/translate-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parts: clean }),
      });
      const p = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(p.error || 'Перевод недоступен');
      const t = Array.isArray(p.translations) ? p.translations.map(String) : [];
      if (t.length !== clean.length) throw new Error('Перевод пришёл не полностью');
      setTranslations(t);
      try { localStorage.setItem(key, JSON.stringify(t)); } catch { /* ignore */ }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Перевод недоступен');
    } finally {
      setLoading(false);
    }
  };

  const toggle = () => {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    void load();
  };

  return (
    <div className={cn('shrink-0 text-right', className)}>
      <button
        type="button"
        onClick={toggle}
        aria-label={open ? 'Скрыть перевод' : 'Показать перевод'}
        title={open ? 'Скрыть перевод' : 'Показать перевод'}
        className={cn(
          'inline-flex h-10 w-10 items-center justify-center rounded-xl border transition',
          open ? 'border-slate-300 bg-white text-teal-800' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
        )}
      >
        {open ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>

      {open && (translations?.length || error) ? (
        <div className="mt-2 max-w-[300px] text-left text-sm leading-6 text-slate-600">
          <span className="sr-only">{title}</span>
          {error && <p className="text-rose-700">{error}</p>}
          {translations?.map((t, i) => <p key={i} className={i ? 'mt-1' : ''}>{t}</p>)}
        </div>
      ) : null}
    </div>
  );
}
