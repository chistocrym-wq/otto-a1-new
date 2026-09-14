import { useMemo, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Headphones,
  Lightbulb,
  MessageCircleMore,
  PenLine,
  Sparkles,
  Trophy,
} from 'lucide-react';
import type { ActivityEntry, ModuleId, Progress } from '@/types';
import {
  buildDailyPlan,
  getReadiness,
  getTodayActivity,
  MODULE_META,
  MODULE_ORDER,
} from '@/lib/preparation';

interface DashboardProps {
  onSelectModule: (module: ModuleId) => void;
  onOpenInstructions: () => void;
  onOpenExamGuide: () => void;
  onOpenMockExam: () => void;
  onOpenNews: () => void;
  onOpenAccount: () => void;
  onOpenSettings: () => void;
  onOpenReadiness: () => void;
  onShare: () => void;
  onOpenSupport: () => void;
  progress: Progress;
  activity: ActivityEntry[];
}

type Minutes = 5 | 15 | 30;

const moduleIcons: Record<ModuleId, typeof PenLine> = {
  schreiben: PenLine,
  sprechen: MessageCircleMore,
  lesen: BookOpen,
  horen: Headphones,
};

const statusLabel = {
  ready: 'готово',
  almost: 'почти готово',
  train: 'тренируем',
} as const;

