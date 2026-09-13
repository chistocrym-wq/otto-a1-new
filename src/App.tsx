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

const moduleIds: ModuleId[] = ['lesen', 'horen', 'schreiben', 'sprechen'];

export default function App() {
  const productMode = getOttoProductMode();
  const [view, setView] = useState<View>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const moduleStartedAt = useRef(Date.now());
  const { progress, activity, recordScore } = useProgress();
  const back = useCallback(() => setView(null), []);

  const openModule = useCallback((module: ModuleId) => {
    moduleStartedAt.current = Date.now();
    setView(module);
  }, []);

  useEffect(() => {
    const t = window.Telegram?.WebApp;
    if (t) { t.ready(); t.expand(); }
  }, []);

  useEffect(() => {
    if (view && (moduleIds.includes(view as ModuleId) || view === 'phrases-speaking')) moduleStartedAt.current = Date.now();
  }, [view]);

  useEffect(() => {
    const b = window.Telegram?.WebApp.BackButton;
    if (!b) return;
    if (view === null) { b.hide(); return; }
    b.show();
    b.onClick(back);
    return () => { b.offClick(back); };
  }, [back, view]);

  useEffect(() => {
    if (!actionNotice) return;
    const id = window.setTimeout(() => setActionNotice(null), 2600);
    return () => window.clearTimeout(id);
  }, [actionNotice]);

  const shareApp = useCallback(async () => {
    const url = window.location.href.split('?')[0];
    const data = { title: 'OTTO — Zertifikat A1', text: 'Тренажёр OTTO для подготовки к Zertifikat A1', url };
    try {
      if (navigator.share) {
        await navigator.share(data);
        return;
      }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setActionNotice('Ссылка на OTTO скопирована');
        return;
      }
      window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(data.text)}`, '_blank', 'noopener,noreferrer');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setActionNotice('Не удалось открыть меню «Поделиться»');
    }
  }, []);

  const complete = (module: ModuleId) => (score: number, total: number) => {
    const elapsed = Math.max(0, (Date.now() - moduleStartedAt.current) / 1000);
    recordScore(module, score, total, elapsed);
    moduleStartedAt.current = Date.now();
  };
  const viewClass = `otto-view-${view ?? 'home'}`;

  const activeTab = useMemo<BottomTab>(() => {
    if (view === null || view === 'mock-exam' || view === 'news' || view === 'support' || view === 'instructions' || view === 'exam-guide') return 'home';
    if (view === 'modules' || view === 'lesen' || view === 'horen' || view === 'schreiben' || view === 'sprechen' || view === 'phrases-speaking') return 'modules';
    if (view === 'readiness') return 'readiness';
    if (view === 'account') return 'account';
    return 'settings';
  }, [view]);

  const companionScene = useMemo<OttoSceneName | null>(() => {
    if (view === 'lesen') return 'lesen';
    if (view === 'horen') return 'horen';
    if (view === 'schreiben') return 'schreiben';
    if (view === 'sprechen' || view === 'phrases-speaking' || view === 'instructions' || view === 'exam-guide') return 'guide';
    if (view === 'mock-exam') return 'exam';
    if (view === 'readiness' || view === 'news') return 'home';
    return null;
  }, [view]);

  const navigateBottom = useCallback((tab: BottomTab) => {
    if (tab === 'home') setView(null);
    if (tab === 'modules') setView('modules');
    if (tab === 'readiness' && productMode === 'full') setView('readiness');
    if (tab === 'account') setView('account');
    if (tab === 'settings') setView('settings');
  }, [productMode]);

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
          <div className={view === null ? 'otto-home-screen' : 'otto-inner-screen'}>
            {view === null && productMode === 'full' && (
              <Dashboard
                onSelectModule={openModule}
                onOpenInstructions={() => setView('instructions')}
                onOpenExamGuide={() => setView('exam-guide')}
                onOpenMockExam={() => setView('mock-exam')}
                onOpenNews={() => setView('news')}
                onOpenAccount={() => setView('account')}
                onOpenSettings={() => setView('settings')}
                onOpenReadiness={() => setView('readiness')}
                onShare={shareApp}
                onOpenSupport={() => setView('support')}
                progress={progress}
                activity={activity}
              />
            )}
            <Suspense fallback={<div className="otto-route-loading" aria-hidden="true" />}>
              {view === null && productMode === 'basic' && <ModulesHub progress={progress} onSelectModule={openModule} />}
              {view === 'modules' && <ModulesHub progress={progress} onSelectModule={openModule} />}
              {view === 'readiness' && productMode === 'full' && <ReadinessPage progress={progress} activity={activity} onBack={back} onSelectModule={openModule} onOpenMockExam={() => setView('mock-exam')} onOpenPhrases={() => setView('phrases-speaking')} />}
              {view === 'phrases-speaking' && productMode === 'full' && <PhraseSpeakingPractice onBack={() => setView('readiness')} onOpenWriting={() => openModule('schreiben')} onComplete={complete('sprechen')} />}
              {view === 'account' && <AccountPage progress={progress} />}
              {view === 'settings' && <SettingsPage />}
              {view === 'news' && <NewsPage onBack={back} />}
              {view === 'support' && <SupportPage onBack={back} />}
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

        {actionNotice && <div className="otto-action-toast" role="status">{actionNotice}</div>}
        <BottomNav active={activeTab} onNavigate={navigateBottom} mode={productMode} />
      </div>
    </>
  );
}
