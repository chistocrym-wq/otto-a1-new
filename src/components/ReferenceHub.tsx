import { useState } from 'react';
import { ArrowLeft, BookOpenCheck, ChevronRight, CircleHelp, GraduationCap, Headphones, Newspaper, PenLine, Route, UserRound } from 'lucide-react';
import { OttoScene } from '@/components/OttoScene';

interface Props{
  onOpenInstructions:()=>void;
  onOpenExamGuide:()=>void;
  onOpenHowTo:()=>void;
  onOpenAccount:()=>void;
  onOpenNews:()=>void;
}
type Guide='lesen'|'schreiben'|'horen';
type GuideSection={title:string;subtitle?:string;points:string[]};
const serifFont={fontFamily:'Georgia, "Times New Roman", serif'};
const sansFont={fontFamily:'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'};

const LESEN_SECTIONS:GuideSection[]=[
  {title:'Teil 1',subtitle:'Короткие письма и сообщения · Richtig / Falsch',points:[
    'Сначала прочитайте утверждение, а не весь текст. Поймите, что именно надо проверить: кто, когда, где, сколько, можно/нельзя.',
    'В тексте найдите одну фразу-доказательство. Ответ выбирайте по смыслу этой фразы, а не по совпавшему знакомому слову.',
    'Сравнивайте детали: время, день, место, число, отрицание. Именно там часто прячется отличие.',
    'Ловушки: nicht / kein, erst, nur, ab / bis, другое время или похожее число.',
    'Полный перевод текста обычно не нужен: достаточно понять утверждение и предложение, которое его подтверждает или опровергает.',
  ]},
  {title:'Teil 2',subtitle:'Ситуация + два источника / варианта',points:[
    'Сначала прочитайте ситуацию и сформулируйте потребность одним вопросом: что человеку нужно найти?',
    'Просматривайте оба варианта по ключевым признакам: услуга, место, время, цена, способ действия.',
    'Правильный вариант должен закрывать главное условие ситуации целиком, а не просто содержать похожее слово.',
    'Если оба варианта выглядят подходящими, ищите второе условие: где, когда, для кого, онлайн или на месте.',
    'Не переводите сайты/объявления полностью: найдите строку, которая доказывает, что нужная услуга действительно есть.',
  ]},
  {title:'Teil 3',subtitle:'Таблички, объявления, короткие правила · Richtig / Falsch',points:[
    'Сначала прочитайте утверждение, затем табличку. Ищите конкретное разрешение, запрет, время или место.',
    'Доказательство обычно короткое: одна строка с nur, nicht, verboten, geöffnet, geschlossen, ab или bis.',
    'Не додумывайте то, чего нет в объявлении. Проверяйте только то, что написано.',
    'Особенно внимательно сравнивайте день недели и время: утром/после обеда, ab/bis, сегодня/завтра.',
    'Полный перевод не нужен: достаточно понять правило и сопоставить его с утверждением.',
  ]},
];

const SCHREIBEN_SECTIONS:GuideSection[]=[
  {title:'Как набрать баллы проще',subtitle:'Короткий рабочий чек-лист для Teil 2',points:[
    'Сначала выделите в задании все 3 обязательных пункта.',
    'На каждый пункт напишите отдельную простую понятную фразу. Сначала закройте содержание, потом улучшайте текст.',
    'Используйте слова и формулировки, которые уже даны в самом задании: это снижает риск ошибки.',
    'Не пытайтесь специально показывать сложную грамматику. Надёжная простая фраза A1 полезнее длинной рискованной.',
    'Держите несколько выученных конструкций: Ich möchte … / Können Sie mir bitte …? / Vielen Dank … / Leider kann ich …',
    'Обращение: Sehr geehrte Damen und Herren, либо Liebe … / Lieber … — по ситуации.',
    'Завершение: Mit freundlichen Grüßen либо Viele Grüße / Liebe Grüße — по ситуации.',
    'Перед отправкой проверьте только главное: есть ли обращение, закрыты ли все 3 пункта, есть ли завершение.',
  ]},
];

