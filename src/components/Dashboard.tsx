import { useMemo } from 'react';
import type { ModuleId, Progress } from '@/types';

interface DashboardProps {
  onSelectModule: (module: ModuleId) => void;
  onOpenInstructions: () => void;
  onOpenExamGuide: () => void;
  onOpenMockExam: () => void;
  onOpenNews: () => void;
  onOpenAccount: () => void;
  progress: Progress;
}

function ProgressBarsIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <rect x="10" y="37" width="10" height="17" rx="2" fill="currentColor" />
      <rect x="27" y="27" width="10" height="27" rx="2" fill="currentColor" />
      <rect x="44" y="14" width="10" height="40" rx="2" fill="currentColor" />
    </svg>
  );
}

function CheckRoundIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="currentColor" />
      <path d="m7.7 12.1 2.6 2.7 5.9-6" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 4h8v5.2c0 3.2-1.7 5.6-4 5.6s-4-2.4-4-5.6V4Z" fill="currentColor" />
      <path d="M8 6H4.5v2.1c0 2.5 1.6 4.4 4.1 4.4M16 6h3.5v2.1c0 2.5-1.6 4.4-4.1 4.4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 14.8V19M8.5 21h7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path d="M15 46 18.5 33.5 42.8 9.2a5.6 5.6 0 0 1 7.9 0l4.1 4.1a5.6 5.6 0 0 1 0 7.9L30.5 45.5 18 49Z" fill="currentColor" />
      <path d="M37.5 14.5 49.5 26.5" stroke="white" strokeWidth="3" strokeLinecap="round" opacity=".9" />
    </svg>
  );
}

function SpeechIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path d="M8 14.5C8 8.7 13 4 19.2 4h25.6C51 4 56 8.7 56 14.5v20C56 40.3 51 45 44.8 45H28L16 56v-11.8C11.3 42.9 8 39.2 8 34.5v-20Z" fill="currentColor" />
      <circle cx="23" cy="25" r="3.5" fill="white" />
      <circle cx="32" cy="25" r="3.5" fill="white" />
      <circle cx="41" cy="25" r="3.5" fill="white" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path d="M7 11c8-2.2 15.7-.8 25 5v36c-8.8-5.8-16.7-7.2-25-5V11Zm50 0c-8-2.2-15.7-.8-25 5v36c8.8-5.8 16.7-7.2 25-5V11Z" fill="none" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
      <path d="M32 16v36" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

function HeadphonesIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path d="M11 34v-5C11 17.4 20.4 8 32 8s21 9.4 21 21v5" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      <rect x="7" y="31" width="11" height="22" rx="5.5" fill="currentColor" />
      <rect x="46" y="31" width="11" height="22" rx="5.5" fill="currentColor" />
      <path d="M51 48c-1 5-5 7-10 7h-4" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <rect x="13" y="11" width="38" height="46" rx="5" fill="currentColor" />
      <rect x="23" y="6" width="18" height="10" rx="4" fill="white" opacity=".95" />
      <path d="m21 29 4 4 7-8M21 42l4 4 7-8" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M36 29h9M36 42h9" stroke="white" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path d="M15 7h24l11 11v39H15z" fill="currentColor" />
      <path d="M39 7v13h13" fill="none" stroke="white" strokeWidth="3" opacity=".95" />
      <path d="M23 31h19M23 39h19M23 47h13" stroke="white" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function CapIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path d="M4 24 32 10l28 14-28 14L4 24Z" fill="currentColor" />
      <path d="M17 33v12c7 6 23 6 30 0V33" fill="currentColor" opacity=".92" />
      <path d="M56 28v17" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <circle cx="56" cy="48" r="3" fill="currentColor" />
    </svg>
  );
}

function NewsIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <rect x="10" y="9" width="40" height="46" rx="4" fill="currentColor" />
      <path d="M18 19h24v10H18z" fill="white" opacity=".95" />
      <path d="M18 36h10M18 43h10M34 36h8M34 43h8" stroke="white" strokeWidth="3" strokeLinecap="round" />
      <path d="M50 17h5v35c0 2-1.5 3-3 3h-2" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

const modules = [
  { id: 'schreiben' as ModuleId, title: 'Schreiben', subtitle: 'Письмо', Icon: PencilIcon },
  { id: 'sprechen' as ModuleId, title: 'Sprechen', subtitle: 'Говорение', Icon: SpeechIcon },
  { id: 'lesen' as ModuleId, title: 'Lesen', subtitle: 'Чтение', Icon: BookIcon },
  { id: 'horen' as ModuleId, title: 'Hören', subtitle: 'Аудирование', Icon: HeadphonesIcon },
];

