import type { ActivityEntry, ModuleId, Progress } from '@/types';
import { loadLearningProfile } from '@/lib/learningProfile';
import { MODULE_META } from '@/lib/preparation';

export interface ModuleInsight {
  id: ModuleId;
  attempts: number;
  average: number | null;
  mistakes: number;
  correct: number;
  answered: number;
}

export interface LearningInsights {
  modules: ModuleInsight[];
  strongest: ModuleInsight | null;
  weakest: ModuleInsight | null;
  writingErrors: ReturnType<typeof loadLearningProfile>['errors'];
  hasData: boolean;
}

const MODULES:ModuleId[]=['lesen','horen','schreiben','sprechen'];

export function buildLearningInsights(progress:Progress,activity:ActivityEntry[]):LearningInsights{
  const modules=MODULES.map(id=>{
    const entries=activity.filter(item=>item.module===id).slice(0,12);
    const p=progress[id];
    const attempts=entries.length||p?.attempts||0;
    const average=entries.length?Math.round(entries.reduce((sum,item)=>sum+item.percent,0)/entries.length):typeof p?.lastScore==='number'?p.lastScore:null;
    const answered=Math.max(0,Math.round(p?.answered??p?.total??0));
    const correct=Math.max(0,Math.round(p?.correct??0));
    const activityMistakes=entries.reduce((sum,item)=>sum+Math.max(0,Math.round(item.total-item.score)),0);
    const mistakes=Math.max(activityMistakes,Math.max(0,answered-correct));
    return{id,attempts,average,mistakes,correct,answered};
  });
  const measured=modules.filter(item=>item.attempts>0&&item.average!==null);
  const strongest=measured.length?[...measured].sort((a,b)=>(b.average??0)-(a.average??0)||b.attempts-a.attempts)[0]:null;
  const weakest=measured.length?[...measured].sort((a,b)=>(a.average??100)-(b.average??100)||b.mistakes-a.mistakes)[0]:null;
  return{modules,strongest,weakest,writingErrors:loadLearningProfile().errors,hasData:measured.length>0};
}

export function moduleInsightLabel(id:ModuleId){return MODULE_META[id].title}