const HOREN_SECTIONS:GuideSection[]=[
  {title:'Сначала — общий алгоритм',points:[
    'До аудио прочитайте вопрос и поймите, ЧТО именно нужно услышать: число, время, место, цену, действие или решение.',
    'Не выбирайте ответ только потому, что услышали знакомое слово. Нужен смысл ответа на вопрос.',
    'Следите за отрицаниями и поворотами: nicht / kein, aber, leider. Они часто меняют первоначальный смысл.',
    'Отличайте первое предложение от окончательного решения: сначала могут назвать один вариант, а потом выбрать другой.',
    'Числа, время, цены и даты слушайте особенно внимательно: похожие варианты специально легко перепутать.',
  ]},
  {title:'Teil 1',subtitle:'Короткие бытовые диалоги · A/B/C · каждый текст звучит дважды',points:[
    'Первое прослушивание: выберите наиболее вероятный вариант и отметьте, где сомневаетесь.',
    'Второе прослушивание: проверяйте именно сомнительную деталь — число, время, место или финальный выбор.',
    'Если в аудио прозвучали слова из двух вариантов, ориентируйтесь на итог реплики, а не на первое упоминание.',
  ]},
  {title:'Teil 2',subtitle:'Короткие объявления / информация · Richtig / Falsch · каждый текст звучит один раз',points:[
    'Здесь второго прослушивания нет: вопрос нужно прочитать заранее и сразу знать, какую деталь ловить.',
    'Проверяйте всю формулировку Richtig/Falsch. Одно совпавшее слово ещё не делает утверждение верным.',
    'Особенно важны sollen / müssen, место, направление, время и отрицание.',
  ]},
  {title:'Teil 3',subtitle:'Короткие сообщения · A/B/C · каждый текст звучит дважды',points:[
    'На первом прослушивании зафиксируйте вероятный ответ, на втором подтвердите конкретную деталь.',
    'Не цепляйтесь за знакомое слово: сравните все варианты с тем, что в итоге сообщили.',
    'Для номеров, цен, времени и дат мысленно повторите услышанное число перед выбором ответа.',
  ]},
];

const GUIDE_META:Record<Guide,{title:string;eyebrow:string;intro:string;sections:GuideSection[];Icon:typeof BookOpenCheck}>={
  lesen:{title:'LESEN — КАК ПРОХОДИТЬ ЗАДАНИЯ',eyebrow:'Экзаменационная стратегия',intro:'В Lesen три части. Цель — не переводить всё, а быстро находить доказательство ответа.',sections:LESEN_SECTIONS,Icon:BookOpenCheck},
  schreiben:{title:'SCHREIBEN — КАК НАБРАТЬ БАЛЛЫ ПРОЩЕ',eyebrow:'Экзаменационные лайфхаки',intro:'Формула письма и готовые конструкции в Schreiben остаются без изменений. Здесь — короткий чек-лист, как ими пользоваться на экзамене.',sections:SCHREIBEN_SECTIONS,Icon:PenLine},
  horen:{title:'HÖREN — ЛОВУШКИ ЭКЗАМЕНА',eyebrow:'Экзаменационная стратегия',intro:'В реальном Goethe A1 Teil 1 и Teil 3 звучат дважды, Teil 2 — один раз. Поэтому стратегия для частей различается.',sections:HOREN_SECTIONS,Icon:Headphones},
};

