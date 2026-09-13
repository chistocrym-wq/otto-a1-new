import { useMemo } from 'react';
import type { ModuleId, Progress } from '@/types';

interface DashboardProps {
  onSelectModule: (module: ModuleId) => void;
  onOpenInstructions: () => void;
  onOpenExamGuide: () => void;
  onOpenMockExam: () => void;
  onOpenNews: () => void;
  onOpenAccount: () => void;
  onOpenSettings: () => void;
  progress: Progress;
}

type IconProps = { className?: string };

function ProgressBarsIcon({ className }: IconProps) {
  return <svg className={className} viewBox="0 0 64 64" aria-hidden="true"><rect x="10" y="38" width="11" height="16" rx="2.5" fill="currentColor"/><rect x="27" y="28" width="11" height="26" rx="2.5" fill="currentColor"/><rect x="44" y="15" width="11" height="39" rx="2.5" fill="currentColor"/></svg>;
}

function CheckRoundIcon({ className }: IconProps) {
  return <svg className={className} viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="currentColor"/><path d="m7.4 12 3.1 3.1 6.2-7" fill="none" stroke="#fff" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

function TrophyIcon({ className }: IconProps) {
  return <svg className={className} viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3.5h8v5.2c0 3.6-1.6 5.9-4 5.9S8 12.3 8 8.7V3.5Z" fill="currentColor"/><path d="M8.2 5.7H4.5v2c0 2.8 1.6 4.5 4.3 4.7M15.8 5.7h3.7v2c0 2.8-1.6 4.5-4.3 4.7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M12 14.5V19M8.5 21h7" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round"/></svg>;
}

function PencilIcon({ className }: IconProps) {
  return <svg className={className} viewBox="0 0 64 64" aria-hidden="true"><path d="M9 50.5 13.4 34 43.2 4.2a6.2 6.2 0 0 1 8.8 0l7.8 7.8a6.2 6.2 0 0 1 0 8.8L30 50.6 12.8 55Z" fill="currentColor"/><path d="m38.2 9.2 16.6 16.6" fill="none" stroke="#fff" strokeWidth="3.2" opacity=".88"/></svg>;
}

function SpeechIcon({ className }: IconProps) {
  return <svg className={className} viewBox="0 0 64 64" aria-hidden="true"><path d="M7 13.5C7 7.7 12 3 18.2 3h27.6C52 3 57 7.7 57 13.5v20C57 39.3 52 44 45.8 44H29L15 56V43.2C10.2 41.8 7 38.2 7 33.5v-20Z" fill="currentColor"/><circle cx="23" cy="24" r="3.5" fill="#fff"/><circle cx="32" cy="24" r="3.5" fill="#fff"/><circle cx="41" cy="24" r="3.5" fill="#fff"/></svg>;
}

function BookIcon({ className }: IconProps) {
  return <svg className={className} viewBox="0 0 64 64" aria-hidden="true"><path d="M6 11c9-2.8 17.2-1.1 26 5v37c-8.8-6.1-17-7.8-26-5V11Zm52 0c-9-2.8-17.2-1.1-26 5v37c8.8-6.1 17-7.8 26-5V11Z" fill="currentColor"/><path d="M32 16v37" stroke="#fff" strokeWidth="2.4" opacity=".95"/></svg>;
}

function HeadphonesIcon({ className }: IconProps) {
  return <svg className={className} viewBox="0 0 64 64" aria-hidden="true"><path d="M10 35v-6C10 17.2 19.8 7 32 7s22 10.2 22 22v6" fill="none" stroke="currentColor" strokeWidth="5.3" strokeLinecap="round"/><rect x="6" y="31" width="12" height="24" rx="6" fill="currentColor"/><rect x="46" y="31" width="12" height="24" rx="6" fill="currentColor"/><path d="M53 49c-1 5-5 7-10 7h-5" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/></svg>;
}

function ClipboardIcon({ className }: IconProps) {
  return <svg className={className} viewBox="0 0 64 64" aria-hidden="true"><rect x="12" y="10" width="40" height="47" rx="5" fill="currentColor"/><rect x="22" y="5" width="20" height="11" rx="4" fill="currentColor"/><path d="m20 29 4.5 4.5 8-9M20 43l4.5 4.5 8-9" fill="none" stroke="#fff" strokeWidth="3.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M37 29h9M37 43h9" stroke="#fff" strokeWidth="3" strokeLinecap="round"/></svg>;
}

function FileIcon({ className }: IconProps) {
  return <svg className={className} viewBox="0 0 64 64" aria-hidden="true"><path d="M14 7h25l11 11v39H14z" fill="currentColor"/><path d="M39 7v13h13" fill="none" stroke="#fff" strokeWidth="3"/><path d="M22 31h20M22 39h20M22 47h14" stroke="#fff" strokeWidth="3" strokeLinecap="round"/></svg>;
}

function CapIcon({ className }: IconProps) {
  return <svg className={className} viewBox="0 0 64 64" aria-hidden="true"><path d="M4 23.5 32 10l28 13.5L32 37 4 23.5Z" fill="currentColor"/><path d="M17 32v12.5c7 6.2 23 6.2 30 0V32" fill="currentColor"/><path d="M56 27v18" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/><circle cx="56" cy="48" r="3" fill="currentColor"/></svg>;
}

function NewsIcon({ className }: IconProps) {
  return <svg className={className} viewBox="0 0 64 64" aria-hidden="true"><rect x="10" y="8" width="41" height="47" rx="4" fill="currentColor"/><rect x="18" y="18" width="25" height="11" fill="#fff"/><path d="M18 36h10M18 43h10M34 36h9M34 43h9" stroke="#fff" strokeWidth="3" strokeLinecap="round"/><path d="M51 16h5v36c0 2-1.5 3-3.2 3H51" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/></svg>;
}

function ChevronIcon({ className }: IconProps) {
  return <svg className={className} viewBox="0 0 24 24" aria-hidden="true"><path d="m9 4 8 8-8 8" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

function HomeIcon({ className }: IconProps) {
  return <svg className={className} viewBox="0 0 48 48" aria-hidden="true"><path d="M6 23 24 7l18 16v18H29V29H19v12H6V23Z" fill="currentColor"/></svg>;
}

function SettingsIcon({ className }: IconProps) {
  return <svg className={className} viewBox="0 0 48 48" aria-hidden="true"><path d="M20 5h8l2 6 5 2 6-2 4 7-4 5v6l4 5-4 7-6-2-5 2-2 6h-8l-2-6-5-2-6 2-4-7 4-5v-6l-4-5 4-7 6 2 5-2 2-6Z" fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round"/><circle cx="24" cy="26" r="7" fill="none" stroke="currentColor" strokeWidth="3"/></svg>;
}

function CompassIcon({ className }: IconProps) {
  return <svg className={className} viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="18" fill="none" stroke="currentColor" strokeWidth="3"/><path d="m30 17-4.4 10.6L15 32l4.4-10.6L30 17Z" fill="currentColor"/></svg>;
}

function ShareIcon({ className }: IconProps) {
  return <svg className={className} viewBox="0 0 48 48" aria-hidden="true"><circle cx="13" cy="24" r="5" fill="none" stroke="currentColor" strokeWidth="3"/><circle cx="35" cy="11" r="5" fill="none" stroke="currentColor" strokeWidth="3"/><circle cx="35" cy="37" r="5" fill="none" stroke="currentColor" strokeWidth="3"/><path d="m17 21 13-7M17 27l13 7" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>;
}

function HelpIcon({ className }: IconProps) {
  return <svg className={className} viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="18" fill="currentColor"/><path d="M18.8 18.5c.9-4.2 4-6.5 8.1-6.5 5 0 8.2 3 8.2 7 0 5.1-5.2 6.2-7.1 9.1-.8 1.1-1.1 2.2-1.1 3.5" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"/><circle cx="26.5" cy="37" r="2" fill="#fff"/></svg>;
}

const modules = [
  { id: 'schreiben' as ModuleId, title: 'Schreiben', subtitle: 'Письмо', Icon: PencilIcon, tone: 'peach' },
  { id: 'sprechen' as ModuleId, title: 'Sprechen', subtitle: 'Говорение', Icon: SpeechIcon, tone: 'mint' },
  { id: 'lesen' as ModuleId, title: 'Lesen', subtitle: 'Чтение', Icon: BookIcon, tone: 'cream' },
  { id: 'horen' as ModuleId, title: 'Hören', subtitle: 'Аудирование', Icon: HeadphonesIcon, tone: 'lavender' },
];

export function Dashboard({
  onSelectModule,
  onOpenInstructions,
  onOpenExamGuide,
  onOpenMockExam,
  onOpenNews,
  onOpenAccount,
  onOpenSettings,
  progress,
}: DashboardProps) {
  const stats = useMemo(() => {
    let answered = 0;
    let correct = 0;
    let started = 0;
    modules.forEach(({ id }) => {
      const item = progress[id];
      const done = item?.answered ?? 0;
      answered += done;
      correct += item?.correct ?? 0;
      if (done > 0) started += 1;
    });
    return { answered, started, accuracy: answered ? Math.round((correct / answered) * 100) : 0 };
  }, [progress]);

  return (
    <div className="otto-real-home animate-fade-in">
      <section className="otto-real-hero" aria-label="Тренажёр OTTO — Zertifikat A1">
        <div className="otto-real-hero-copy">
          <div className="otto-real-brand">
            <span className="otto-real-brand-small">Тренажёр</span>
            <span className="otto-real-brand-big">OTTO</span>
            <span className="otto-real-brand-line" aria-hidden="true" />
          </div>
          <h1>Zertifikat A1</h1>
          <p>Подготовка шаг за шагом</p>
          <p>Подготовимся к экзамену вместе</p>
          <div className="otto-real-note">Du<br />schaffst<br />das! ♡</div>
        </div>
        <img className="otto-real-hero-otto" src="/otto/otto-home-documents-hq.webp?v=1" alt="OTTO" width={1122} height={1402} fetchPriority="high" draggable={false} />
      </section>

      <button type="button" className="otto-real-progress" onClick={onOpenAccount} aria-label="Открыть мой прогресс">
        <span className="otto-real-progress-icon"><ProgressBarsIcon /></span>
        <span className="otto-real-progress-main">
          <span className="otto-real-progress-top"><strong>Мой прогресс</strong><b>{stats.accuracy}%</b></span>
          <span className="otto-real-progress-track"><i style={{ width: `${stats.accuracy}%` }} /></span>
          <span className="otto-real-progress-meta">
            <span><CheckRoundIcon />{stats.answered} заданий выполнено</span>
            <span className="otto-real-progress-divider" aria-hidden="true" />
            <span><TrophyIcon />{stats.started} из 4 модулей начато</span>
          </span>
        </span>
      </button>

      <section className="otto-real-section otto-real-modules-section">
        <h2>Выберите модуль</h2>
        <div className="otto-real-modules">
          {modules.map(({ id, title, subtitle, Icon, tone }) => (
            <button key={id} type="button" className={`otto-real-module is-${tone}`} onClick={() => onSelectModule(id)}>
              <span className="otto-real-module-icon"><Icon /></span>
              <span className="otto-real-module-copy"><strong>{title}</strong><small>{subtitle}</small></span>
              <ChevronIcon className="otto-real-chevron" />
            </button>
          ))}
        </div>
      </section>

      <section className="otto-real-exam">
        <span className="otto-real-exam-icon"><ClipboardIcon /></span>
        <span className="otto-real-exam-copy"><strong>Пробный экзамен</strong><small>Проверьте свои знания<br />в формате настоящего экзамена</small></span>
        <button type="button" onClick={onOpenMockExam}>Начать <ChevronIcon /></button>
      </section>

      <section className="otto-real-section otto-real-materials-section">
        <h2>Полезные материалы</h2>
        <div className="otto-real-materials">
          <button type="button" onClick={onOpenInstructions}><FileIcon /><strong>Бланки</strong><small>Шаблоны и образцы</small></button>
          <button type="button" onClick={onOpenExamGuide}><CapIcon /><strong>Советы OTTO</strong><small>Игры и стратегии</small></button>
          <button type="button" onClick={onOpenNews}><NewsIcon /><strong>Новости</strong><small>Актуальная<br />информация</small></button>
        </div>
      </section>

      <nav className="otto-real-home-nav" aria-label="Навигация главного экрана">
        <button type="button" className="is-active" aria-current="page"><HomeIcon /><span>Главная</span></button>
        <button type="button" onClick={onOpenSettings}><SettingsIcon /><span>Настройки</span></button>
        <button type="button" onClick={onOpenExamGuide}><CompassIcon /><span>Гайды</span></button>
        <button type="button"><ShareIcon /><span>Поделиться</span></button>
        <button type="button"><HelpIcon /><span>Поддержка</span></button>
      </nav>
    </div>
  );
}
