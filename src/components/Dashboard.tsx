import { useMemo } from 'react';
import {
  BarChart3,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  FileText,
  Headphones,
  Lightbulb,
  Mic,
  Newspaper,
  PenTool,
  Trophy,
} from 'lucide-react';
import type { ModuleId, Progress } from '@/types';
import { ProgressBar } from '@/components/ProgressBar';

interface DashboardProps {
  onSelectModule: (module: ModuleId) => void;
  onOpenInstructions: () => void;
  onOpenExamGuide: () => void;
  onOpenMockExam: () => void;
  onOpenNews: () => void;
  onOpenAccount: () => void;
  progress: Progress;
}

const modules = [
  { id: 'schreiben' as ModuleId, title: 'Schreiben', subtitle: 'Письмо', icon: PenTool },
  { id: 'sprechen' as ModuleId, title: 'Sprechen', subtitle: 'Говорение', icon: Mic },
  { id: 'lesen' as ModuleId, title: 'Lesen', subtitle: 'Чтение', icon: BookOpen },
  { id: 'horen' as ModuleId, title: 'Hören', subtitle: 'Аудирование', icon: Headphones },
];

export function Dashboard({
  onSelectModule,
  onOpenInstructions,
  onOpenExamGuide,
  onOpenMockExam,
  onOpenNews,
  onOpenAccount,
  progress,
}: DashboardProps) {
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

    return {
      answered,
      started,
      accuracy: answered ? Math.round((correct / answered) * 100) : 0,
    };
  }, [progress]);

  return (
    <div className="otto-dashboard-screen otto-premium-home animate-fade-in">
      <section className="otto-premium-hero">
        <div className="otto-premium-hero-copy">
          <div className="otto-premium-brand">
            <span className="otto-premium-brand-prefix">Тренажёр</span>
            <span className="otto-premium-brand-name">OTTO</span>
            <span className="otto-premium-brand-swoosh" aria-hidden="true" />
          </div>
          <h1>Zertifikat A1</h1>
          <p className="otto-premium-hero-line">Подготовка шаг за шагом</p>
          <p className="otto-premium-hero-line">Подготовимся к экзамену вместе</p>
          <p className="otto-premium-encouragement">Du schaffst das!</p>
        </div>

        <div className="otto-premium-hero-art" aria-hidden="true">
          <img src="/otto/otto-home-documents.webp?v=1" alt="" width={400} height={500} fetchPriority="high" />
        </div>
        <div className="otto-premium-landscape" aria-hidden="true" />
      </section>

      <button
        type="button"
        onClick={onOpenAccount}
        className="otto-premium-progress-card"
        aria-label="Открыть подробный прогресс"
      >
        <span className="otto-premium-progress-icon"><BarChart3 /></span>
        <span className="otto-premium-progress-body">
          <span className="otto-premium-progress-heading">
            <strong>Мой прогресс</strong>
            <b>{totalStats.accuracy}%</b>
          </span>
          <span className="otto-premium-progress-line"><ProgressBar value={totalStats.accuracy} max={100} /></span>
          <span className="otto-premium-progress-stats">
            <span><CheckCircle2 />{totalStats.answered} заданий выполнено</span>
            <span><Trophy />{totalStats.started} из 4 модулей начато</span>
          </span>
        </span>
      </button>

      <section className="otto-premium-section" id="otto-modules">
        <h2>Выберите модуль</h2>
        <div className="otto-premium-module-grid">
          {modules.map(({ id, title, subtitle, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => onSelectModule(id)}
              className={`otto-premium-module-card is-${id}`}
            >
              <span className="otto-premium-module-icon"><Icon /></span>
              <span className="otto-premium-module-copy">
                <strong>{title}</strong>
                <small>{subtitle}</small>
              </span>
              <ChevronRight className="otto-premium-chevron" />
            </button>
          ))}
        </div>
      </section>

      <section className="otto-premium-exam-card">
        <span className="otto-premium-exam-icon" aria-hidden="true"><ClipboardCheck /></span>
        <span className="otto-premium-exam-copy">
          <strong>Пробный экзамен</strong>
          <small>Проверьте свои знания в формате настоящего экзамена</small>
        </span>
        <button type="button" onClick={onOpenMockExam} className="otto-premium-exam-button">
          Начать <ChevronRight />
        </button>
      </section>

      <section className="otto-premium-section otto-premium-materials" id="otto-materials">
        <h2>Полезные материалы</h2>
        <div className="otto-premium-materials-grid">
          <button type="button" onClick={onOpenInstructions} className="otto-premium-material-card">
            <span className="otto-premium-material-icon"><FileText /></span>
            <strong>Бланки</strong>
            <small>Шаблоны и образцы</small>
          </button>
          <button type="button" onClick={onOpenExamGuide} className="otto-premium-material-card">
            <span className="otto-premium-material-icon"><Lightbulb /></span>
            <strong>Советы OTTO</strong>
            <small>Гайды и стратегии</small>
          </button>
          <button type="button" onClick={onOpenNews} className="otto-premium-material-card">
            <span className="otto-premium-material-icon"><Newspaper /></span>
            <strong>Новости</strong>
            <small>Актуальная информация</small>
          </button>
        </div>
      </section>
    </div>
  );
}