export function Dashboard({
  onSelectModule,
  onOpenInstructions,
  onOpenExamGuide,
  onOpenMockExam,
  onOpenSettings,
  onOpenReadiness,
  progress,
  activity,
}: DashboardProps) {
  const [minutes, setMinutes] = useState<Minutes>(() => {
    const stored = Number(localStorage.getItem('otto-a1-session-minutes'));
    return stored === 5 || stored === 15 || stored === 30 ? stored : 15;
  });

  const readiness = useMemo(() => getReadiness(progress), [progress]);
  const plan = useMemo(() => buildDailyPlan(progress, minutes), [progress, minutes]);
  const today = useMemo(() => getTodayActivity(activity), [activity]);
  const firstTask = plan[0];

  const chooseMinutes = (value: Minutes) => {
    setMinutes(value);
    try {
      localStorage.setItem('otto-a1-session-minutes', String(value));
    } catch {
      // localStorage can be unavailable in restricted webviews.
    }
  };

  return (
    <div className="otto-approved-dashboard animate-fade-in">
      <section className="otto-approved-hero" aria-labelledby="otto-home-title">
        <div className="otto-approved-hero-copy">
          <h1 id="otto-home-title" className="otto-approved-brand">Тренажёр Отто</h1>
          <span className="otto-approved-brand-line" aria-hidden="true" />
          <h2>Мой путь<br />к сертификату <em>A1</em></h2>
          <p>Отто ведёт вас по шагам и сам<br />подсказывает, что лучше<br />потренировать сегодня.</p>
          <span className="otto-approved-handwrite">Du schaffst das! ♡</span>
        </div>
        <span className="otto-approved-skyline" aria-hidden="true" />
        <div className="otto-approved-otto" aria-hidden="true">
          <img src="/otto/otto-home-documents.webp?v=2" className="otto-approved-otto-image" alt="" />
        </div>
        <span className="otto-approved-side-note" aria-hidden="true">Deutsch<br />bringt dich<br />weiter<br />♡</span>
      </section>

      <section className="otto-approved-readiness" aria-label="Готовность к экзамену">
        <button type="button" onClick={onOpenReadiness} className="otto-approved-readiness-button">
          <span className="otto-approved-readiness-icon"><BarChart3 /></span>
          <span className="otto-approved-readiness-copy">
            <span className="otto-approved-readiness-top">
              <strong>ГОТОВНОСТЬ К A1</strong>
              <b>{readiness.overall}%</b>
            </span>
            <span className="otto-approved-progress" aria-hidden="true"><i style={{ width: `${readiness.overall}%` }} /></span>
            <small>тренировочная готовность</small>
          </span>
          <ChevronRight className="otto-approved-chevron" />
        </button>
      </section>

      <section className="otto-approved-recommendation">
        <span className="otto-approved-recommendation-icon"><Sparkles /></span>
        <div>
          <strong>ОТТО РЕКОМЕНДУЕТ</strong>
          <p>{readiness.recommendation}</p>
        </div>
      </section>

      <section className="otto-approved-training">
        <div className="otto-approved-training-head">
          <div>
            <strong>СЕГОДНЯ</strong>
            <h2>Ваша тренировка</h2>
          </div>
          <span className="otto-approved-time"><Clock3 /> ≈ {minutes} мин</span>
        </div>

        <div className="otto-approved-duration" aria-label="Выберите длительность тренировки">
          {([5, 15, 30] as Minutes[]).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => chooseMinutes(value)}
              className={minutes === value ? 'is-active' : ''}
              aria-pressed={minutes === value}
            >
              {value} минут
            </button>
          ))}
        </div>

        <div className="otto-approved-plan">
          {plan.map((item, index) => {
            const Icon = moduleIcons[item.module];
            return (
              <button
                key={`${item.module}-${index}`}
                type="button"
                onClick={() => onSelectModule(item.module)}
                className="otto-approved-plan-row"
              >
                <span className="otto-approved-plan-number">{index + 1}</span>
                <span className="otto-approved-plan-icon"><Icon /></span>
                <span className="otto-approved-plan-copy">
                  <strong>{item.title}</strong>
                  <small>{item.detail}</small>
                </span>
                <ChevronRight className="otto-approved-plan-chevron" />
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => firstTask && onSelectModule(firstTask.module)}
          disabled={!firstTask}
          className="otto-approved-primary"
        >
          <span>НАЧАТЬ СЕГОДНЯШНЮЮ ТРЕНИРОВКУ</span>
          <ArrowRight />
        </button>
      </section>

      {(today.attempts > 0 || today.minutes > 0) && (
        <section className="otto-approved-complete">
          <span><CheckCircle2 /></span>
          <div>
            <strong>Сегодня уже сделано</strong>
            <p>{today.attempts} завершённых попыток{today.minutes ? ` · около ${today.minutes} мин активной практики` : ''}</p>
          </div>
        </section>
      )}

      <section className="otto-approved-below-fold otto-premium-skills">
        <div className="otto-premium-section-heading">
          <div>
            <p className="otto-premium-kicker">Ваш маршрут</p>
            <h2>Навыки до сертификата</h2>
          </div>
          <button type="button" onClick={onOpenReadiness} className="otto-premium-text-button">Карта готовности</button>
        </div>

        <div className="otto-premium-skill-grid">
          {MODULE_ORDER.map((id) => {
            const metric = readiness.modules[id];
            const Icon = moduleIcons[id];
            return (
              <button key={id} type="button" onClick={() => onSelectModule(id)} className="otto-premium-skill-card">
                <span className="otto-premium-skill-top">
                  <span className="otto-premium-skill-icon"><Icon /></span>
                  <span className="otto-premium-skill-score">{metric.score}%</span>
                </span>
                <strong>{MODULE_META[id].title}</strong>
                <small>{MODULE_META[id].label}</small>
                <span className="otto-premium-mini-progress" aria-hidden="true"><i style={{ width: `${metric.score}%` }} /></span>
                <span className={`otto-premium-status is-${metric.status}`}>{statusLabel[metric.status]}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="otto-premium-panel otto-premium-mock">
        <span className="otto-premium-mock-icon"><Trophy /></span>
        <div className="otto-premium-mock-copy">
          <p className="otto-premium-kicker">Пробный экзамен</p>
          <h2>{readiness.mockLabel}</h2>
          <p>
            {readiness.mockStatus === 'recommended'
              ? 'Результаты достаточно устойчивы. Пора проверить себя целиком.'
              : readiness.mockStatus === 'try'
                ? 'Можно пройти пробник для диагностики, но Отто ещё видит слабые места.'
                : `Отто рекомендует сначала укрепить ${MODULE_META[readiness.weakest].title}. Открыть пробник всё равно можно.`}
          </p>
        </div>
        <button type="button" onClick={onOpenMockExam} className="otto-premium-secondary">
          Попробовать как на экзамене <ArrowRight />
        </button>
      </section>

      <details className="otto-premium-details">
        <summary>Хочу выбрать раздел сама <ChevronRight /></summary>
        <div className="otto-premium-details-grid">
          {MODULE_ORDER.map((id) => {
            const Icon = moduleIcons[id];
            return (
              <button key={id} type="button" onClick={() => onSelectModule(id)}>
                <Icon /> <span>{MODULE_META[id].title}</span>
              </button>
            );
          })}
        </div>
      </details>

      <details className="otto-premium-details">
        <summary>Полезные материалы <ChevronRight /></summary>
        <p className="otto-premium-details-note">Подсказки встроены в тренировку. Здесь остаются материалы, к которым удобно вернуться отдельно.</p>
        <div className="otto-premium-details-grid is-two">
          <button type="button" onClick={onOpenInstructions}><Lightbulb /><span>Как выполнять задания</span></button>
          <button type="button" onClick={onOpenExamGuide}><BookOpen /><span>Справочник по экзамену</span></button>
        </div>
      </details>

      <button type="button" onClick={onOpenSettings} className="sr-only">Настройки</button>
    </div>
  );
}