function GuidePage({guide,onBack}:{guide:Guide;onBack:()=>void}){
  const meta=GUIDE_META[guide];const Icon=meta.Icon;
  return <div className="animate-fade-in pb-8 text-[var(--otto-ink)]" style={sansFont}>
    <button type="button" onClick={onBack} className="mb-3 inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--otto-line)] bg-[var(--otto-surface)] px-4 text-sm font-bold text-[var(--otto-ink)]"><ArrowLeft className="h-4 w-4"/>Назад к справочнику</button>
    <section className="rounded-[28px] border border-[var(--otto-line)] bg-[var(--otto-surface)] p-5 shadow-[0_12px_30px_rgba(43,54,54,.07)] sm:p-6">
      <div className="flex items-start gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--otto-petrol-soft)] text-[var(--otto-petrol-dark)]"><Icon className="h-5 w-5"/></span><div><p className="text-[11px] font-[850] uppercase tracking-[.14em] text-[var(--otto-petrol-dark)]">{meta.eyebrow}</p><h1 className="mt-1 text-2xl font-bold leading-[1.08] text-[var(--otto-ink)]" style={serifFont}>{meta.title}</h1><p className="mt-2 text-sm leading-6 text-[var(--otto-muted)]">{meta.intro}</p></div></div>
      <div className="mt-5 space-y-3">{meta.sections.map(section=><section key={section.title} className="rounded-2xl border border-[var(--otto-line)] bg-[var(--otto-bg-soft)] p-4"><h2 className="text-base font-bold text-[var(--otto-ink)]">{section.title}</h2>{section.subtitle&&<p className="mt-1 text-xs font-semibold leading-5 text-[var(--otto-petrol-dark)]">{section.subtitle}</p>}<ul className="mt-3 space-y-2">{section.points.map(point=><li key={point} className="flex gap-2 text-sm leading-6 text-[var(--otto-muted)]"><span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--otto-petrol)]"/><span>{point}</span></li>)}</ul></section>)}</div>
    </section>
  </div>;
}

export function ReferenceHub({onOpenInstructions,onOpenExamGuide,onOpenHowTo,onOpenAccount,onOpenNews}:Props){
  const[guide,setGuide]=useState<Guide|null>(null);
  if(guide)return <GuidePage guide={guide} onBack={()=>setGuide(null)}/>;
  const items=[
    {title:'Как выполнять задания',copy:'Короткие правила работы с заданиями OTTO.',Icon:CircleHelp,onClick:onOpenInstructions},
    {title:'Lesen — как проходить задания',copy:'Teil 1 / 2 / 3: что читать первым, где искать доказательство и какие ловушки пропускать.',Icon:BookOpenCheck,onClick:()=>setGuide('lesen')},
    {title:'Schreiben — как набрать баллы проще',copy:'Практический чек-лист по трём пунктам, простым фразам, обращению и завершению.',Icon:PenLine,onClick:()=>setGuide('schreiben')},
    {title:'Hören — ловушки экзамена',copy:'Стратегия по Teil 1 / 2 / 3: что слушать, где ловушки и как использовать второе прослушивание.',Icon:Headphones,onClick:()=>setGuide('horen')},
    {title:'Как проходит экзамен A1',copy:'Структура экзамена и важные ориентиры по частям.',Icon:GraduationCap,onClick:onOpenExamGuide},
    {title:'Как тренироваться',copy:'Как сочетать ежедневную тренировку и самостоятельные модули.',Icon:Route,onClick:onOpenHowTo},
    {title:'Мой прогресс',copy:'Статистика попыток и результаты по навыкам.',Icon:UserRound,onClick:onOpenAccount},
    {title:'Новости A1',copy:'Обновления и полезная информация внутри OTTO.',Icon:Newspaper,onClick:onOpenNews},
  ];
  return <div className="animate-fade-in pb-8 text-[var(--otto-ink)]" style={sansFont}>
    <section className="relative overflow-hidden rounded-[28px] border border-[var(--otto-line)] bg-[var(--otto-petrol-soft)] p-5 sm:p-6">
      <div className="relative z-10 max-w-[70%]"><p className="text-[11px] font-[850] uppercase tracking-[.16em] text-[var(--otto-petrol-dark)]">OTTO A1</p><h1 className="mt-1 text-2xl font-bold leading-[1.05] text-[var(--otto-ink)]" style={serifFont}>Справочник</h1><p className="mt-2 text-sm leading-6 text-[var(--otto-muted)]">Все уже существующие полезные материалы — в одном месте, без дублирования.</p></div>
      <OttoScene scene="guide" className="absolute -bottom-16 -right-7 h-48 w-auto max-w-none sm:-bottom-20 sm:right-0 sm:h-56"/>
    </section>
    <section className="mt-4 rounded-[24px] border border-[var(--otto-line)] bg-[var(--otto-surface)] p-4 shadow-[0_12px_30px_rgba(43,54,54,.07)] sm:p-5">
      <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--otto-petrol-soft)] text-[var(--otto-petrol-dark)]"><BookOpenCheck className="h-5 w-5"/></span><div><p className="text-xs font-[850] uppercase tracking-[.14em] text-[var(--otto-petrol-dark)]">Материалы</p><h2 className="text-xl font-bold leading-[1.08] text-[var(--otto-ink)]" style={serifFont}>Что открыть</h2></div></div>
      <div className="mt-4 space-y-2">{items.map(({title,copy,Icon,onClick})=><button key={title} type="button" onClick={onClick} className="flex min-h-[74px] w-full items-center gap-3 rounded-2xl border border-[var(--otto-line)] bg-[var(--otto-bg-soft)] p-3 text-left"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--otto-surface)] text-[var(--otto-petrol-dark)]"><Icon className="h-5 w-5"/></span><span className="min-w-0 flex-1"><strong className="block text-sm text-[var(--otto-ink)]">{title}</strong><span className="mt-1 block text-xs leading-5 text-[var(--otto-muted)]">{copy}</span></span><ChevronRight className="h-4 w-4 shrink-0 text-[var(--otto-muted)]"/></button>)}</div>
    </section>
  </div>;
}