export function Dashboard({ onSelectModule, onOpenInstructions, onOpenExamGuide, onOpenMockExam, onOpenNews, onOpenAccount, progress }: DashboardProps) {
  const totalStats = useMemo(() => {
    let answered = 0;
    let correct = 0;
    let started = 0;
    modules.forEach((module) => {
      const item = progress[module.id];
      const moduleAnswered = item?.answered ?? 0;
      answered += moduleAnswered;
      correct += item?.correct ?? 0;
      if (moduleAnswered > 0) started += 1;
    });
    return { answered, started, accuracy: answered ? Math.round((correct / answered) * 100) : 0 };
  }, [progress]);

  return (
    <div className="otto-dashboard-screen otto-premium-home animate-fade-in">
      <section className="otto-premium-hero" aria-label="Тренажёр OTTO — Zertifikat A1">
        <div className="otto-premium-hero-copy">
          <div className="otto-premium-brand">
            <span className="otto-premium-brand-prefix">Тренажёр</span>
            <span className="otto-premium-brand-name">OTTO</span>
            <span className="otto-premium-brand-swoosh" aria-hidden="true" />
          </div>
          <h1>Zertifikat A1</h1>
          <p className="otto-premium-hero-line">Подготовка шаг за шагом</p>
          <p className="otto-premium-hero-line">Подготовимся к экзамену вместе</p>
          <p className="otto-premium-encouragement">Du<br />schaffst<br />das! ♡</p>
        </div>
        <div className="otto-premium-hero-art" aria-hidden="true">
          <img
            src="/otto/otto-home-documents.webp?v=2"
            alt=""
            width={720}
            height={900}
            fetchPriority="high"
            style={{ top: '4.4cqw', right: '-4.8cqw', height: '80cqw', minHeight: '300px', maxHeight: '625px' }}
          />
        </div>
        <div className="otto-premium-landscape" aria-hidden="true" />
      </section>

      <button type="button" onClick={onOpenAccount} className="otto-premium-progress-card" aria-label="Открыть подробный прогресс">
        <span className="otto-premium-progress-icon"><ProgressBarsIcon /></span>
        <span className="otto-premium-progress-body">
          <span className="otto-premium-progress-heading"><strong>Мой прогресс</strong><b>{totalStats.accuracy}%</b></span>
          <span className="otto-premium-progress-line" aria-hidden="true"><span className="otto-premium-progress-track"><i style={{ width: `${totalStats.accuracy}%` }} /></span></span>
          <span className="otto-premium-progress-stats">
            <span><CheckRoundIcon />{totalStats.answered} заданий выполнено</span>
            <span><TrophyIcon />{totalStats.started} из 4 модулей начато</span>
          </span>
        </span>
      </button>

      <section className="otto-premium-section" id="otto-modules">
        <h2>Выберите модуль</h2>
        <div className="otto-premium-module-grid">
          {modules.map(({ id, title, subtitle, Icon }) => (
            <button key={id} type="button" onClick={() => onSelectModule(id)} className={`otto-premium-module-card is-${id}`}>
              <span className="otto-premium-module-icon"><Icon /></span>
              <span className="otto-premium-module-copy"><strong>{title}</strong><small>{subtitle}</small></span>
              <span className="otto-premium-chevron" aria-hidden="true">›</span>
            </button>
          ))}
        </div>
      </section>

      <section className="otto-premium-exam-card">
        <span className="otto-premium-exam-icon" aria-hidden="true"><ClipboardIcon /></span>
        <span className="otto-premium-exam-copy"><strong>Пробный экзамен</strong><small>Проверьте свои знания<br className="otto-mobile-break" /> в формате настоящего экзамена</small></span>
        <button type="button" onClick={onOpenMockExam} className="otto-premium-exam-button">Начать <span aria-hidden="true">›</span></button>
      </section>

      <section className="otto-premium-section otto-premium-materials" id="otto-materials">
        <h2>Полезные материалы</h2>
        <div className="otto-premium-materials-grid">
          <button type="button" onClick={onOpenInstructions} className="otto-premium-material-card"><span className="otto-premium-material-icon"><FileIcon /></span><strong>Бланки</strong><small>Шаблоны и образцы</small></button>
          <button type="button" onClick={onOpenExamGuide} className="otto-premium-material-card"><span className="otto-premium-material-icon"><CapIcon /></span><strong>Советы OTTO</strong><small>Игры и стратегии</small></button>
          <button type="button" onClick={onOpenNews} className="otto-premium-material-card"><span className="otto-premium-material-icon"><NewsIcon /></span><strong>Новости</strong><small>Актуальная<br />информация</small></button>
        </div>
      </section>
    </div>
  );
}
