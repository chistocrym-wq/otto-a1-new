import { useEffect, useState } from 'react';
import { OttoScene } from '@/components/OttoScene';

type SplashPhase = 'ghost' | 'color' | 'leaving';

const SPLASH_KEY = 'otto-a1-premium-splash-seen-v1';

export function OttoSplash() {
  const [active, setActive] = useState(true);
  const [phase, setPhase] = useState<SplashPhase>('ghost');
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    let seen = false;
    try {
      seen = localStorage.getItem(SPLASH_KEY) === '1';
      localStorage.setItem(SPLASH_KEY, '1');
    } catch {
      // Storage can be blocked in a private or restricted webview.
    }

    setCompact(seen);
    const colorAt = seen ? 90 : 280;
    const leaveAt = seen ? 650 : 1320;
    const finishAt = seen ? 980 : 1820;

    const colorTimer = window.setTimeout(() => setPhase('color'), colorAt);
    const leaveTimer = window.setTimeout(() => setPhase('leaving'), leaveAt);
    const finishTimer = window.setTimeout(() => setActive(false), finishAt);

    return () => {
      window.clearTimeout(colorTimer);
      window.clearTimeout(leaveTimer);
      window.clearTimeout(finishTimer);
    };
  }, []);

  if (!active) return null;

  return (
    <div className={`otto-splash-screen is-${phase} ${compact ? 'is-compact' : 'is-full'}`} aria-hidden="true">
      <div className="otto-splash-glow" />
      <div className="otto-splash-figure">
        <div className="otto-splash-bust">
          <OttoScene scene="home" className="otto-splash-otto" eager />
        </div>
        <div className="otto-splash-brand">
          <strong>Тренажёр Отто</strong>
          <i />
          <span>Спокойный путь к сертификату A1</span>
        </div>
      </div>
    </div>
  );
}
