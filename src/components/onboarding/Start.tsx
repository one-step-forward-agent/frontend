import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles, Send, ArrowRight, Check, Reply, Forward, Trash2, ChevronDown, type LucideIcon,
  Star, Clock, Users, ShieldCheck, Mic, PlayCircle
} from "lucide-react";

import { getPerspectiveMatrix, type Point } from "@/utils/perspective";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/utils/cn";

import LandingHeader from "@/components/landing/LandingHeader";
import LandingFooter from "@/components/landing/LandingFooter";
import { tr } from "@/i18n";

/* ═══════════════════════════════════════════════════════════
   Main Page Component
   ═══════════════════════════════════════════════════════════ */

export const Start: React.FC = () => {
  const navigate = useNavigate();
  const start = () => navigate("/onboarding/field-of-activity");

  const [finalCtaActive, setFinalCtaActive] = React.useState(false);
  const handleFinalCtaActive = React.useCallback((active: boolean) => {
    setFinalCtaActive(active);
  }, []);

  return (
    <div className="relative min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white overflow-x-clip">
      <PageBackdrop />
      <LandingHeader />

      <div className="relative z-10">
        <Hero onStart={start} />
        <HowItWorks onStart={start} />
        <UserCaseCarousel paused={finalCtaActive} onStart={start} />
        <DesktopAgentVideoSection />
        <FAQSection />
        <FinalCTA onStart={start} onActiveChange={handleFinalCtaActive} />
        
        <SocialMediaSection />
        
        <ReviewsSection />
        <BlogsSection />
        <LandingFooter />
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   Liquid Glass Button Component
   ═══════════════════════════════════════════════════════════ */

const LiquidButton: React.FC<{
  onClick?: () => void;
  href?: string;
  target?: string;
  rel?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ onClick, href, target, rel, children, className }) => {
  const baseClass = cn(
    "group relative inline-flex items-center justify-center overflow-hidden",
    "px-6 h-12 md:h-14",
    "text-base font-semibold",
    "rounded-full transition-all duration-300 ease-out",
    "hover:-translate-y-0.5 active:translate-y-0",
    "bg-white/10 dark:bg-white/[0.05] backdrop-blur-xl",
    "ring-1 ring-white/30 dark:ring-white/10",
    "shadow-[0_4px_24px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.7)]",
    "hover:bg-white/20 dark:hover:bg-white/[0.1]",
    "text-gray-900 dark:text-white",
    className
  );

  const inner = (
    <>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-full bg-[linear-gradient(135deg,rgba(255,255,255,0.1)_0%,rgba(255,255,255,0.02)_25%,transparent_45%,transparent_75%,rgba(147,197,253,0.05)_100%)]"
      />
      <span className="relative inline-flex items-center gap-2">
        {children}
      </span>
    </>
  );

  if (href) {
    return (
      <a href={href} target={target} rel={rel} className={baseClass}>
        {inner}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className={baseClass}>
      {inner}
    </button>
  );
};

/* ═══════════════════════════════════════════════════════════
   Shared UI Helpers
   ═══════════════════════════════════════════════════════════ */

type MenuItem = { label: string; icon: LucideIcon; tone?: "default" | "danger" };
const FORWARD_LABEL = tr("Переслать Deyla", "Forward to Deyla");
const CONTEXT_MENU_ITEMS: MenuItem[] = [
  { label: tr("Ответить", "Reply"), icon: Reply },
  { label: FORWARD_LABEL, icon: Forward },
  { label: tr("Удалить", "Delete"), icon: Trash2, tone: "danger" },
];

const ChatContextMenu: React.FC = () => (
  <div className="relative rounded-2xl overflow-visible bg-white/95 dark:bg-gray-900/95 backdrop-blur-md max-md:backdrop-blur-none ring-1 ring-gray-200/80 dark:ring-gray-700/60 shadow-2xl" role="menu">
    {CONTEXT_MENU_ITEMS.map(({ label, icon: Icon, tone }, i) => {
      const isDanger = tone === "danger";
      const isHighlighted = label === FORWARD_LABEL;
      return (
        <React.Fragment key={label}>
          {isDanger && i > 0 && <div className="h-px bg-gray-100 dark:bg-gray-800" />}
          <button type="button" role="menuitem" tabIndex={-1}
            className={cn(
              "relative isolate w-full flex items-center gap-2.5 px-3 py-2 text-left text-[15px] font-medium transition-colors rounded-xl",
              isHighlighted ? "z-10" : "z-0",
              isDanger && "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40",
              !isDanger && !isHighlighted && "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/60"
            )}
          >
            {isHighlighted && (
              <>
                <span aria-hidden="true" className="absolute inset-[-30%] z-0 pointer-events-none blur-xl rounded-full" style={{ background: "radial-gradient(circle at center, rgba(59,130,246,0.75) 0%, rgba(99,102,241,0.45) 40%, rgba(139,92,246,0.2) 65%, transparent 90%)" }} />
                <span aria-hidden="true" className="absolute inset-0 z-10 pointer-events-none rounded-xl bg-white dark:bg-gray-900 shadow-md" />
              </>
            )}
            <Icon size={13} className={cn("shrink-0 relative z-20", isDanger && "text-red-500 dark:text-red-400", !isDanger && !isHighlighted && "text-gray-400 dark:text-gray-500")} aria-hidden="true" />
            <span className="relative z-20 flex-1 truncate">{label}</span>
          </button>
        </React.Fragment>
      );
    })}
  </div>
);

const RegisterButton: React.FC = () => (
  <div className="mt-1">
    <LiquidButton 
      href="https://deyla.tech/registration" 
      target="_blank" 
      rel="noreferrer" 
      className="h-7 px-3 text-xs bg-blue-600/10 text-blue-600 dark:text-blue-400 ring-blue-500/20 hover:bg-blue-600/20"
    >
      {tr("Зарегистрироваться", "Register")}
      <ArrowRight size={12} />
    </LiquidButton>
  </div>
);

const WorksList: React.FC = () => (
  <div>
    <p className="text-xs uppercase tracking-wide text-blue-600 dark:text-blue-400 font-semibold mb-2">
      {tr("Могу сделать за вас", "I can do for you")}
    </p>
    <ul className="space-y-1.5 text-sm text-gray-800 dark:text-gray-200">
      {[
        tr("ответить на письма", "write and send an email"),
        tr("заполнить таблицу и оформить отчёт", "fill a spreadsheet and draft a report"),
        tr("найти данные в браузере и сохранить", "browse and save information"),
      ].map((w, i) => (
        <li key={i} className="flex items-start gap-2">
          <span>{w}</span>
        </li>
      ))}
    </ul>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   Animated Chat (Deyla)
   ═══════════════════════════════════════════════════════════ */

interface AnimatedMessage {
  role: "user" | "deyla";
  text?: string;
  content?: React.ReactNode;
  forwardedFrom?: string;
}

interface AnimatedChatProps {
  messages: AnimatedMessage[];
  active?: boolean;
  speed?: number;
  pauseBetween?: number;
  className?: string;
}

const AnimatedChat: React.FC<AnimatedChatProps> = ({
  messages, active = true, speed = 28, pauseBetween = 800, className,
}) => {
  const [msgIndex, setMsgIndex] = React.useState(0);
  const [typed, setTyped] = React.useState("");
  const [isTyping, setIsTyping] = React.useState(false);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [msgIndex, typed]);

  React.useEffect(() => {
    if (!active || msgIndex >= messages.length) return;
    let cancelled = false;
    let timeoutId: number | undefined;
    const sleep = (ms: number) => new Promise<void>((res) => { timeoutId = window.setTimeout(res, ms); });

    const run = async () => {
      const msg = messages[msgIndex];
      setTyped("");
      if (msg.text) {
        setIsTyping(true);
        for (let j = 1; j <= msg.text.length; j++) {
          await sleep(speed);
          if (cancelled) return;
          setTyped(msg.text.slice(0, j));
        }
        setIsTyping(false);
      }
      await sleep(pauseBetween);
      if (cancelled) return;
      setMsgIndex((i) => i + 1);
    };
    run();
    return () => { cancelled = true; if (timeoutId) window.clearTimeout(timeoutId); };
  }, [msgIndex, messages, active, speed, pauseBetween]);

  const renderContent = (msg: AnimatedMessage, text: string, showCursor: boolean, isLatest: boolean, isTyping: boolean) => {
    if (msg.role === "user") {
      if (msg.content) return <React.Fragment>{msg.content}</React.Fragment>;
      return (
        <div className="flex justify-end mb-3">
          <div className="max-w-[82%] rounded-2xl rounded-br-sm bg-gradient-to-br from-blue-500/90 to-blue-600/90 text-white px-4 py-2.5 ring-1 ring-white/25 shadow-[0_4px_16px_rgba(59,130,246,0.35),inset_0_1px_0_rgba(255,255,255,0.35)]">
            {msg.forwardedFrom && <p className="text-[10px] uppercase tracking-wide opacity-75 mb-1">{msg.forwardedFrom}</p>}
            <p className="text-sm leading-snug">
              {text}
              {showCursor && <span className="inline-block w-[2px] h-[1em] ml-[1px] align-middle bg-current caret-blink" />}
            </p>
          </div>
        </div>
      );
    }

    const showContent = !isTyping;

    return (
      <div className="flex items-end gap-2 mb-3">
        {isLatest ? (
          <img src="/images/MaskotGirl.webp" alt="Deyla" className="w-7 h-7 rounded-full object-cover shrink-0 shadow-md ring-1 ring-white/40" />
        ) : (
          <div className="w-7 h-7 shrink-0" />
        )}
        <div className="max-w-[86%] min-w-0 flex flex-col gap-1.5 flex-1">
          {msg.text && (
            <div className="inline-block max-w-full self-start rounded-2xl rounded-bl-sm px-4 py-3 bg-white/80 dark:bg-white/[0.1] backdrop-blur-md ring-1 ring-black/5 dark:ring-white/10 shadow-sm">
              <div className="text-sm text-gray-900 dark:text-white leading-snug">
                {text}
                {showCursor && <span className="inline-block w-[2px] h-[1em] ml-[1px] align-middle bg-current caret-blink" />}
              </div>
            </div>
          )}
          {msg.content && showContent && <div className="w-full">{msg.content}</div>}
        </div>
      </div>
    );
  };

  return (
    <div className={cn("relative", className)}>
      {messages.map((msg, i) => {
        if (i > msgIndex) return null;
        const isCurrent = i === msgIndex;
        const text = isCurrent ? typed : msg.text ?? "";
        const showCursor = isCurrent && isTyping;
        const isLatest = i === Math.min(msgIndex, messages.length - 1);
        return <React.Fragment key={i}>{renderContent(msg, text, showCursor, isLatest, isCurrent && isTyping)}</React.Fragment>;
      })}
      <div ref={bottomRef} className="h-1" />
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   Hero Scene (Artem -> Deyla)
   ═══════════════════════════════════════════════════════════ */

const CalendarResponse: React.FC<{ onAction?: (action: 'sure' | 'later') => void; actionTaken?: boolean }> = ({ onAction, actionTaken }) => (
  <div className="rounded-2xl bg-white dark:bg-gray-900 ring-1 ring-gray-200/70 dark:ring-gray-800 shadow-md overflow-hidden w-full">
    <div className="p-4 pb-2">
      <p className="text-xs text-gray-500 dark:text-gray-400">{tr("Завтра", "Tomorrow")}</p>
      <p className="text-sm font-semibold text-gray-900 dark:text-white">{tr("четверг, 12 ноября", "Thursday, 12 November")}</p>
    </div>
    <ul className="px-3 pb-2 space-y-1">
      <li className="flex items-center gap-2 p-2 text-sm">
        <span className="text-xs text-gray-400 tabular-nums w-12">11:10</span>
        <span className="flex-1 text-gray-800 dark:text-gray-200">{tr("Лекция по экономике", "Economics lecture")}</span>
      </li>
      <li className="flex items-center gap-2 p-2 rounded bg-blue-50/70 dark:bg-blue-950/30 ring-1 ring-blue-200/70 dark:ring-blue-800/50 text-sm">
        <span className="text-xs text-gray-400 tabular-nums w-12">16:00</span>
        <span className="flex-1 text-gray-900 dark:text-white">{tr("Созвон с командой", "Team call")}</span>
        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-blue-500 text-white">{tr("Новое", "New")}</span>
      </li>
      <li className="flex items-center gap-2 p-2 text-sm">
        <span className="text-xs text-gray-400 tabular-nums w-12">18:30</span>
        <span className="flex-1 text-gray-800 dark:text-gray-200">{tr("Встреча с поставщиком", "Meeting with supplier")}</span>
      </li>
    </ul>
    {!actionTaken && (
      <div className="px-3 pb-3">
        <div className="p-2.5 rounded bg-blue-50/70 dark:bg-blue-900/20">
          <div className="flex items-center gap-2 text-xs text-blue-800 dark:text-blue-200">
            <Sparkles size={12} aria-hidden="true" />
            <span>{tr("Не успели задачу? Перенесём на завтра?", "Didn't finish a task? Move it to tomorrow?")}</span>
          </div>
          <div className="mt-2 flex gap-1">
            <button onClick={() => onAction?.('sure')} type="button" className="px-2.5 h-6 rounded text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors">
              {tr("Давай", "Sure")}
            </button>
            <button onClick={() => onAction?.('later')} type="button" className="px-2 h-6 rounded text-xs font-medium text-blue-700/70 dark:text-blue-300/70 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
              {tr("Позже", "Later")}
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
);

const DeadlineProposal: React.FC<{ onAction?: (action: 'do' | 'not_now') => void; actionTaken?: boolean }> = ({ onAction, actionTaken }) => (
  <div className="rounded-2xl bg-white/80 dark:bg-white/[0.08] backdrop-blur-md ring-1 ring-black/5 dark:ring-white/10 shadow-sm p-4 w-full">
    <p className="text-sm text-gray-900 dark:text-white mb-3">
      {tr("У вас накопились задолженности", "You have accumulated tasks, shall I do the following for you?")}
    </p>
    <WorksList />
    {!actionTaken && (
      <div className="mt-3 flex gap-2">
        <button onClick={() => onAction?.('do')} className="px-3 py-1.5 rounded-full text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors">
          {tr("Надо сделать", "Do it")}
        </button>
        <button onClick={() => onAction?.('not_now')} className="px-3 py-1.5 rounded-full text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          {tr("Не сейчас", "Not now")}
        </button>
      </div>
    )}
  </div>
);

const ArtemChat: React.FC<{ step: number; compact?: boolean }> = ({ step, compact }) => (
  <div className={cn("relative h-full flex flex-col transition-all duration-700", compact && "opacity-60")}>
    <div className={cn("flex items-center gap-2 px-4 py-3", compact && "py-2")}>
      <div className={cn("rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-semibold shrink-0 transition-all duration-700", compact ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm")}>
        AA
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn("font-medium text-gray-900 dark:text-white truncate transition-all duration-700", compact ? "text-sm" : "text-[20px]")}>Artem Andreevich</p>
        {!compact && <p className="text-[16px] text-emerald-500">online</p>}
      </div>
    </div>

    {!compact ? (
      <div className="flex-1 p-4 flex flex-col justify-end">
        <div className={cn("self-start max-w-[85%] rounded-2xl rounded-bl-sm bg-gray-100 dark:bg-gray-800 px-4 py-3 transition-all duration-500 ease-out origin-bottom-left", step >= 1 ? "scale-100 opacity-100" : "scale-90 opacity-0")}>
          <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
            {tr("Назначил созвон на завтра, 16 часов, ссылка ", "Scheduled a call for tomorrow, 16:00, link ")}
            <span className="italic underline decoration-gray-400 underline-offset-2">meet.com</span>
          </p>
        </div>
        <div className={cn("mt-3 self-start transition-all duration-500 ease-out", step >= 1 ? "opacity-100 translate-y-0 h-auto" : "opacity-0 translate-y-4 h-0 overflow-hidden")}>
          <button type="button" className={cn("inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200", "bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300", step === 2 ? "scale-110 ring-2 ring-blue-400 bg-blue-100 dark:bg-blue-900/50" : "scale-100", step > 2 ? "bg-blue-600 text-white ring-0 scale-100" : "")}>
            <Forward size={16} />
            {tr("Переслать Deyla", "Forward to Deyla")}
          </button>
        </div>
      </div>
    ) : (
      <div className="px-4 py-2 flex-1 flex items-center">
        <div className="self-start max-w-full rounded-2xl rounded-bl-sm bg-gray-100/50 dark:bg-gray-800/50 px-3 py-1.5">
          <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
            {tr("Назначил созвон на завтра, 16 часов, ссылка ", "Scheduled a call for tomorrow, 16:00, link ")}
            <span className="italic underline">meet.com</span>
          </p>
        </div>
      </div>
    )}
  </div>
);

const HeroChat: React.FC<{ active: boolean; messages: AnimatedMessage[] }> = ({ active, messages }) => (
  <div className="relative h-full overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent p-2">
    <AnimatedChat messages={messages} active={active} className="relative" />
  </div>
);

const HERO_SCENE_W = 790;
const HERO_SCENE_H = 740;

const HeroScene: React.FC = () => {
  const [artemStep, setArtemStep] = React.useState(0);
  const [showDeyla, setShowDeyla] = React.useState(false);
  const [calAction, setCalAction] = React.useState<'sure' | 'later' | null>(null);
  const [deadAction, setDeadAction] = React.useState<'do' | 'not_now' | null>(null);

  React.useEffect(() => {
    const t1 = setTimeout(() => setArtemStep(1), 600);
    const t2 = setTimeout(() => setArtemStep(2), 2000);
    const t3 = setTimeout(() => { setArtemStep(3); setShowDeyla(true); }, 2600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const handleCalAction = (act: 'sure' | 'later') => setCalAction(act);
  const handleDeadAction = (act: 'do' | 'not_now') => setDeadAction(act);

  const dynamicMessages: AnimatedMessage[] = [
    { 
      role: "user", 
      content: (
        <div className="flex justify-end mb-3">
          <div className="max-w-[82%] rounded-2xl rounded-br-sm bg-gradient-to-br from-blue-500/90 to-blue-600/90 text-white px-4 py-2.5 ring-1 ring-white/25 shadow-[0_4px_16px_rgba(59,130,246,0.35),inset_0_1px_0_rgba(255,255,255,0.35)]">
            <p className="text-[10px] uppercase tracking-wide opacity-75 mb-1">{tr("Переслано от Artem Andreevich", "Forwarded from Artem Andreevich")}</p>
            <p className="text-sm leading-snug">
              {tr("Назначил созвон на завтра, 16 часов, ссылка ", "Scheduled a call for tomorrow, 16:00, link ")}
              <span className="italic underline decoration-white/50 underline-offset-2">meet.com</span>
            </p>
          </div>
        </div>
      )
    },
    { role: "deyla", content: <CalendarResponse onAction={handleCalAction} actionTaken={!!calAction} /> },
    { role: "deyla", content: <DeadlineProposal onAction={handleDeadAction} actionTaken={!!deadAction} /> },
  ];

  if (calAction === 'sure') {
    dynamicMessages.push({ role: "deyla", text: tr("Отлично! Давай зарегистрируемся, чтобы я могла сохранять твои задачи.", "Great! Let's register so I can save your tasks."), content: <RegisterButton /> });
  } else if (calAction === 'later') {
    dynamicMessages.push({ role: "deyla", text: tr("Хорошо, напомню позже. А пока давай зарегистрируемся.", "Okay, I'll remind you later. Meanwhile, let's register."), content: <RegisterButton /> });
  }

  if (deadAction === 'do') {
    dynamicMessages.push({ role: "deyla", text: tr("Супер! Я готова приступить. Зарегистрируйтесь, чтобы я начала выполнять задачи.", "Awesome! I'm ready. Register to let me start doing the tasks."), content: <RegisterButton /> });
  } else if (deadAction === 'not_now') {
    dynamicMessages.push({ role: "deyla", text: tr("Поняла, отложим. Когда будете готовы — я здесь. Зарегистрируйтесь, чтобы сохранить прогресс.", "Got it, we'll postpone. I'm here when you're ready. Register to save progress."), content: <RegisterButton /> });
  }

  return (
    <div className="relative w-full min-w-0" style={{ containerType: "inline-size", aspectRatio: `${HERO_SCENE_W / HERO_SCENE_H}` }} role="img">
      <div className="absolute top-0 left-0 origin-top-left" style={{ width: HERO_SCENE_W, height: HERO_SCENE_H, transform: `scale(calc(100cqw / ${HERO_SCENE_W * 1.05}px))` }}>
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="relative w-[710px] h-[680px] flex flex-col gap-4">
            <div className={cn("transition-all duration-700 ease-in-out overflow-hidden shrink-0", showDeyla ? "h-[110px]" : "h-full")}>
              <ArtemChat step={artemStep} compact={showDeyla} />
            </div>
            <div className={cn("transition-all duration-700 ease-in-out flex-1", showDeyla ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8 pointer-events-none")}>
              <HeroChat active={showDeyla} messages={dynamicMessages} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Hero: React.FC<{ onStart: () => void }> = ({ onStart }) => (
  <section className="relative">
    <div className="max-w-6xl mx-auto px-4 md:px-6 pt-28 md:pt-40 lg:pt-52 pb-4 md:pb-6 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center min-w-0">
      <div className="text-eyebrow min-w-0">
        <h1 className="text-eyebrowtext-4xl md:text-6xl font-semibold tracking-tight leading-[1.05]">
          {tr("Deyla заберёт", "Deyla takes")}{" "}
          <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 bg-clip-text text-transparent">
            {tr("от 1 часа", "an hour or more")}
          </span>
          {tr(" Вашей работы", " of work off your plate")}{" "}
        </h1>
        <p className="mt-5 text-lg text-gray-600 dark:text-gray-400 max-w-xl">
          {tr("Deyla соединяет планы, помогает не терять главное и выполняет вашу работу сама", "Deyla connects your plans and helps you keep sight of what matters in the flow of things.")}
        </p>

        <div className="mt-8">
          <LiquidButton onClick={onStart} className="px-8 h-14 text-lg">
            {tr("Начать бесплатно", "Start for free")}
            <ArrowRight size={20} className="transition-transform group-hover:translate-x-0.5" />
          </LiquidButton>
        </div>
      </div>
      <div className="min-w-0"><HeroScene /></div>
    </div>
  </section>
);

/* ═══════════════════════════════════════════════════════════
   How It Works Section
   ═══════════════════════════════════════════════════════════ */

const HowItWorks: React.FC<{ onStart: () => void }> = ({ onStart }) => (
  <section className="py-16 md:py-24 px-4 md:px-6 bg-gray-50/50 dark:bg-gray-900/20">
    <div className="max-w-6xl mx-auto">
      <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-center text-gray-900 dark:text-white mb-16">
        {tr("Три шага до спокойного дня", "Three steps to a calm day")}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
        {[
          { num: "1", title: tr("Напишите", "Write"), desc: tr("Текстом, голосом или пересланным сообщением из Telegram.", "By text, voice, or a forwarded message from Telegram.") },
          { num: "2", title: tr("Deyla разберёт", "Deyla parses"), desc: tr("Найдёт дату, время и приоритет и создаст задачу.", "Finds the date, time, and priority, and creates the task.") },
          { num: "3", title: tr("Получите план", "Get the plan"), desc: tr("Увидите день по часам: задачи рядом со встречами.", "See your day by the hour: tasks next to meetings.") },
        ].map((step) => (
          <div key={step.num} className="relative p-6">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center text-lg font-bold mb-4">
              {step.num}
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{step.title}</h3>
            <p className="text-gray-600 dark:text-gray-400">{step.desc}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div>
          <Badge className="mb-3">{tr("Сказали — записано", "Said — recorded")}</Badge>
          <h3 className="text-3xl font-semibold mb-4">{tr("Продиктуйте задачу на ходу.", "Dictate a task on the go.")}</h3>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
            {tr("Deyla сама определит дату, время и приоритет.", "Deyla will determine the date, time, and priority itself.")}
          </p>
          <LiquidButton onClick={onStart}>
            <Mic size={18} />
            {tr("Попробовать голосом", "Try with voice")}
          </LiquidButton>
        </div>
        <div className="relative mx-auto w-full max-w-sm">
          <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 shadow-xl ring-1 ring-gray-200 dark:ring-gray-800">
            <div className="flex items-center gap-3 mb-3 border-b border-gray-100 dark:border-gray-800 pb-3">
              <Mic className="text-blue-500" size={20} />
              <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full w-2/3 bg-blue-500 rounded-full" />
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl">
              <p className="text-gray-900 dark:text-white font-medium">{tr("Купить подарок", "Buy a gift")}</p>
              <p className="text-sm text-blue-600 dark:text-blue-400">{tr("завтра, 18:00", "tomorrow, 18:00")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

/* ═══════════════════════════════════════════════════════════
   Phone Frames & Scenes
   ═══════════════════════════════════════════════════════════ */

const IMG_W = 396, IMG_H = 773, UI_W = 400, UI_H = 866;
const IPHONE_SCREEN_CORNERS: [Point, Point, Point, Point] = [[37, -0.3], [98, 17.3], [97, 98], [7, 96]];
const IPHONE_MASK_BOTTOM = "linear-gradient(to bottom, black 0%, black 32%, rgba(0,0,0,0.92) 40%, rgba(0,0,0,0.72) 45%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.0) 54%, transparent 92%, transparent 100%)";
const IPHONE_VISIBLE_RATIO = 0.6;

const IPhoneFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(0.4);
  React.useLayoutEffect(() => {
    const el = wrapperRef.current; if (!el) return;
    const update = () => { const w = el.clientWidth; if (w > 0) setScale(w / IMG_W); };
    update();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(update); ro.observe(el); return () => ro.disconnect();
  }, []);
  const matrix = React.useMemo(() => {
    const dst = IPHONE_SCREEN_CORNERS.map(([px, py]) => [(px / 100) * IMG_W, (py / 100) * IMG_H]) as [Point, Point, Point, Point];
    return getPerspectiveMatrix([[0, 0], [UI_W, 0], [UI_W, UI_H], [0, UI_H]], dst);
  }, []);
  return (
    <div ref={wrapperRef} className="relative w-full" style={{ height: IMG_H * scale * IPHONE_VISIBLE_RATIO }}>
      <div className="absolute top-0 left-0 origin-top-left" style={{ width: IMG_W, height: IMG_H, transform: `scale(${scale})`, WebkitMaskImage: IPHONE_MASK_BOTTOM, maskImage: IPHONE_MASK_BOTTOM }}>
        <img src="/images/iPhone.webp" alt="iPhone" className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none" loading="lazy" draggable={false} />
        <div className="absolute top-0 left-0 overflow-hidden pointer-events-none select-none" style={{ width: UI_W, height: UI_H, transformOrigin: "0 0", transform: matrix, borderRadius: 50 }}>
          {children}
        </div>
      </div>
    </div>
  );
};

const IPhoneScene: React.FC<{ onStepChange?: (step: number) => void }> = ({ onStepChange }) => {
  const [step, setStep] = React.useState(0);
  const [typed, setTyped] = React.useState("");
  
  React.useEffect(() => { if (onStepChange) onStepChange(step); }, [step, onStepChange]);

  React.useEffect(() => {
    let cancelled = false;
    let timeoutId: number;
    const sleep = (ms: number) => new Promise<void>(r => { timeoutId = window.setTimeout(r, ms); });
    
    const run = async () => {
      await sleep(500);
      if (cancelled) return;
      setStep(1); // Typing
      
      const DAD_TEXT = tr("Привет! Не забудь про рейс ✈️", "Hi! Don't forget your flight ✈️");
      for (let i = 1; i <= DAD_TEXT.length; i++) {
        await sleep(35);
        if (cancelled) return;
        setTyped(DAD_TEXT.slice(0, i));
      }
      
      await sleep(800);
      if (cancelled) return;
      setStep(2); // Ticket shown
      
      await sleep(1000);
      if (cancelled) return;
      setStep(3); // Context menu shown
    };
    
    run();
    return () => { cancelled = true; clearTimeout(timeoutId); };
  }, []);
  
  return (
    <IPhoneFrame>
      <div className="absolute inset-0 flex flex-col bg-white dark:bg-gray-950">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-semibold shrink-0">{tr("п", "D")}</div>
          <div className="min-w-0 flex-1">
            <p className="text-[20px] font-medium text-gray-900 dark:text-white truncate">{tr("Папа", "Dad")}</p>
            <p className="text-[20px] text-emerald-500">online</p>
          </div>
        </div>
        <div className="flex-1 p-3 space-y-2">
          {step >= 1 && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-gray-100 dark:bg-gray-800 px-2.5 py-1.5">
                <p className="text-[20px] text-gray-800 dark:text-gray-200">
                  {typed}
                  {step === 1 && <span className="inline-block w-[2px] h-[1em] ml-[1px] align-middle bg-current caret-blink" />}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      <img src="/images/AirPlaneTicket.jpeg" alt="Ticket" className={cn("absolute left-[3%] top-[22%] z-20 w-[84%] h-auto rounded-2xl shadow-lg pointer-events-none select-none transition-all duration-700", step >= 2 ? "opacity-100 scale-100" : "opacity-0 scale-95")} loading="lazy" />
      <div className={cn("absolute left-[3%] top-[43%] z-30 w-[53%] pointer-events-none select-none transition-all duration-500", step >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>
        <ChatContextMenu />
      </div>
    </IPhoneFrame>
  );
};

const IPhoneSceneFinance: React.FC<{ onTypingComplete?: () => void }> = ({ onTypingComplete }) => {
  const [typed, setTyped] = React.useState("");
  
  React.useEffect(() => {
    let cancelled = false;
    let timeoutId: number;
    const sleep = (ms: number) => new Promise<void>(r => { timeoutId = window.setTimeout(r, ms); });
    
    const run = async () => {
      await sleep(500);
      if (cancelled) return;
      
      const TEXT = tr("Пришлите отчётность к концу квартала", "Send the reports by the end of the quarter");
      for (let i = 1; i <= TEXT.length; i++) {
        await sleep(35);
        if (cancelled) return;
        setTyped(TEXT.slice(0, i));
      }
      await sleep(400);
      if (cancelled) return;
      if (onTypingComplete) onTypingComplete();
    };
    
    run();
    return () => { cancelled = true; clearTimeout(timeoutId); };
  }, [onTypingComplete]);

  return (
    <IPhoneFrame>
      <div className="absolute inset-0 flex flex-col bg-white dark:bg-gray-950">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white text-sm font-semibold shrink-0">SN</div>
          <div className="min-w-0 flex-1">
            <p className="text-[20px] font-medium text-gray-900 dark:text-white truncate">Sergey Nenashev</p>
            <p className="text-[16px] text-emerald-500">online</p>
          </div>
        </div>
        <div className="flex-1 p-4 space-y-4 overflow-hidden">
          <div className="flex justify-center">
            <div className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 ring-1 ring-blue-100 dark:ring-blue-900/60 text-blue-700 dark:text-blue-300 text-[15px] font-medium flex items-center gap-1.5">
              <Sparkles size={13} aria-hidden="true" />
              {tr("В этом диалоге сидит Deyla", "Deyla is in this chat")}
            </div>
          </div>
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-gray-100 dark:bg-gray-800 px-3 py-2">
              <p className="text-[20px] text-gray-800 dark:text-gray-200">
                {typed}
                {typed.length < tr("Пришлите отчётность к концу квартала", "Send the reports by the end of the quarter").length && <span className="inline-block w-[2px] h-[1em] ml-[1px] align-middle bg-current caret-blink" />}
              </p>
            </div>
          </div>
        </div>
      </div>
    </IPhoneFrame>
  );
};

/* ═══════════════════════════════════════════════════════════
   Deyla Chat Card (for generic use)
   ═══════════════════════════════════════════════════════════ */

const DeylaChatCard: React.FC<{ deylaMessage: React.ReactNode; forwardedFrom?: string; userMessage?: string }> = ({ forwardedFrom, userMessage, deylaMessage }) => (
  <div>
    <div className="relative p-4 space-y-4">
      {(forwardedFrom || userMessage) && (
        <div className="flex justify-end">
          <div className="max-w-[82%] rounded-2xl rounded-br-sm bg-gradient-to-br from-blue-500/90 to-blue-600/90 backdrop-blur-md max-md:backdrop-blur-none text-white px-4 py-2.5 ring-1 ring-white/25 shadow-[0_4px_16px_rgba(59,130,246,0.35),inset_0_1px_0_rgba(255,255,255,0.35)]">
            {forwardedFrom && <p className="text-[10px] uppercase tracking-wide opacity-75 mb-1">{forwardedFrom}</p>}
            {userMessage && <p className="text-sm leading-snug">{userMessage}</p>}
          </div>
        </div>
      )}
      <div className="flex items-end gap-2">
        <img src="/images/MaskotGirl.webp" alt="Deyla" className="w-7 h-7 rounded-full object-cover shrink-0 shadow-md ring-1 ring-white/40" />
        <div className="max-w-[86%] min-w-0">
          <div className="rounded-2xl rounded-bl-sm px-4 py-3 bg-white/55 dark:bg-white/[0.06] max-md:bg-white/95 dark:max-md:bg-gray-800/95 backdrop-blur-md max-md:backdrop-blur-none ring-1 ring-white/50 dark:ring-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_2px_8px_rgba(15,23,42,0.05)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_2px_8px_rgba(0,0,0,0.25)]">
            <div className="text-sm text-gray-900 dark:text-white leading-snug">{deylaMessage}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   Page Backdrop & Keyframes
   ═══════════════════════════════════════════════════════════ */

const PageBackdrop: React.FC = () => (
  <>
    <style>{`
      @keyframes page-blob-drift { 0%,100% { transform: translate3d(0,0,0) rotate(0deg) scale(1);} 50% { transform: translate3d(2%,-2%,0) rotate(10deg) scale(1.09);} }
      @keyframes page-pulse { 0%,100% { transform: scale(0.6); opacity: 0;} 50% { transform: scale(1.5); opacity: 1;} }
      @keyframes caret-blink { 0%,49% { opacity:1;} 50%,100% { opacity:0;} }
      .caret-blink { animation: caret-blink 1s steps(1) infinite; }
      @media (prefers-reduced-motion: reduce) {
        .page-blob, .page-pulse, .caret-blink { animation: none; }
      }
    `}</style>
    <div aria-hidden="true" className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      <div className="absolute inset-0 opacity-[0.035] dark:opacity-[0.06]" style={{ backgroundImage: "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)", backgroundSize: "48px 48px", color: "#000" }} />
    </div>
  </>
);

/* ═══════════════════════════════════════════════════════════
   Carousel Logic
   ═══════════════════════════════════════════════════════════ */

const SLIDE_DESIGN_WIDTH = 1280;
const SLIDE_MOBILE_BREAKPOINT = 768;
const SLIDE_MOBILE_DESIGN_WIDTH = 420;

const SLIDE_PAD = (mobile: boolean) => (mobile ? "pt-4 pb-20" : "py-16");
const SLIDE_INNER = (mobile: boolean) => (mobile ? "px-4" : "px-6");

const ScaledSlide: React.FC<{ children: React.ReactNode; scale: number; designWidth: number; onMeasured?: (h: number) => void }> = ({ children, scale, designWidth, onMeasured }) => {
  const innerRef = React.useRef<HTMLDivElement>(null);
  React.useLayoutEffect(() => {
    const inner = innerRef.current; if (!inner) return;
    const update = () => onMeasured?.(inner.offsetHeight);
    update();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(update); ro.observe(inner); return () => ro.disconnect();
  }, [onMeasured]);
  return (
    <div className="w-full h-full overflow-hidden flex items-center justify-center">
      <div ref={innerRef} style={{ width: designWidth, flexShrink: 0, transform: `scale(${scale})`, transformOrigin: "center center" }}>{children}</div>
    </div>
  );
};

const SlideCaption: React.FC<{ eyebrow?: string; title: string; bullets?: string[]; description?: string; onStart: () => void; className?: string }> = ({ eyebrow, title, bullets = [], description, onStart, className }) => (
  <div className={className}>
    {eyebrow && <Badge className="text-eyebrow mb-3">{eyebrow}</Badge>}
    <h2 className="text-2xl md:text-4xl font-semibold tracking-tight text-gray-900 dark:text-white leading-[1.15] mb-4">{title}</h2>
    {bullets.length > 0 && (
      <ul className="space-y-2 mb-6">
        {bullets.map((b, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm md:text-base text-gray-600 dark:text-gray-300">
            <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
            <span>{b}</span>
          </li>
        ))}
      </ul>
    )}
    {description && <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mb-6 max-w-md">{description}</p>}
    
    <LiquidButton onClick={onStart} className="mt-2">
      {tr("Начать бесплатно", "Start for free")}
      <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
    </LiquidButton>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   Slides
   ═══════════════════════════════════════════════════════════ */

const SlideFlight: React.FC<{ mobile: boolean; onStart: () => void }> = ({ mobile, onStart }) => {
  const [step, setStep] = React.useState(0);
  return (
    <div className={SLIDE_PAD(mobile)}>
      <div className={cn("max-w-6xl mx-auto", SLIDE_INNER(mobile))}>
        <div className={mobile ? "flex flex-col gap-6" : "grid grid-cols-2 gap-16 items-center"}>
          <SlideCaption eyebrow={tr("Парсинг документов", "Reads your documents")} title={tr("Пересылайте события — Deyla всё разберёт", "Forward events — Deyla sorts them out")} bullets={[tr("распознаёт авиабилеты, брони, приглашения", "recognises tickets, bookings, invitations"), tr("ставит в календарь с датой и временем", "adds them to your calendar with date and time"), tr("напомнит заранее о важном", "reminds you ahead of time")]} onStart={onStart} />
          <div className="flex flex-col gap-4 items-center">
            <div className={cn("relative w-full", mobile ? "max-w-[300px]" : "max-w-[380px]")}>
              <IPhoneScene onStepChange={setStep} />
            </div>
            <div className={cn("w-full max-w-sm transition-all duration-700", step >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>
              <DeylaChatCard forwardedFrom={tr("Переслано от Папы", "Forwarded from Dad")} userMessage={tr("Авиабилет PD-205 · VKO → LED", "Plane ticket PD-205 · VKO → LED")} deylaMessage={<>{tr("Распознала авиабилет:", "I read the plane ticket:")}{" "}<strong>{tr("дата — 05 апреля, 21:55", "date — 5 April, 21:55")}</strong>,{" "}<strong>{tr("место посадки — Внуково, терминал A", "boarding — Vnukovo, terminal A")}</strong>.</>} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SlideFinance: React.FC<{ mobile: boolean; onStart: () => void }> = ({ mobile, onStart }) => {
  const [showDeyla, setShowDeyla] = React.useState(false);
  return (
    <div className={SLIDE_PAD(mobile)}>
      <div className={cn("max-w-6xl mx-auto", SLIDE_INNER(mobile))}>
        <div className={mobile ? "flex flex-col gap-6" : "grid grid-cols-2 gap-16 items-center"}>
          <SlideCaption 
            eyebrow={tr("Из рабочего чата — в план", "From a work chat to your plan")} 
            title={tr("Deyla работает там же, где и вы", "Deyla works where you do")} 
            bullets={[]} 
            description={tr("Начните проект в Deyla, поделитесь контекстом с рабочей командой в Telegram — и позвольте Deyla довести дело до конца.", "Start a project in Deyla, share the context with your team in Telegram — and let Deyla see it through.")} 
            onStart={onStart} 
          />
          <div className="flex flex-col gap-4 items-center">
            <div className={cn("relative w-full", mobile ? "max-w-[300px]" : "max-w-[380px]")}>
              <IPhoneSceneFinance onTypingComplete={() => setShowDeyla(true)} />
            </div>
            <div className={cn("w-full max-w-sm transition-all duration-700", showDeyla ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>
              <DeylaChatCard deylaMessage={<>{tr("Записала «Отчётность за квартал» на", "Saved “Quarterly reports” for")}{" "}<strong>{tr("27 декабря", "27 December")}</strong>{" "}{tr("и напомню за день.", "and will remind you a day before.")}</>} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const GTDAggregation: React.FC = () => (
  <div className="relative w-full max-w-[320px]">
    <div className="grid grid-cols-2 gap-3 mb-1">
      {[{ id: "jira", name: "Jira", src: "/images/Jira_Software_Logo.svg" }, { id: "telegram", name: "Telegram", src: "/images/TelegramWB.png" }].map(({ id, name, src }) => (
        <div key={id} className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/80 dark:bg-gray-900/60 backdrop-blur-sm ring-1 ring-gray-200/80 dark:ring-gray-700/60 shadow-sm">
          <div className="w-14 h-14 rounded-xl bg-white dark:bg-gray-800 ring-1 ring-gray-200/70 dark:ring-gray-700/60 flex items-center justify-center"><img src={src} alt={name} className="w-9 h-9 object-contain select-none pointer-events-none" loading="lazy" draggable={false} /></div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">{name}</p>
        </div>
      ))}
    </div>
    <div className="text-slate-300 dark:text-slate-700">
      <svg viewBox="0 0 400 56" className="w-full h-12" aria-hidden="true" fill="none">
        <defs><linearGradient id="gtd-line-down" x1="0" y1="0" x2="0" y2="1"><stop offset="100%" stopColor="currentColor" stopOpacity="0.85" /></linearGradient><radialGradient id="gtd-node" cx="35%" cy="30%" r="65%"><stop offset="55%" stopColor="currentColor" stopOpacity="0.55" /></radialGradient></defs>
        <g stroke="url(#gtd-line-down)" strokeWidth="1.25" strokeLinecap="round"><path d="M100 4 Q100 32 200 46" /><path d="M300 4 Q300 32 200 46" /></g>
        <circle cx="100" cy="4" r="3" fill="url(#gtd-node)" /><circle cx="300" cy="4" r="3" fill="url(#gtd-node)" /><circle cx="200" cy="46" r="4" fill="url(#gtd-node)" />
      </svg>
    </div>
    <div className="flex justify-center">
      <div className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-white dark:bg-gray-900 ring-1 ring-gray-200 dark:ring-gray-700 shadow-md">
        <div className="w-9 h-9 rounded-full bg-slate-800 dark:bg-slate-700 flex items-center justify-center text-white shadow-sm shrink-0"><Sparkles size={15} aria-hidden="true" /></div>
        <p className="text-sm font-semibold text-gray-900 dark:text-white">Deyla</p>
      </div>
    </div>
    <div className="flex justify-center text-slate-300 dark:text-slate-700">
      <svg viewBox="0 0 40 40" className="w-10 h-10" aria-hidden="true" fill="none">
        <defs><linearGradient id="gtd-line-bottom" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="currentColor" stopOpacity="0.85" /></linearGradient><radialGradient id="gtd-node-bottom" cx="35%" cy="30%" r="65%"><stop offset="55%" stopColor="currentColor" stopOpacity="0.55" /></radialGradient></defs>
        <path d="M20 6 L20 32" stroke="url(#gtd-line-bottom)" strokeWidth="1.25" strokeLinecap="round" /><circle cx="20" cy="6" r="4" fill="url(#gtd-node-bottom)" />
      </svg>
    </div>
    <div className="flex justify-center -mt-7">
      <div className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-white dark:bg-gray-900 ring-1 ring-gray-200 dark:ring-gray-700 shadow-md">
        <img src="/images/google-calendar.png" alt="Google Calendar" className="w-7 h-7 object-contain select-none pointer-events-none shrink-0" loading="lazy" draggable={false} />
        <p className="text-sm font-semibold text-gray-900 dark:text-white">Google Calendar</p>
      </div>
    </div>
  </div>
);

const SlideGTD: React.FC<{ mobile: boolean; onStart: () => void }> = ({ mobile, onStart }) => (
  <div className={SLIDE_PAD(mobile)}>
    <div className={cn("max-w-6xl mx-auto", SLIDE_INNER(mobile))}>
      <div className={mobile ? "flex flex-col gap-8" : "grid grid-cols-2 gap-16 items-center"}>
        <SlideCaption eyebrow={tr("Систематизация и дисциплина", "Structure and discipline")} title={tr("Спросите о своём дне простыми словами", "Ask about your day in plain words")} bullets={[tr("ставит и переносит задачи", "creates and moves tasks"), tr("разбивает большую задачу на подзадачи", "breaks big tasks into subtasks"), tr("разбирает неделю: что сделано, что горит", "reviews the week: done vs urgent"), tr("находит свободное время между встречами", "finds free time between meetings")]} onStart={onStart} />
        <div className={cn("relative flex justify-center", mobile && "mx-auto w-full max-w-[280px]")}><GTDAggregation /></div>
      </div>
    </div>
  </div>
);

const SlideFriends: React.FC<{ mobile: boolean; onStart: () => void }> = ({ mobile, onStart }) => (
  <div className={SLIDE_PAD(mobile)}>
    <div className={cn("max-w-6xl mx-auto", SLIDE_INNER(mobile))}>
      <div className={mobile ? "flex flex-col gap-8" : "grid grid-cols-2 gap-16 items-center"}>
        <SlideCaption eyebrow={tr("Совместные планы", "Plans together")} title={tr("Планы рядом с планами друзей", "Plans next to your friends' plans")} bullets={[tr("добавляйте задачи и встречи в общий календарь", "add tasks and meetings to a shared calendar"), tr("видно, кто и когда свободен", "see who is free and when"), tr("не нужно переспрашивать в чате", "no need to ask again in the chat")]} onStart={onStart} />
        <div className={cn("relative flex justify-center", mobile && "mx-auto w-full")}>
          <Card className="p-5 shadow-lg max-w-md w-full">
            <div className="flex items-center gap-2 mb-4"><Sparkles size={16} className="text-blue-500" /><span className="font-medium text-gray-900 dark:text-white">{tr("Когда все свободны", "When everyone is free")}</span></div>
            <ul className="space-y-3">
              {[{ name: "Аня", initial: "А", free: tr("свободна в 18:00", "free at 18:00") }, { name: "Максим", initial: "М", free: tr("свободен в 19:30", "free at 19:30") }, { name: "Катя", initial: "К", free: tr("свободна весь вечер", "free all evening") }].map((f) => (
                <li key={f.name} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-white flex items-center justify-center text-sm font-semibold shrink-0">{f.initial}</div>
                  <div className="flex-1 min-w-0"><p className="text-sm font-medium text-gray-900 dark:text-white">{f.name}</p><p className="text-xs text-gray-500 dark:text-gray-400">{f.free}</p></div>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </li>
              ))}
            </ul>
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800"><p className="text-sm text-blue-600 dark:text-blue-400 font-medium">{tr("Все свободны: чт, 19:30", "All free: Thu, 19:30")}</p></div>
          </Card>
        </div>
      </div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   Screenshots Slide
   ═══════════════════════════════════════════════════════════ */

const SCREENSHOTS = [
  { id: "today", lightImage: "/images/functional/whitetheme/today.png", darkImage: "/images/functional/darktheme/today.png", title: tr("Все задачи и аналитика в одном месте.", "All your tasks and insights in one place."), bullets: [tr("задачи, встречи, привычки", "tasks, meetings, habits"), tr("прогресс и статистика", "progress and stats")] },
  { id: "assistant", lightImage: "/images/functional/whitetheme/assistant.png", darkImage: "/images/functional/darktheme/assistant.png", title: tr("Deyla понимает ваши предпочтения и ход мыслей.", "Deyla understands your preferences and the way you think."), bullets: [tr("подстраивается под ваш ритм", "adapts to your rhythm"), tr("предлагает следующий шаг", "suggests the next step")] },
  { id: "commandprojects", lightImage: "/images/functional/whitetheme/commandprojects.png", darkImage: "/images/functional/darktheme/commandprojects.png", title: tr("Создавайте команды.", "Create teams."), bullets: [tr("общие проекты и цели", "shared projects and goals"), tr("прозрачный прогресс", "transparent progress")] },
  { id: "comandassistant", lightImage: "/images/functional/whitetheme/comandassistant.png", darkImage: "/images/functional/darktheme/comandassistant.png", title: tr("Оставьте операционку на Deyla.", "Let Deyla handle the operations."), bullets: [tr("рутину берёт на себя", "takes the routine"), tr("вы — только суть", "you — only the essence")] },
  { id: "doingforme", lightImage: "/images/functional/whitetheme/doingforme.png", darkImage: "/images/functional/darktheme/doingforme.png", title: tr("Делегируйте задачи Deyla.", "Delegate tasks to Deyla."), bullets: [tr("пишет письма и заполняет таблицы", "writes emails and fills spreadsheets"), tr("ищет и сохраняет данные", "searches and saves data")] },
  { id: "friends", lightImage: "/images/functional/whitetheme/friends.png", darkImage: "/images/functional/darktheme/friends.png", title: tr("Стройте совместные планы с друзьями.", "Make plans together with friends."), bullets: [tr("общий календарь", "shared calendar"), tr("видно, кто свободен", "see who is free")] },
  { id: "gamification", lightImage: "/images/functional/whitetheme/gamification.png", darkImage: "/images/functional/darktheme/gamification.png", title: tr("Геймифицируйте свой прогресс", "True gamification"), bullets: [tr("серии и достижения", "streaks and achievements"), tr("мотивация каждый день", "daily motivation")] },
];

const useIsDarkTheme = () => {
  const [isDark, setIsDark] = React.useState<boolean>(() => typeof window === "undefined" ? false : document.documentElement.classList.contains("dark"));
  React.useLayoutEffect(() => {
    const update = () => setIsDark(document.documentElement.classList.contains("dark"));
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return isDark;
};

const SlideScreenshot: React.FC<{ mobile: boolean; item: typeof SCREENSHOTS[0]; onStart: () => void }> = ({ mobile, item, onStart }) => {
  const isDark = useIsDarkTheme();
  const imgSrc = isDark ? item.darkImage : item.lightImage;
  const isGamification = item.id === "gamification";
  
  return (
    <div className={SLIDE_PAD(mobile)}>
      <div className={cn("max-w-6xl mx-auto", SLIDE_INNER(mobile))}>
        <div className={mobile ? "flex flex-col gap-6" : "grid grid-cols-2 gap-16 items-center"}>
          <SlideCaption title={item.title} bullets={item.bullets} onStart={onStart} />
          <div className="relative flex justify-center">
            <div className="relative inline-block isolate w-full max-w-xl">
              <img 
                src={imgSrc} 
                alt={item.title} 
                className={cn("block w-full h-auto", !isGamification && "rounded-2xl shadow-2xl")} 
                style={{ 
                  maxHeight: "70vh", 
                  objectFit: "contain",
                  filter: isGamification ? "drop-shadow(0 20px 40px rgba(0,0,0,0.25))" : undefined
                }} 
                loading="lazy" 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   User Case Carousel
   ═══════════════════════════════════════════════════════════ */

type Slide = { id: string; render: (mobile: boolean, active: boolean, onStart?: () => void) => React.ReactNode };

const USE_CASE_SLIDES: Slide[] = [
  { id: "flight", render: (m, a, s) => <SlideFlight mobile={m} onStart={s!} /> },
  { id: "finance", render: (m, a, s) => <SlideFinance mobile={m} onStart={s!} /> },
  { id: "gtd", render: (m, a, s) => <SlideGTD mobile={m} onStart={s!} /> },
  { id: "friends-plans", render: (m, a, s) => <SlideFriends mobile={m} onStart={s!} /> },
  ...SCREENSHOTS.map<Slide>((item) => ({ id: `shot-${item.id}`, render: (m, a, s) => <SlideScreenshot mobile={m} item={item} onStart={s!} /> })),
];

const MobileSlide: React.FC<{ children: (active: boolean) => React.ReactNode }> = ({ children }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const [inView, setInView] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current; if (!el) return;
    if (typeof IntersectionObserver === "undefined") { setInView(true); return; }
    const obs = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting && entry.intersectionRatio > 0.25), { threshold: [0, 0.25, 0.5, 0.75] });
    obs.observe(el); return () => obs.disconnect();
  }, []);
  return <div ref={ref}>{children(inView)}</div>;
};

const UserCaseCarousel: React.FC<{ paused?: boolean; onStart: () => void }> = ({ onStart }) => {
  const containerRef = React.useRef<HTMLElement>(null);
  const trackRef = React.useRef<HTMLDivElement>(null);
  const stageRef = React.useRef<HTMLDivElement>(null);
  const [viewportW, setViewportW] = React.useState(() => typeof window !== "undefined" ? window.innerWidth : 0);
  const [stageH, setStageH] = React.useState(0);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const activeIndexRef = React.useRef(0);
  const total = USE_CASE_SLIDES.length;

  React.useLayoutEffect(() => {
    const update = () => setViewportW(window.innerWidth);
    update(); window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  React.useLayoutEffect(() => {
    const el = stageRef.current; if (!el) return;
    const update = () => setStageH(el.clientHeight);
    update();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(update); ro.observe(el); return () => ro.disconnect();
  }, [viewportW]);

  const measurementsRef = React.useRef<Record<number, number>>({});
  const [measureVersion, setMeasureVersion] = React.useState(0);
  const handleMeasured = React.useCallback((idx: number, h: number) => {
    if (measurementsRef.current[idx] === h) return;
    measurementsRef.current[idx] = h; setMeasureVersion((v) => v + 1);
  }, []);
  const measuredCallbacks = React.useMemo(() => USE_CASE_SLIDES.map((_, i) => (h: number) => handleMeasured(i, h)), [handleMeasured]);

  const mobile = viewportW > 0 && viewportW < SLIDE_MOBILE_BREAKPOINT;
  const designWidth = mobile ? SLIDE_MOBILE_DESIGN_WIDTH : SLIDE_DESIGN_WIDTH;
  const maxDesignHeight = React.useMemo(() => {
    const hs = Object.values(measurementsRef.current);
    return hs.length ? Math.max(...hs) : 0;
  }, [measureVersion]);
  const scale = React.useMemo(() => {
    if (!viewportW || !stageH || !maxDesignHeight) return 1;
    return Math.min(viewportW / designWidth, stageH / maxDesignHeight);
  }, [viewportW, stageH, designWidth, maxDesignHeight]);

  React.useLayoutEffect(() => {
    if (mobile) return;
    const container = containerRef.current, track = trackRef.current;
    if (!container || !track) return;
    let rafId = 0; let lastX = Number.NaN;
    const apply = () => {
      rafId = 0;
      const rect = container.getBoundingClientRect();
      const sh = rect.height - window.innerHeight;
      if (sh <= 0) return;
      const p = Math.max(0, Math.min(1, -rect.top / sh));
      const maxTranslate = (total - 1) * rect.width;
      const x = -p * maxTranslate;
      if (!Number.isFinite(lastX) || Math.abs(x - lastX) > 0.1) { lastX = x; track.style.transform = `translate3d(${x.toFixed(1)}px, 0, 0)`; }
      const idx = Math.round(p * (total - 1));
      if (idx !== activeIndexRef.current) { activeIndexRef.current = idx; setActiveIndex(idx); }
    };
    const schedule = () => { if (!rafId) rafId = requestAnimationFrame(apply); };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    apply();
    return () => { window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule); if (rafId) cancelAnimationFrame(rafId); };
  }, [total, mobile]);

  if (mobile) {
    return (
      <section id="usecases" className="relative" aria-label={tr("Сценарии использования", "Use cases")}>
        {USE_CASE_SLIDES.map((slide) => <MobileSlide key={slide.id}>{(active) => slide.render(true, active, onStart)}</MobileSlide>)}
      </section>
    );
  }

  return (
    <section ref={containerRef} id="usecases" className="relative" style={{ height: `calc(100svh * ${total})` }} aria-roledescription="carousel" aria-label={tr("Сценарии использования", "Use cases")}>
      <div className="sticky top-0 h-[100svh] overflow-hidden flex flex-col pt-20 md:pt-3">
        <div ref={stageRef} className="relative flex-1 w-full overflow-hidden">
          <div ref={trackRef} className="flex h-full will-change-transform" style={{ width: `${total * 100}%` }}>
            {USE_CASE_SLIDES.map((slide, i) => (
              <div key={slide.id} className="h-full shrink-0" style={{ width: `${100 / total}%`, contain: "layout" }}>
                <ScaledSlide scale={scale} designWidth={designWidth} onMeasured={measuredCallbacks[i]}>
                  {slide.render(false, i === activeIndex, onStart)}
                </ScaledSlide>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════
   Desktop Agent Video
   ═══════════════════════════════════════════════════════════ */

const DesktopAgentVideoSection: React.FC = () => {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const timeoutRef = React.useRef<number | null>(null);
  const [showComingSoon, setShowComingSoon] = React.useState(false);
  const FADE = 15;
  const vMask = `linear-gradient(to bottom, transparent 0%, black ${FADE}%, black ${100 - FADE}%, transparent 100%)`;
  const hMask = `linear-gradient(to right, transparent 0%, black ${FADE}%, black ${100 - FADE}%, transparent 100%)`;
  const combinedMask = `${vMask}, ${hMask}`;
  
  const handleEnded = () => {
    setShowComingSoon(true);
    timeoutRef.current = window.setTimeout(() => {
      setShowComingSoon(false);
      const v = videoRef.current;
      if (v) { v.currentTime = 0; v.play().catch(() => {}); }
    }, 3000);
  };
  
  React.useEffect(() => () => { if (timeoutRef.current) window.clearTimeout(timeoutRef.current); }, []);
  
  return (
    <section className="relative py-16 md:py-24 px-4 md:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 md:mb-12 text-center">
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight leading-[1.1] text-gray-900 dark:text-white max-w-3xl mx-auto">
            {tr("Deyla может взять тяжёлую задачу на себя", "Deyla can take a heavy task off your hands")}
          </h2>
        </div>
        <div className="relative overflow-hidden bg-black" style={{ WebkitMaskImage: combinedMask, WebkitMaskComposite: "source-in", maskImage: combinedMask, maskComposite: "intersect" }}>
          <video ref={videoRef} className={cn("block w-full h-auto scale-[1.2] origin-center transition-[filter,opacity] duration-700 ease-out", showComingSoon && "blur-xl opacity-60")} autoPlay muted playsInline preload="auto" poster="/videos/DesktopAgent-poster.jpg" onEnded={handleEnded}>
            <source src="/videos/DesktopAgent.mp4" type="video/mp4" />
            <source src="/videos/DesktopAgent.mov" type="video/quicktime" />
          </video>
          <div aria-hidden={!showComingSoon} className={cn("absolute inset-0 z-10 flex items-center justify-center pointer-events-none transition-opacity duration-700 ease-out", showComingSoon ? "opacity-100" : "opacity-0")}>
            <div className="absolute inset-0 bg-black/30" />
            <div className={cn("relative px-6 py-3 md:px-8 md:py-4 rounded-full backdrop-blur-md bg-white/10 ring-1 ring-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.35)] text-white font-semibold tracking-widest uppercase text-sm md:text-base transition-transform duration-700 ease-out", showComingSoon ? "translate-y-0 scale-100" : "translate-y-1 scale-95")}>Coming soon</div>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════
   FAQ Section
   ═══════════════════════════════════════════════════════════ */

const FAQ_ITEMS = [
  { q: tr("Что такое Deyla", "What is Deyla"), a: <p>{tr("Deyla — бесплатный персональный ИИ-ассистент. Он ставит задачи в календарь, напоминает о встречах и помогает выполнять работу за вас.", "Deyla is a free personal AI assistant. It puts tasks in your calendar, reminds you about meetings, and helps you get work done.")}</p> },
  { q: tr("Нужно ли устанавливать приложение", "Do I need to install an app"), a: <p>{tr("Нет. Deyla работает прямо в браузере и в Telegram — ничего устанавливать не нужно.", "No. Deyla works directly in your browser and in Telegram — nothing to install.")}</p> },
  { q: tr("Сколько это стоит", "How much does it cost"), a: <p>{tr("Базовые функции Deyla бесплатны. Расширенные возможности доступны по подписке.", "Core Deyla features are free. Advanced capabilities are available via subscription.")}</p> },
  { q: tr("Работает ли Deyla в Telegram", "Does Deyla work in Telegram"), a: <p>{tr("Да. Добавьте Deyla в Telegram — и работайте с задачами прямо в чате.", "Yes. Add Deyla to Telegram and manage tasks right in the chat.")}</p> },
  { q: tr("Можно ли подключить Google Calendar", "Can I connect Google Calendar"), a: <p>{tr("Да. Deyla синхронизируется с Google Calendar, Apple Calendar, Yandex Calendar и другими.", "Yes. Deyla syncs with Google Calendar, Apple Calendar, Yandex Calendar and others.")}</p> },
  { 
    q: tr("Как Deyla обращается с моими данными", "How does Deyla handle my data"), 
    a: (
      <div className="space-y-4">
        <p>{tr("Deyla хранит данные в зашифрованном виде и не передаёт их третьим лицам. Вы можете удалить свои данные в любой момент.", "Deyla stores your data encrypted and never shares it with third parties. You can delete your data at any time.")}</p>
        <div className="relative flex justify-center mt-4">
          <div className="relative inline-block isolate w-full max-w-sm">
            <img src="/images/functional/whitetheme/safety.png" alt="Security" className="block w-full h-auto rounded-2xl" />
          </div>
        </div>
      </div>
    )
  },
];

const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = React.useState<number | null>(0);
  return (
    <section id="faq" className="relative py-16 md:py-24 px-4 md:px-6">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-center text-gray-900 dark:text-white mb-10 md:mb-14">{tr("Всё, что вы хотели спросить", "Everything you wanted to ask")}</h2>
        <div className="space-y-3">
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={i} className="border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden bg-white/60 dark:bg-gray-900/40 backdrop-blur-sm">
                <button type="button" onClick={() => setOpenIndex(isOpen ? null : i)} aria-expanded={isOpen} className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                  <span className="font-medium text-gray-900 dark:text-white">{item.q}</span>
                  <ChevronDown size={18} className={cn("shrink-0 text-gray-500 transition-transform duration-300", isOpen && "rotate-180")} aria-hidden="true" />
                </button>
                <div className={cn("grid transition-[grid-template-rows] duration-300 ease-out", isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                  <div className="overflow-hidden">
                    <div className="px-5 pb-5 text-sm md:text-base text-gray-600 dark:text-gray-400 leading-relaxed">{item.a}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════
   Final CTA
   ═══════════════════════════════════════════════════════════ */

const INTEGRATIONS = [
  { src: "/images/google-calendar.png", alt: "Google Calendar" },
  { src: "/images/yandexcalendar.png", alt: "Yandex Calendar" },
  { src: "/images/apple-calendar.webp", alt: "Apple Calendar" },
  { src: "/images/samsung-calendar.webp", alt: "Samsung Calendar" },
  { src: "/images/Jira_Software_Logo.svg", alt: "Jira" },
  { src: "/images/Notion.webp", alt: "Notion" },
  { src: "/images/TelegramWB.webp", alt: "Telegram" },
];

const FINAL_CTA_OVERLAP_TOP_VH = -5;
const FINAL_CTA_EXTRA_BOTTOM_VH = 25;
const FINAL_CTA_MOBILE_GAP_VH = 20;
const FINAL_CTA_GRADIENT_ALPHA = 0.5;
const FINAL_CTA_HORIZONTAL_GRADIENT_VW = 8;
const FINAL_CTA_MASK_VERTICAL = `linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,${FINAL_CTA_GRADIENT_ALPHA}) 15%, rgba(0,0,0,${FINAL_CTA_GRADIENT_ALPHA}) 85%, rgba(0,0,0,0) 100%)`;
const FINAL_CTA_MASK_HORIZONTAL = `linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,${FINAL_CTA_GRADIENT_ALPHA}) ${FINAL_CTA_HORIZONTAL_GRADIENT_VW}vw, rgba(0,0,0,${FINAL_CTA_GRADIENT_ALPHA}) calc(100% - ${FINAL_CTA_HORIZONTAL_GRADIENT_VW}vw), rgba(0,0,0,0) 100%)`;
const ORBIT_PERIOD_MS = 24000;
const ORBIT_TRANSITION_MS = 700;
const PHONE_MAX_W = 640;
const isPhoneWidth = () => window.innerWidth <= PHONE_MAX_W;
const rowIconSize = () => (isPhoneWidth() ? 40 : 56);
const rowGap = () => (isPhoneWidth() ? 8 : 12);
const rowYOffset = () => (isPhoneWidth() ? 100 : 140);
const orbitRadiusScale = () => (isPhoneWidth() ? 0.75 : 1 / 1.2);
const ORBIT_ICON_BASE = 96;
const ORBIT_ICON_IMG_BASE = 58;

const FinalCTA: React.FC<{ onStart: () => void; onActiveChange?: (active: boolean) => void }> = ({ onStart, onActiveChange }) => {
  const sectionRef = React.useRef<HTMLElement>(null);
  const [active, setActive] = React.useState(false);
  const lastActive = React.useRef(false);
  const iconRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  const [isNarrow, setIsNarrow] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const update = () => setIsNarrow(mq.matches);
    update(); mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  React.useEffect(() => {
    const el = sectionRef.current; if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const visibleTop = Math.max(0, rect.top);
      const visibleBottom = Math.min(vh, rect.bottom);
      const visible = Math.max(0, visibleBottom - visibleTop);
      const ratio = visible / Math.min(vh, rect.height || vh);
      const next = ratio > 0.5;
      if (next !== lastActive.current) { lastActive.current = next; setActive(next); onActiveChange?.(next); }
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => { window.removeEventListener("scroll", update); window.removeEventListener("resize", update); };
  }, [onActiveChange]);

  React.useEffect(() => {
    const N = INTEGRATIONS.length;
    const icons = iconRefs.current;
    if (!icons.length) return;
    const computeRadius = () => Math.min(window.innerWidth * 0.32, 240) * orbitRadiusScale();
    const orbitValues = (i: number, angle: number) => {
      const R = computeRadius();
      const baseAngle = (i / N) * 360;
      const rad = ((baseAngle + angle) * Math.PI) / 180;
      const x = R * Math.cos(rad) * 1.2;
      const y = R * Math.sin(rad);
      const t = (Math.sin(rad) + 1) / 2;
      const sf = 0.45 + 0.55 * t;
      return { x, y, opacity: 0.1 + 0.9 * t, outerSize: isPhoneWidth() ? 48 + 12 * sf : 80 + 16 * sf };
    };
    const staticValues = (i: number, maxWidth: number) => {
      const size = rowIconSize(); const gap = rowGap();
      const perRow = Math.max(1, Math.floor((maxWidth + gap) / (size + gap)));
      const rowIdx = Math.floor(i / perRow); const colIdx = i % perRow;
      const itemsInRow = Math.min(perRow, N - rowIdx * perRow);
      const rowWidth = itemsInRow * size + (itemsInRow - 1) * gap;
      const startX = -rowWidth / 2 + size / 2;
      return { x: startX + colIdx * (size + gap), y: rowYOffset() + rowIdx * (size + gap), opacity: 1, outerSize: size };
    };
    const writeIcon = (el: HTMLDivElement, v: { x: number; y: number; opacity: number; outerSize: number }) => {
      const scale = v.outerSize / ORBIT_ICON_BASE;
      el.style.transform = `translate(-50%, -50%) translate(${v.x.toFixed(1)}px, ${v.y.toFixed(1)}px) scale(${scale.toFixed(3)})`;
      el.style.opacity = v.opacity.toFixed(3);
    };
    const setTransition = (on: boolean) => {
      const t = on ? `transform ${ORBIT_TRANSITION_MS}ms cubic-bezier(0.4,0,0.2,1), opacity ${ORBIT_TRANSITION_MS}ms ease-out` : "none";
      icons.forEach((el) => { if (el) el.style.transition = t; });
      void (icons[0]?.offsetWidth ?? 0);
    };
    if (active && isPhoneWidth()) {
      const apply = () => {
        const maxWidth = Math.min(window.innerWidth - 32, 600);
        setTransition(true);
        icons.forEach((el, i) => { if (el) writeIcon(el, staticValues(i, maxWidth)); });
      };
      apply(); window.addEventListener("resize", apply);
      return () => window.removeEventListener("resize", apply);
    } else if (active) {
      setTransition(true);
      icons.forEach((el, i) => { if (el) writeIcon(el, orbitValues(i, 0)); });
      let rafId = 0;
      const timeoutId = window.setTimeout(() => {
        setTransition(false);
        const started = performance.now();
        const tick = (now: number) => {
          const angle = (((now - started) / ORBIT_PERIOD_MS) * 360) % 360;
          icons.forEach((el, i) => { if (el) writeIcon(el, orbitValues(i, angle)); });
          rafId = requestAnimationFrame(tick);
        };
        rafId = requestAnimationFrame(tick);
      }, ORBIT_TRANSITION_MS);
      return () => { window.clearTimeout(timeoutId); if (rafId) cancelAnimationFrame(rafId); };
    } else {
      const apply = () => {
        const maxWidth = Math.min(window.innerWidth - (isPhoneWidth() ? 32 : 120), 600);
        setTransition(true);
        icons.forEach((el, i) => { if (el) writeIcon(el, staticValues(i, maxWidth)); });
      };
      apply(); window.addEventListener("resize", apply);
      return () => window.removeEventListener("resize", apply);
    }
  }, [active, isNarrow]);

  const ctaMask = `${FINAL_CTA_MASK_VERTICAL}, ${FINAL_CTA_MASK_HORIZONTAL}`;

  return (
    <section ref={sectionRef} id="integrations" className="relative isolate w-full overflow-x-clip" style={{ marginTop: `-${FINAL_CTA_OVERLAP_TOP_VH}vh`, paddingTop: isNarrow ? `${FINAL_CTA_OVERLAP_TOP_VH + FINAL_CTA_MOBILE_GAP_VH}vh` : `${FINAL_CTA_OVERLAP_TOP_VH}vh`, paddingBottom: `${FINAL_CTA_EXTRA_BOTTOM_VH}vh` }}>
      <div aria-hidden="true" className="absolute inset-0 transition-[clip-path] duration-700 ease-out will-change-[clip-path]" style={{ background: "linear-gradient(135deg, #2563eb 0%, #4f46e5 50%, #7c3aed 100%)", clipPath: isNarrow || active ? "inset(0% 0% 0% 0% round 0px)" : `inset(0% 12% 18% 12% round 32px)`, WebkitMaskImage: ctaMask, maskImage: ctaMask, WebkitMaskComposite: "source-in", maskComposite: "intersect" }} />
      <div className={cn("relative z-10 mx-auto w-full max-w-6xl px-6 md:px-16 text-gray-900 dark:text-white flex flex-col items-center justify-center")} style={{ minHeight: isNarrow ? "10svh" : "80vh" }}>
        <div className="text-center max-w-3xl">
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight leading-[1.1]">
            {tr("Ваш день живёт в\u00a0Google, Notion и\u00a0блокноте.", "Your day lives in\u00a0Google, Notion and\u00a0a notebook.")}{" "}
            <span className="text-gray-900/85 dark:text-white/85">{tr("Deyla задаёт единый ритм.", "Deyla sets one rhythm.")}</span>
          </h2>
        </div>
        <div className="flex flex-col items-center text-center">
          <div className="relative mt-10 flex justify-center">
            <div aria-hidden="true" className="absolute left-1/2 top-1/2 pointer-events-none" style={{ width: 0, height: 0 }}>
              {INTEGRATIONS.map((i, idx) => (
                <div key={i.alt} ref={(el) => { iconRefs.current[idx] = el; }} className="absolute top-0 left-0 will-change-transform" style={{ transform: "translate(-50%, -50%)", opacity: 0 }}>
                  <div className="rounded-2xl bg-white/15 backdrop-blur-md ring-1 ring-white/30 flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_6px_20px_rgba(0,0,0,0.2)]" style={{ width: ORBIT_ICON_BASE, height: ORBIT_ICON_BASE }}>
                    <img src={i.src} alt="" className="object-contain" style={{ width: ORBIT_ICON_IMG_BASE, height: ORBIT_ICON_IMG_BASE }} loading="lazy" />
                  </div>
                </div>
              ))}
            </div>
            <LiquidButton onClick={onStart} className="px-8 md:px-10 h-14 md:h-16 text-lg md:text-xl bg-white/10 dark:bg-white/[0.05] ring-white/30 text-gray-900 dark:text-white">
              {tr("Начать бесплатно", "Start for free")}
              <ArrowRight size={22} className="ml-2 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true" />
            </LiquidButton>
          </div>
        </div>
      </div>
    </section>
  );
};


/* ═══════════════════════════════════════════════════════════
   Social Media Section (Раздел 2)
   ═══════════════════════════════════════════════════════════ */

const SocialMediaSection: React.FC = () => (
  <section className="relative py-16 md:py-24 px-4 md:px-6 max-w-6xl mx-auto">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
      <div>
        <Badge className="mb-3">{tr("Наши соцсети", "Social media")}</Badge>
        <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-gray-900 dark:text-white mb-6">
          {tr("Следите за нами в Telegram", "Follow us on Telegram")}
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
          {tr("Практичные идеи о времени, внимании и привычках — в нашем телеграм-канале.", "Practical ideas about time, attention, and habits — in our Telegram channel.")}
        </p>
        <LiquidButton href="https://t.me/deyla_planner" target="_blank" rel="noreferrer">
          {tr("Зайти в канал", "Join channel")}
          <ArrowRight size={18} />
        </LiquidButton>
      </div>
      <div className="flex justify-center">
        <img 
          src="/images/functional/tgchannel.png" 
          alt={tr("Telegram-канал Deyla", "Deyla Telegram channel")} 
          className="w-full max-w-sm" 
          style={{ filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.25))" }} 
        />
      </div>
    </div>
  </section>
);

/* ═══════════════════════════════════════════════════════════
   Reviews Section
   ═══════════════════════════════════════════════════════════ */

const ReviewsSection: React.FC = () => (
  <section className="relative py-16 md:py-24 px-4 md:px-6 bg-gray-50/50 dark:bg-gray-900/20">
    <div className="max-w-6xl mx-auto">
      <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-center text-gray-900 dark:text-white mb-12">
        {tr("С Deyla планировать проще", "Planning is easier with Deyla")}
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {[
          { name: "Алина К.", role: tr("UX-дизайнер · пример персонажа", "UX designer · persona example"), text: tr("«Раньше в понедельник у меня было ощущение, что дел больше, чем часов в сутках. Теперь хотя бы понятно, с чего начать и что действительно важно».", "“Previously on Monday I had the feeling that there were more tasks than hours in the day. Now at least it's clear where to start and what really matters.”"), initial: "АК", color: "bg-purple-100 text-purple-600" },
          { name: "Михаил С.", role: tr("Предприниматель · пример персонажа", "Entrepreneur · persona example"), text: tr("«Очень нравится идея видеть встречи и задачи вместе. Меньше переключений между календарём и заметками — больше времени на саму работу».", "“I really like the idea of seeing meetings and tasks together. Fewer switches between calendar and notes — more time for the work itself.”"), initial: "МС", color: "bg-teal-100 text-teal-600" },
          { name: "Екатерина П.", role: tr("Продакт-менеджер · пример персонажа", "Product manager · persona example"), text: tr("«Мои планы часто меняются. Возможность не забыть и перекинуть задачи в Telegram — именно то, что я искала».", "“My plans often change. The ability to not forget and move tasks in Telegram is exactly what I was looking for.”"), initial: "ЕП", color: "bg-amber-100 text-amber-600" }
        ].map((review, i) => (
          <Card key={i} className="p-6 bg-white dark:bg-gray-900 border-none shadow-lg">
            <div className="flex text-yellow-400 mb-4">
              {[...Array(5)].map((_, j) => <Star key={j} size={16} fill="currentColor" />)}
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-6 text-sm leading-relaxed">{review.text}</p>
            <div className="flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm", review.color)}>
                {review.initial}
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">{review.name}</p>
                <p className="text-xs text-gray-500">{review.role}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between p-8 rounded-3xl bg-white dark:bg-gray-900 shadow-xl border border-gray-100 dark:border-gray-800 gap-8">
        <div className="md:w-1/3 text-center md:text-left">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{tr("Меньше хаоса.", "Less chaos.")}<br/>{tr("Больше результата.", "More results.")}</h3>
        </div>
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full">
          <div className="text-center md:text-left">
            <p className="text-4xl font-extrabold text-blue-600 dark:text-blue-400 mb-1">–40 мин</p>
            <p className="text-sm text-gray-500">{tr("на планирование в день", "on planning per day")}</p>
            <p className="text-[10px] text-gray-400 mt-1">{tr("в иллюстративном сценарии", "in an illustrative scenario")}</p>
          </div>
          <div className="text-center md:text-left border-t sm:border-t-0 sm:border-l border-gray-200 dark:border-gray-800 pt-4 sm:pt-0 sm:pl-6">
            <p className="text-4xl font-extrabold text-blue-600 dark:text-blue-400 mb-1">84%</p>
            <p className="text-sm text-gray-500">{tr("задач на день выполнено", "daily tasks completed")}</p>
            <p className="text-[10px] text-gray-400 mt-1">{tr("в модельном примере", "in a model example")}</p>
          </div>
          <div className="text-center md:text-left border-t sm:border-t-0 sm:border-l border-gray-200 dark:border-gray-800 pt-4 sm:pt-0 sm:pl-6">
            <p className="text-4xl font-extrabold text-blue-600 dark:text-blue-400 mb-1">9 из 10</p>
            <p className="text-sm text-gray-500">{tr("дней с ясным планом", "days with a clear plan")}</p>
            <p className="text-[10px] text-gray-400 mt-1">{tr("в демонстрационном кейсе", "in a demo case")}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
);

/* ═══════════════════════════════════════════════════════════
   Blogs Section
   ═══════════════════════════════════════════════════════════ */

const BlogsSection: React.FC = () => (
  <section className="relative py-16 md:py-24 px-4 md:px-6 max-w-6xl mx-auto">
    <div className="text-center mb-12">
      <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-gray-900 dark:text-white mb-4">
        {tr("С временем можно подружиться", "You can make friends with time")}
      </h2>
      <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
        {tr("Практичные идеи о времени, внимании и привычках — в нашем блоге и телеграм-канале.", "Practical ideas about time, attention, and habits — in our blog and Telegram channel.")}
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
      <a href="https://deyla.tech/blogs" target="_blank" rel="noreferrer" className="group block">
        <Card className="overflow-hidden border-none shadow-lg bg-white dark:bg-gray-900 group-hover:-translate-y-1 transition-transform duration-300">
          <div className="h-48 bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/images/functional/whitetheme/today.png')] bg-cover bg-center opacity-30 mix-blend-overlay" />
            <div className="z-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md px-4 py-2 rounded-full font-medium text-sm text-purple-600 dark:text-purple-300">
              {tr("Фокус · 5 минут", "Focus · 5 min")}
            </div>
          </div>
          <div className="p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 transition-colors">
              {tr("Как планировать день, если всё меняется", "How to plan your day when everything changes")}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              {tr("Гибкий план, который помогает, а не диктует правила.", "A flexible plan that helps rather than dictates rules.")}
            </p>
            <span className="text-blue-600 dark:text-blue-400 text-sm font-medium inline-flex items-center gap-1">
              {tr("Читать краткий экнос", "Read the summary")} <ArrowRight size={14} />
            </span>
          </div>
        </Card>
      </a>

      <a href="https://deyla.tech/blogs" target="_blank" rel="noreferrer" className="group block">
        <Card className="overflow-hidden border-none shadow-lg bg-white dark:bg-gray-900 group-hover:-translate-y-1 transition-transform duration-300">
          <div className="h-48 bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/images/functional/whitetheme/assistant.png')] bg-cover bg-center opacity-30 mix-blend-overlay" />
            <div className="z-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md px-4 py-2 rounded-full font-medium text-sm text-emerald-600 dark:text-emerald-300">
              {tr("Планирование · 4 минуты", "Planning · 4 min")}
            </div>
          </div>
          <div className="p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 transition-colors">
              {tr("Календарь и список задач: почему им лучше быть рядом", "Calendar and task list: why they are better together")}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              {tr("Разбираемся, где рождается перегруз и как его избежать.", "Understanding where overload is born and how to avoid it.")}
            </p>
            <span className="text-blue-600 dark:text-blue-400 text-sm font-medium inline-flex items-center gap-1">
              {tr("Читать краткий экнос", "Read the summary")} <ArrowRight size={14} />
            </span>
          </div>
        </Card>
      </a>
    </div>

    <div className="flex justify-center">
      <LiquidButton href="https://deyla.tech/blogs" target="_blank" rel="noreferrer">
        {tr("Больше статей в блоге", "More articles in the blog")}
        <ArrowRight size={18} />
      </LiquidButton>
    </div>
  </section>
);

export default Start;