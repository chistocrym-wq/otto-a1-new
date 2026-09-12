import { useMemo } from 'react';
import {
  BarChart3,
  BookOpen,
  ChevronRight,
  CircleCheck,
  CircleHelp,
  ClipboardCheck,
  Compass,
  FileText,
  GraduationCap,
  Headphones,
  Home,
  MessageCircleMore,
  Newspaper,
  PenLine,
  Settings,
  Share2,
  Trophy,
} from 'lucide-react';
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

const modules = [
  { id: 'schreiben' as ModuleId, title: 'Schreiben', subtitle: 'Письмо', Icon: PenLine, tone: 'peach' },
  { id: 'sprechen' as ModuleId, title: 'Sprechen', subtitle: 'Говорение', Icon: MessageCircleMore, tone: 'mint' },
  { id: 'lesen' as ModuleId, title: 'Lesen', subtitle: 'Чтение', Icon: BookOpen, tone: 'cream' },
  { id: 'horen' as ModuleId, title: 'Hören', subtitle: 'Аудирование', Icon: Headphones, tone: 'lavender' },
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

    return {
      answered,
      started,
      accuracy: answered ? Math.round((correct / answered) * 100) : 0,
    };
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

        <img
          className="otto-real-hero-otto"
          src="/otto/otto-home-documents.webp?v=3"
          alt="OTTO"
          width={720}
          height={900}
          fetchPriority="high"
          draggable={false}
        />
      </section>

      <button type="button" className="otto-real-progress" onClick={onOpenAccount}>
        <span className="otto-real-progress-icon"><BarChart3 strokeWidth={2.6} /></span>
        <span className="otto-real-progress-main">
          <span className="otto-real-progress-top"><strong>Мой прогресс</strong><b>{stats.accuracy}%</b></span>
          <span className="otto-real-progress-track"><i style={{ width: `${stats.accuracy}%` }} /></span>
          <span className="otto-real-progress-meta">
            <span><CircleCheck />{stats.answered} заданий выполнено</span>
            <span><Trophy />{stats.started} из 4 модулей начато</span>
          </span>
        </span>
      </button>

      <section className="otto-real-section">
        <h2>Выберите модуль</h2>
        <div className="otto-real-modules">
          {modules.map(({ id, title, subtitle, Icon, tone }) => (
            <button
              key={id}
              type="button"
              className={`otto-real-module is-${tone}`}
              onClick={() => onSelectModule(id)}
            >
              <span className="otto-real-module-icon"><Icon strokeWidth={2.5} /></span>
              <span className="otto-real-module-copy"><strong>{title}</strong><small>{subtitle}</small></span>
              <ChevronRight className="otto-real-chevron" strokeWidth={2.4} />
            </button>
          ))}
        </div>
      </section>

      <section className="otto-real-exam">
        <span className="otto-real-exam-icon"><ClipboardCheck strokeWidth={2.45} /></span>
        <span className="otto-real-exam-copy">
          <strong>Пробный экзамен</strong>
          <small>Проверьте свои знания<br />в формате настоящего экзамена</small>
        </span>
        <button type="button" onClick={onOpenMockExam}>Начать <ChevronRight strokeWidth={2.4} /></button>
      </section>

      <section className="otto-real-section otto-real-materials-section">
        <h2>Полезные материалы</h2>
        <div className="otto-real-materials">
          <button type="button" onClick={onOpenInstructions}>
            <FileText strokeWidth={2.4} />
            <strong>Бланки</strong>
            <small>Шаблоны и образцы</small>
          </button>
          <button type="button" onClick={onOpenExamGuide}>
            <GraduationCap strokeWidth={2.4} />
            <strong>Советы OTTO</strong>
            <small>Игры и стратегии</small>
          </button>
          <button type="button" onClick={onOpenNews}>
            <Newspaper strokeWidth={2.4} />
            <strong>Новости</strong>
            <small>Актуальная информация</small>
          </button>
        </div>
      </section>

      <nav className="otto-real-home-nav" aria-label="Навигация главного экрана">
        <button type="button" className="is-active" aria-current="page"><Home /><span>Главная</span></button>
        <button type="button" onClick={onOpenSettings}><Settings /><span>Настройки</span></button>
        <button type="button" onClick={onOpenExamGuide}><Compass /><span>Гайды</span></button>
        <button type="button"><Share2 /><span>Поделиться</span></button>
        <button type="button"><CircleHelp /><span>Поддержка</span></button>
      </nav>
    </div>
  );
}
