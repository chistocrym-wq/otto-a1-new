import { useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, Clipboard, HelpCircle, RefreshCw, ShieldCheck } from 'lucide-react';

interface Props { onBack: () => void }

export function SupportPage({ onBack }: Props) {
  const [copied, setCopied] = useState(false);
  const info = useMemo(() => {
    const url = typeof window === 'undefined' ? '' : window.location.href.split('?')[0];
    const agent = typeof navigator === 'undefined' ? '' : navigator.userAgent;
    return `OTTO A1\nСтраница: ${url}\nУстройство: ${agent}`;
  }, []);

  const copyInfo = async () => {
    try {
      await navigator.clipboard.writeText(info);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="otto-support-page animate-fade-in">
      <div className="otto-sticky-head">
        <button type="button" onClick={onBack} aria-label="Назад" className="otto-back-button"><ArrowLeft /></button>
        <div><p className="otto-kicker">Поддержка OTTO</p><h1 className="text-2xl font-black text-slate-950">Помощь по тренажёру</h1></div>
      </div>

      <section className="otto-support-intro">
        <span className="otto-support-badge"><HelpCircle /></span>
        <div><h2>Если что-то работает не так</h2><p>Сначала вернитесь на главный экран и откройте нужный раздел заново. Ваш учебный прогресс при этом не сбрасывается.</p></div>
      </section>

      <div className="otto-support-grid">
        <section className="otto-support-card"><RefreshCw /><div><strong>Задание не открылось</strong><p>Закройте карточку или раздел и откройте его снова. Если проблема повторяется, перезапустите приложение.</p></div></section>
        <section className="otto-support-card"><ShieldCheck /><div><strong>Нет звука или микрофона</strong><p>Проверьте разрешения Telegram или браузера для звука и микрофона. OTTO не включает их без разрешения устройства.</p></div></section>
        <section className="otto-support-card"><Clipboard /><div><strong>Нужно сообщить об ошибке</strong><p>Скопируйте техническую информацию ниже — она поможет точно определить страницу и устройство, где возникла проблема.</p></div></section>
      </div>

      <button type="button" className="otto-support-copy" onClick={copyInfo}>
        {copied ? <CheckCircle2 /> : <Clipboard />}
        <span>{copied ? 'Техническая информация скопирована' : 'Скопировать техническую информацию'}</span>
      </button>
    </div>
  );
}
