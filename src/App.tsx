import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { Dashboard } from '@/components/Dashboard';
import { BottomNav, type BottomTab } from '@/components/BottomNav';
import { OttoScene, type OttoSceneName } from '@/components/OttoScene';
import { OttoSplash } from '@/components/OttoSplash';
import { PageTranslationEye } from '@/components/common/PageTranslationEye';
import { useProgress } from '@/hooks/useProgress';
import type { ModuleId } from '@/types';
import './ottoDesignV2.css';
import './ottoViewport.css';
import './ottoSceneAssets.css';
import './ottoSplash.css';
import './ottoFinalPolish.css';
import '@/data/lesen/registerExtraSets';

// Everything below is only needed once the user navigates away from the
// dashboard, so it's split into its own chunk instead of bloating the
// initial bundle (this was a big part of the app feeling slow to start).
const Instructions = lazy(() => import('@/components/Instructions').then((m) => ({ default: m.Instructions })));
const ExamGuide = lazy(() => import('@/components/ExamGuide').then((m) => ({ default: m.ExamGuide })));
const MockExam = lazy(() => import('@/components/MockExam').then((m) => ({ default: m.MockExam })));
const ModulesHub = lazy(() => import('@/components/ModulesHub').then((m) => ({ default: m.ModulesHub })));
const AccountPage = lazy(() => import('@/components/AccountPage').then((m) => ({ default: m.AccountPage })));
const SettingsPage = lazy(() => import('@/components/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const NewsPage = lazy(() => import('@/components/NewsPage').then((m) => ({ default: m.NewsPage })));
const ReadingModule = lazy(() => import('@/components/modules/ReadingModule').then((m) => ({ default: m.ReadingModule })));
const ListeningModule = lazy(() => import('@/components/modules/ListeningModule').then((m) => ({ default: m.ListeningModule })));
const WritingModule = lazy(() => import('@/components/modules/WritingModule').then((m) => ({ default: m.WritingModule })));
const SpeakingModule = lazy(() => import('@/components/modules/SpeakingModule').then((m) => ({ default: m.SpeakingModule })));

type View = ModuleId | 'instructions' | 'exam-guide' | 'mock-exam' | 'modules' | 'account' | 'settings' | 'news' | null;

export default function App() {
  const [view, setView] = useState<View>(null);
  const { progress, recordScore } = useProgress();
  const back = useCallback(() => setView(null), []);

  useEffect(() => {
    const t = window.Telegram?.WebApp;
    if (t) { t.ready(); t.expand(); }
  }, []);

  useEffect(() => {
    const b = window.Telegram?.WebApp.BackButton;
    if (!b) return;
    if (view === null) { b.hide(); return; }
    b.show();
    b.onClick(back);
    return () => { b.offClick(back); };
  }, [back, view]);

  const complete = (m: ModuleId) => (score: number, total: number) => recordScore(m, score, total);
  const globalEye = view === 'mock-exam';
  const viewClass = `otto-view-${view ?? 'home'}`;

  const activeTab = useMemo<BottomTab>(() => {
    if (view === null || view === 'mock-exam' || view === 'news') return 'home';
    if (view === 'modules' || view === 'lesen' || view === 'horen' || view === 'schreiben' || view === 'sprechen') return 'modules';
    if (view === 'exam-guide' || view === 'instructions') return 'guides';
    if (view === 'account') return 'account';
    return 'settings';
  }, [view]);

  const companionScene = useMemo<OttoSceneName | null>(() => {
    if (view === 'lesen') return 'lesen';
    if (view === 'horen') return 'horen';
    if (view === 'schreiben') return 'schreiben';
    if (view === 'sprechen' || view === 'instructions' || view === 'exam-guide') return 'guide';
    if (view === 'mock-exam') return 'exam';
    if (view === 'news') return 'home';
    return null;
  }, [view]);

  const navigateBottom = useCallback((tab: BottomTab) => {
    if (tab === 'home') setView(null);
    if (tab === 'modules') setView('modules');
    if (tab === 'guides') setView('exam-guide');
    if (tab === 'account') setView('account');
    if (tab === 'settings') setView('settings');
  }, []);

  return (
    <>
      <OttoSplash />
      <div className={`telegram-app otto-skin otto-app-shell ${viewClass}`}>
        <div className="otto-backdrop" aria-hidden="true">
          <div className="otto-glow otto-glow-a" />
          <div className="otto-glow otto-glow-b" />
          <div className="otto-line-art" />
        </div>

        <main className="otto-app-content relative z-10 mx-auto max-w-4xl">
          {globalEye && <PageTranslationEye scopeId="otto-current-task" />}
          <div id={globalEye ? 'otto-current-task' : undefined} className={view === null ? 'otto-home-screen' : 'otto-inner-screen'}>
            {view === null && <Dashboard onSelectModule={setView} onOpenInstructions={() => setView('instructions')} onOpenExamGuide={() => setView('exam-guide')} onOpenMockExam={() => setView('mock-exam')} onOpenNews={() => setView('news')} onOpenAccount={() => setView('account')} progress={progress} />}
            <Suspense fallback={<div className="otto-route-loading" aria-hidden="true" />}>
              {view === 'modules' && <ModulesHub progress={progress} onSelectModule={setView} />}
              {view === 'account' && <AccountPage progress={progress} />}
              {view === 'settings' && <SettingsPage />}
              {view === 'news' && <NewsPage onBack={back} />}
              {view === 'instructions' && <Instructions onBack={back} />}
              {view === 'exam-guide' && <ExamGuide onBack={back} />}
              {view === 'mock-exam' && <MockExam onBack={back} />}
              {view === 'lesen' && <ReadingModule onBack={back} onComplete={complete('lesen')} />}
              {view === 'horen' && <ListeningModule onBack={back} onComplete={complete('horen')} />}
              {view === 'schreiben' && <WritingModule onBack={back} onComplete={complete('schreiben')} />}
              {view === 'sprechen' && <SpeakingModule onBack={back} onComplete={complete('sprechen')} />}
            </Suspense>
          </div>
        </main>

        {companionScene && (
          <div className={`otto-companion otto-companion-${companionScene}`} aria-hidden="true">
            <OttoScene scene={companionScene} className="otto-companion-scene" />
          </div>
        )}

        <BottomNav active={activeTab} onNavigate={navigateBottom} />
      </div>
    </>
  );
}
