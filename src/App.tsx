import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dashboard } from '@/components/Dashboard';
import { BottomNav, type BottomTab } from '@/components/BottomNav';
import { OttoScene, type OttoSceneName } from '@/components/OttoScene';
import { OttoSplash } from '@/components/OttoSplash';
import { useProgress } from '@/hooks/useProgress';
import { getOttoProductMode } from '@/lib/productMode';
import type { ModuleId } from '@/types';
import './ottoDesignV2.css';
import './ottoViewport.css';
import './ottoSceneAssets.css';
import './ottoSplash.css';
import './ottoFinalPolish.css';
import './ottoHomeReact.css';
import './ottoUnifiedPages.css';
import './ottoUnifiedPagesFix.css';
import './ottoVisualSystem.css';
import './ottoVisualPages.css';
import './ottoUserFixes.css';
import './ottoApprovedHome.css';
import './ottoApprovedHomeFinal.css';
import './ottoTextSafety.css';
import '@/data/lesen/registerExtraSets';

const Instructions = lazy(() => import('@/components/Instructions').then((m) => ({ default: m.Instructions })));
const ExamGuide = lazy(() => import('@/components/ExamGuide').then((m) => ({ default: m.ExamGuide })));
const MockExam = lazy(() => import('@/components/MockExam').then((m) => ({ default: m.MockExam })));
const ModulesHub = lazy(() => import('@/components/ModulesHub').then((m) => ({ default: m.ModulesHub })));
const AccountPage = lazy(() => import('@/components/AccountPage').then((m) => ({ default: m.AccountPage })));
const ReadinessPage = lazy(() => import('@/components/ReadinessPage').then((m) => ({ default: m.ReadinessPage })));
const PhraseSpeakingPractice = lazy(() => import('@/components/PhraseSpeakingPractice').then((m) => ({ default: m.PhraseSpeakingPractice })));
const SettingsPage = lazy(() => import('@/components/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const NewsPage = lazy(() => import('@/components/NewsPage').then((m) => ({ default: m.NewsPage })));
const SupportPage = lazy(() => import('@/components/SupportPage').then((m) => ({ default: m.SupportPage })));
const ReadingModule = lazy(() => import('@/components/modules/ReadingModule').then((m) => ({ default: m.ReadingModule })));
const ListeningModule = lazy(() => import('@/components/modules/ListeningModule').then((m) => ({ default: m.ListeningModule })));
const WritingModule = lazy(() => import('@/components/modules/WritingModule').then((m) => ({ default: m.WritingModule })));
const SpeakingModule = lazy(() => import('@/components/modules/SpeakingModule').then((m) => ({ default: m.SpeakingModule })));

type View = ModuleId | 'instructions' | 'exam-guide' | 'mock-exam' | 'modules' | 'readiness' | 'phrases-speaking' | 'account' | 'settings' | 'news' | 'support' | null;

type ShareData = { title?: string; text?: string; url?: string };

type NavigatorWithShare = Navigator & {
  share?: (data?: ShareData) => Promise<void>;
};

export default function App() {
  const productMode = getOttoProductMode();
  const isFull = productMode === 'full';
  const [view, setView] = useState<View>(null);
  const [activeTab, setActiveTab] = useState<BottomTab>('home');
  const [showSplash, setShowSplash] = useState(true);
  const [showTranslation, setShowTranslation] = useState(false);
  const [ottoScene, setOttoScene] = useState<OttoSceneName>('home');
  const { progress, activity, recordModuleResult, recordActivity, resetProgress } = useProgress();
  const activityStartedAt = useRef<number | null>(null);

  const moduleForView = useMemo<ModuleId | null>(() => {
    if (view === 'schreiben' || view === 'sprechen' || view === 'horen' || view === 'lesen') return view;
    return null;
  }, [view]);

  useEffect(() => {
    if (moduleForView) activityStartedAt.current = Date.now();
    else activityStartedAt.current = null;
  }, [moduleForView]);

  useEffect(() => {
    if (!view) {
      setOttoScene('home');
      return;
    }
    if (view === 'horen') setOttoScene('horen');
    else if (view === 'lesen') setOttoScene('lesen');
    else if (view === 'schreiben') setOttoScene('schreiben');
    else if (view === 'sprechen' || view === 'phrases-speaking') setOttoScene('sprechen');
    else setOttoScene('guide');
  }, [view]);

  const closeView = useCallback(() => {
    setView(null);
    setActiveTab('home');
  }, []);

  const openModule = useCallback((module: ModuleId) => {
    setView(module);
    setActiveTab('modules');
  }, []);

  const finishModule = useCallback((module: ModuleId, score: number, answered?: number, correct?: number) => {
    const startedAt = activityStartedAt.current;
    const durationSeconds = startedAt ? Math.max(1, Math.round((Date.now() - startedAt) / 1000)) : 0;
    recordModuleResult(module, score, answered, correct);
    recordActivity({ module, score, durationSeconds });
    setView(null);
    setActiveTab('home');
  }, [recordActivity, recordModuleResult]);

  const navigateTab = useCallback((tab: BottomTab) => {
    setActiveTab(tab);
    if (tab === 'home') setView(null);
    else if (tab === 'modules') setView('modules');
    else if (tab === 'readiness') setView('readiness');
    else if (tab === 'account') setView('account');
    else if (tab === 'settings') setView('settings');
  }, []);

  const openSupport = useCallback(() => setView('support'), []);
  const openNews = useCallback(() => setView('news'), []);

  const shareApp = useCallback(async () => {
    const nav = navigator as NavigatorWithShare;
    if (nav.share) {
      try {
        await nav.share({ title: 'Тренажёр Отто A1', text: 'Тренажёр подготовки к Goethe A1', url: window.location.href });
        return;
      } catch {
        // User cancelled or native share is unavailable.
      }
    }
    try {
      await navigator.clipboard.writeText(window.location.href);
      window.alert('Ссылка скопирована');
    } catch {
      window.prompt('Скопируйте ссылку:', window.location.href);
    }
  }, []);

  const onModuleScore = useCallback((module: ModuleId, score: number, answered?: number, correct?: number) => {
    finishModule(module, score, answered, correct);
  }, [finishModule]);

  const page = useMemo(() => {
    if (!view) {
      if (!isFull) {
        return <ModulesHub onBack={() => {}} onSelectModule={openModule} progress={progress} />;
      }
      return (
        <Dashboard
          onSelectModule={openModule}
          onOpenInstructions={() => setView('instructions')}
          onOpenExamGuide={() => setView('exam-guide')}
          onOpenMockExam={() => setView('mock-exam')}
          onOpenNews={openNews}
          onOpenAccount={() => setView('account')}
          onOpenSettings={() => setView('settings')}
          onOpenReadiness={() => setView('readiness')}
          onShare={shareApp}
          onOpenSupport={openSupport}
          progress={progress}
          activity={activity}
        />
      );
    }
    if (view === 'instructions') return <Instructions onBack={closeView} />;
    if (view === 'exam-guide') return <ExamGuide onBack={closeView} />;
    if (view === 'mock-exam') return <MockExam onBack={closeView} />;
    if (view === 'modules') return <ModulesHub onBack={closeView} onSelectModule={openModule} progress={progress} />;
    if (view === 'readiness') return <ReadinessPage onBack={closeView} progress={progress} activity={activity} onSelectModule={openModule} onOpenMockExam={() => setView('mock-exam')} onOpenPhrases={() => setView('phrases-speaking')} />;
    if (view === 'phrases-speaking') return <PhraseSpeakingPractice onBack={() => setView('readiness')} onScore={(score) => finishModule('sprechen', score)} />;
    if (view === 'account') return <AccountPage onBack={closeView} onReset={resetProgress} />;
    if (view === 'settings') return <SettingsPage onBack={closeView} />;
    if (view === 'news') return <NewsPage onBack={closeView} />;
    if (view === 'support') return <SupportPage onBack={closeView} />;
    if (view === 'lesen') return <ReadingModule onBack={closeView} onScore={(score, answered, correct) => onModuleScore('lesen', score, answered, correct)} />;
    if (view === 'horen') return <ListeningModule onBack={closeView} onScore={(score, answered, correct) => onModuleScore('horen', score, answered, correct)} />;
    if (view === 'schreiben') return <WritingModule onBack={closeView} onScore={(score, answered, correct) => onModuleScore('schreiben', score, answered, correct)} />;
    if (view === 'sprechen') return <SpeakingModule onBack={closeView} onScore={(score, answered, correct) => onModuleScore('sprechen', score, answered, correct)} />;
    return null;
  }, [activity, closeView, finishModule, isFull, onModuleScore, openModule, openNews, openSupport, progress, resetProgress, shareApp, view]);

  return (
    <div className={`telegram-app otto-skin ${view ? `otto-view-${view}` : 'otto-view-home'}`}>
      <div className="otto-glow otto-glow-a" />
      <div className="otto-glow otto-glow-b" />
      <div className="otto-line-art" aria-hidden="true" />
      {showSplash && <OttoSplash onDone={() => setShowSplash(false)} />}
      <main className="otto-app-content">
        <Suspense fallback={<div className="otto-loading">Загрузка…</div>}>
          <div className="otto-home-screen">{page}</div>
        </Suspense>
      </main>
      {!moduleForView && !['instructions', 'exam-guide', 'mock-exam', 'phrases-speaking', 'news', 'support'].includes(view ?? '') && (
        <BottomNav active={activeTab} onNavigate={navigateTab} mode={productMode} />
      )}
      {moduleForView && (
        <OttoScene scene={ottoScene} className="otto-companion" />
      )}
      {showTranslation && <div className="otto-translation-layer" />}
      <button type="button" className="sr-only" onClick={() => setShowTranslation((value) => !value)}>Перевод</button>
    </div>
  );
}
