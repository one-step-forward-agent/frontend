import * as React from "react";
import { useNavigate } from "react-router-dom";
import { MascotFade } from "@/components/MascotFade";
import {
  Sparkles, Send, Calendar, BarChart3,
  Mic, Zap, Target, ArrowRight, Check,
  Reply,
  Copy,
  Download,
  Pin,
  Forward,
  Trash2,
  ArrowDown,
  Hash,
  Video,
  ListChecks,
  ChevronLeft,
  ChevronRight,
  Lock,
  type LucideIcon,
} from "lucide-react";

import {
  getPerspectiveMatrix,
  usePerspectiveTransform,
  type Point,
} from "@/utils/perspective";

import { Button, InteractiveButton } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/utils/cn";

import LandingHeader from "@/components/landing/LandingHeader";
import LandingFooter from "@/components/landing/LandingFooter";
import { LOCALE, tr } from "@/i18n";

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

        <FinalCTA onStart={start} onActiveChange={handleFinalCtaActive} />

        <UserCaseCarousel paused={finalCtaActive} />

        {/* НОВОЕ: видео-блок */}
        <DesktopAgentVideoSection />

        <FeatureScreenshotsCarousel />

        <LandingFooter />
      </div>
    </div>
  );
};

/* ─── Liquid Glass — единый стиль ────────────────────────── */
const GLASS_BODY =
  "bg-white/[0.06] dark:bg-white/[0.02] backdrop-blur-xl " +
  "ring-1 ring-white/30 dark:ring-white/10 " +
  "shadow-[0_4px_24px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.7),inset_0_-1px_0_rgba(15,23,42,0.06)] " +
  "dark:shadow-[0_4px_24px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.3)]";

const GLASS_SHEEN_PILL =
  "pointer-events-none absolute inset-0 rounded-full " +
  "bg-[linear-gradient(135deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.02)_25%,transparent_45%,transparent_75%,rgba(147,197,253,0.05)_100%)]";

type MenuItem = {
  label: string;
  icon: LucideIcon;
  tone?: "default" | "danger";
};

const FORWARD_LABEL = tr("Переслать Dayla", "Forward to Dayla");

const CONTEXT_MENU_ITEMS: MenuItem[] = [
  { label: tr("Ответить", "Reply"), icon: Reply },
  { label: FORWARD_LABEL, icon: Forward },
  { label: tr("Удалить", "Delete"), icon: Trash2, tone: "danger" },
];

const ChatContextMenu: React.FC = () => (
  <div
    className="
      relative rounded-2xl overflow-visible
      bg-white/95 dark:bg-gray-900/95 backdrop-blur-md
      ring-1 ring-gray-200/80 dark:ring-gray-700/60
      shadow-2xl
    "
    role="menu"
    aria-label={tr("Действия с сообщением", "Message actions")}
  >
    {CONTEXT_MENU_ITEMS.map(({ label, icon: Icon, tone }, i) => {
      const isDanger = tone === "danger";
      const isHighlighted = label === FORWARD_LABEL;

      return (
        <React.Fragment key={label}>
          {isDanger && i > 0 && (
            <div className="h-px bg-gray-100 dark:bg-gray-800" />
          )}

          <button
            type="button"
            role="menuitem"
            tabIndex={-1}
            className={cn(
                "relative isolate w-full flex items-center gap-2.5",
                "px-3 py-2 text-left text-[15px] font-medium",
                "transition-colors rounded-xl",
                isHighlighted ? "z-10" : "z-0",
                isDanger &&
                "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40",
                !isDanger &&
                !isHighlighted &&
                "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/60"
            )}
            >
            {isHighlighted && (
                <>
                <span
                    aria-hidden="true"
                    className="
                    absolute inset-[-30%] z-0 pointer-events-none
                    blur-xl rounded-full
                    "
                    style={{
                    background:
                        "radial-gradient(circle at center, rgba(59,130,246,0.75) 0%, rgba(99,102,241,0.45) 40%, rgba(139,92,246,0.2) 65%, transparent 90%)",
                    }}
                />

                <span
                    aria-hidden="true"
                    className="
                    absolute inset-0 z-10 pointer-events-none
                    rounded-xl
                    bg-white dark:bg-gray-900
                    shadow-md
                    "
                />
                </>
            )}

            <Icon
                size={13}
                className={cn(
                "shrink-0 relative z-20",
                isDanger && "text-red-500 dark:text-red-400",
                !isDanger && !isHighlighted && "text-gray-400 dark:text-gray-500"
                )}
                aria-hidden="true"
            />

            <span className="relative z-20 flex-1 truncate">{label}</span>
            </button>
        </React.Fragment>
      );
    })}
  </div>
);

const GTD_SOURCES = [
  { id: "jira",     name: "Jira",     src: "/images/Jira_Software_Logo.svg", count: 6 },
  { id: "telegram",    name: "Telegram",    src: "/images/TelegramWB.png",            count: 3 },
];

const GTDAggregation: React.FC = () => (
  <div className="relative w-full max-w-[320px]">
    <div
      aria-hidden="true"
      className="absolute inset-[-10%] -z-10 rounded-full bg-slate-400/10 blur-3xl"
    />

    <div className="grid grid-cols-2 gap-3 mb-1">
      {GTD_SOURCES.map(({ id, name, src, count }) => (
        <div
          key={id}
          className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/80 dark:bg-gray-900/60 backdrop-blur-sm ring-1 ring-gray-200/80 dark:ring-gray-700/60 shadow-sm"
        >
          <div className="w-14 h-14 rounded-xl bg-white dark:bg-gray-800 ring-1 ring-gray-200/70 dark:ring-gray-700/60 flex items-center justify-center">
            <img
              src={src}
              alt={name}
              className="w-9 h-9 object-contain select-none pointer-events-none"
              loading="lazy"
              draggable={false}
            />
          </div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">{name}</p>
        </div>
      ))}
    </div>

    <div className="text-slate-300 dark:text-slate-700">
      <svg
        viewBox="0 0 400 56"
        className="w-full h-12"
        aria-hidden="true"
        fill="none"
      >
        <defs>
          <linearGradient id="gtd-line-down" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="currentColor" stopOpacity="0" />
            <stop offset="35%"  stopColor="currentColor" stopOpacity="0.4" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.85" />
          </linearGradient>

          <radialGradient id="gtd-node" cx="35%" cy="30%" r="65%">
            <stop offset="0%"   stopColor="#ffffff"       stopOpacity="0.95" />
            <stop offset="55%"  stopColor="currentColor"  stopOpacity="0.55" />
            <stop offset="100%" stopColor="currentColor"  stopOpacity="0.3" />
          </radialGradient>

          <filter id="gtd-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" />
          </filter>
        </defs>

        {/* мягкое свечение под линиями */}
        <g
          filter="url(#gtd-glow)"
          opacity="0.35"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M100 4 Q100 32 200 46" />
          <path d="M300 4 Q300 32 200 46" />
        </g>

        {/* сами линии */}
        <g
          stroke="url(#gtd-line-down)"
          strokeWidth="1.25"
          strokeLinecap="round"
        >
          <path d="M100 4 Q100 32 200 46" />
          <path d="M300 4 Q300 32 200 46" />
        </g>

        <circle cx="100" cy="4"  r="3" fill="url(#gtd-node)" />
        <circle cx="300" cy="4"  r="3" fill="url(#gtd-node)" />
        <circle cx="200" cy="46" r="4" fill="url(#gtd-node)" />
      </svg>
    </div>

    <div className="flex justify-center">
      <div className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-white dark:bg-gray-900 ring-1 ring-gray-200 dark:ring-gray-700 shadow-md">
        <div className="w-9 h-9 rounded-full bg-slate-800 dark:bg-slate-700 flex items-center justify-center text-white shadow-sm shrink-0">
          <Sparkles size={15} aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            Dayla
          </p>
        </div>
      </div>
    </div>

    <div className="flex justify-center text-slate-300 dark:text-slate-700">
      <svg
        viewBox="0 0 40 40"
        className="w-10 h-10"
        aria-hidden="true"
        fill="none"
      >
        <defs>
          <linearGradient id="gtd-line-bottom" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="currentColor" stopOpacity="0.85" />
            <stop offset="60%"  stopColor="currentColor" stopOpacity="0.25" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="gtd-node-bottom" cx="35%" cy="30%" r="65%">
            <stop offset="0%"   stopColor="#ffffff"       stopOpacity="0.95" />
            <stop offset="55%"  stopColor="currentColor"  stopOpacity="0.55" />
            <stop offset="100%" stopColor="currentColor"  stopOpacity="0.3" />
          </radialGradient>
        </defs>

        <path
          d="M20 6 L20 32"
          stroke="url(#gtd-line-bottom)"
          strokeWidth="1.25"
          strokeLinecap="round"
        />
        <circle cx="20" cy="6" r="4" fill="url(#gtd-node-bottom)" />
      </svg>
    </div>

    <div className="flex justify-center -mt-7">
      <div className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-white dark:bg-gray-900 ring-1 ring-gray-200 dark:ring-gray-700 shadow-md">
        <img
          src="/images/google-calendar.png"
          alt="Google Calendar"
          className="w-7 h-7 object-contain select-none pointer-events-none shrink-0"
          loading="lazy"
          draggable={false}
        />
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            Google Calendar
          </p>
        </div>
      </div>
    </div>
  </div>
);

const SourceBadge: React.FC<{ kind: "jira" | "trueconf" | "slack" }> = ({ kind }) => {
  const cfg = {
    jira:     { label: "Jira",     tint: "jira" as const },
    trueconf: { label: "TrueConf", tint: "trueconf" as const },
    slack:    { label: "Slack",    tint: "slack" as const },
  }[kind];

  return (
    <span
      className={cn(
        "shrink-0 inline-flex items-center gap-1.5",
        "text-[10px] px-1.5 py-0.5 rounded",
        "bg-gray-100/80 dark:bg-gray-800/80",
        "backdrop-blur-sm",
        "ring-1 ring-white/40 dark:ring-white/5",
        "text-gray-700 dark:text-gray-300 font-medium",
      )}
    >
      <GlassDot tint={cfg.tint} size={6} />
      {cfg.label}
    </span>
  );
};

type GlassTint = "red" | "amber" | "slate" | "blue" | "jira" | "trueconf" | "slack";

const GLASS_TINTS: Record<GlassTint, string> = {
  red:      "from-red-300/80       to-red-500/60       shadow-red-400/30",
  amber:    "from-amber-300/80     to-amber-500/60     shadow-amber-400/30",
  slate:    "from-slate-300/80     to-slate-500/60     shadow-slate-400/30",
  blue:     "from-blue-300/80      to-blue-500/60      shadow-blue-400/30",
  jira:     "from-blue-300/80      to-indigo-500/60    shadow-indigo-400/30",
  trueconf: "from-emerald-300/80   to-teal-500/60      shadow-teal-400/30",
  slack:    "from-fuchsia-300/80   to-purple-500/60    shadow-purple-400/30",
};

const GlassDot: React.FC<{ tint: GlassTint; size?: number }> = ({
  tint,
  size = 8,
}) => (
  <span
    aria-hidden="true"
    className={cn(
      "relative inline-block rounded-full shrink-0",
      "bg-gradient-to-br",
      GLASS_TINTS[tint],
      "ring-1 ring-white/60 dark:ring-white/15",
      "backdrop-blur-[2px]",
      "shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_1px_2px_rgba(15,23,42,0.06)]",
      "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_1px_2px_rgba(0,0,0,0.4)]",
    )}
    style={{ width: size, height: size }}
  >
    <span
      className="absolute rounded-full bg-white/80 blur-[0.5px]"
      style={{
        top: "15%",
        left: "15%",
        width: "35%",
        height: "35%",
      }}
    />
  </span>
);

const GlassPill: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span
    className={cn(
      "relative inline-flex items-center gap-1.5",
      "px-2.5 py-1 rounded-full",
      "bg-white/35 dark:bg-white/[0.04]",
      "backdrop-blur-md",
      "ring-1 ring-white/50 dark:ring-white/10",
      "shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_1px_2px_rgba(15,23,42,0.05)]",
      "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_1px_2px_rgba(0,0,0,0.35)]",
      "text-[11px] uppercase tracking-widest font-medium",
      "text-gray-600 dark:text-gray-300",
    )}
  >
    {children}
  </span>
);

const SectionLabel: React.FC<{ tint: GlassTint; children: React.ReactNode }> = ({
  tint,
  children,
}) => (
  <div className="mb-2">
    <GlassPill>
      <GlassDot tint={tint} size={7} />
      {children}
    </GlassPill>
  </div>
);

const GTD_RESPONSE = (
  <div className="space-y-3">

      <div className="space-y-2 text-[12px] leading-snug mt-1">
        <div>
          <p className="font-semibold text-gray-900 dark:text-white">{tr("Чт, 03.10", "Thu, 03.10")}</p>
          <p className="text-gray-600 dark:text-gray-300">
            {tr("09:00–10:30 — Ревью PR #482 · 11:00–12:00", "09:00–10:30 — Review PR #482")}
          </p>
        </div>
        <div>
          <p className="font-semibold text-gray-900 dark:text-white">{tr("Пт, 04.10", "Fri, 04.10")}</p>
          <p className="text-gray-600 dark:text-gray-300">
            {tr("09:00–10:00 — Ответить клиенту · 10:00–12:00", "09:00–10:00 — Reply to the client")}
          </p>
        </div>
        <div>
          <p className="font-semibold text-gray-900 dark:text-white">{tr("Пн, 07.10", "Mon, 07.10")}</p>
          <p className="text-gray-600 dark:text-gray-300">
            {tr("10:00–11:00 — Разбор входящих · 14:00–15:00 — Подготовка к демо", "10:00–11:00 — Inbox review · 14:00–15:00 — Demo prep")}
          </p>
        </div>
      </div>

    <div className="pt-1 flex flex-wrap gap-1.5">
      <button
        type="button"
        className="inline-flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 shadow-sm transition-all hover:-translate-y-0.5"
      >
        <Check size={12} aria-hidden="true" />
        {tr("Внести в календарь", "Add to calendar")}
      </button>
      <button
        type="button"
        className="inline-flex items-center text-xs font-medium px-3 py-2 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
      >
        {tr("Отмена", "Cancel")}
      </button>
    </div>
  </div>
);

const IMG_W = 396;
const IMG_H = 773;

const UI_W = 400;
const UI_H = 866;

const IPHONE_SCREEN_CORNERS: [Point, Point, Point, Point] = [
  [37, -0.3],
  [98, 17.3],
  [97, 98],
  [7, 96],
];


/* ─── Общая «коробка» iPhone для любых сцен ──────────────── */
const IPHONE_MASK_BOTTOM =
  "linear-gradient(to bottom, " +
    "black 0%, " +
    "black 32%, " +
    "rgba(0,0,0,0.92) 40%, " +
    "rgba(0,0,0,0.72) 45%, " +
    "rgba(0,0,0,0.4)  50%, " +
    "rgba(0,0,0,0.0) 54%, " +
    "transparent 92%, " +
    "transparent 100%" +
  ")";

const IPhoneFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(0.4);

  React.useLayoutEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      if (w > 0) setScale(w / IMG_W);
    };
    update();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const matrix = React.useMemo(() => {
    const dst = IPHONE_SCREEN_CORNERS.map(([px, py]) => [
      (px / 100) * IMG_W,
      (py / 100) * IMG_H,
    ]) as [Point, Point, Point, Point];

    return getPerspectiveMatrix(
      [
        [0, 0],
        [UI_W, 0],
        [UI_W, UI_H],
        [0, UI_H],
      ],
      dst
    );
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="relative w-full"
      style={{ height: IMG_H * scale * IPHONE_VISIBLE_RATIO }}
    >
      <div
        className="absolute top-0 left-0 origin-top-left"
        style={{
          width: IMG_W,
          height: IMG_H,
          transform: `scale(${scale})`,
          WebkitMaskImage: IPHONE_MASK_BOTTOM,
          maskImage: IPHONE_MASK_BOTTOM,
        }}
      >
        <img
          src="/images/iPhone.webp"
          alt="iPhone"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
          loading="lazy"
          draggable={false}
        />

        <div
          className="absolute top-0 left-0 overflow-hidden pointer-events-none select-none"
          style={{
            width: UI_W,
            height: UI_H,
            transformOrigin: "0 0",
            transform: matrix,
            borderRadius: 50,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};


const IPHONE_VISIBLE_RATIO = 0.6;
const IPhoneScene: React.FC = () => (
  <IPhoneFrame>
    <div className="absolute inset-0 flex flex-col bg-white dark:bg-gray-950">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-semibold shrink-0">
          {tr("п", "D")}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[20px] font-medium text-gray-900 dark:text-white truncate">
            {tr("Папа", "Dad")}
          </p>
          <p className="text-[20px] text-emerald-500">online</p>
        </div>
      </div>

      <div className="flex-1 p-3 space-y-2">
        <div className="flex justify-start">
          <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-gray-100 dark:bg-gray-800 px-2.5 py-1.5">
            <p className="text-[20px] text-gray-800 dark:text-gray-200">
              {tr("Привет! Не забудь про рейс ✈️", "Hi! Don't forget your flight ✈️")}
            </p>
          </div>
        </div>
      </div>
    </div>

    <img
      src="/images/AirPlaneTicket.jpeg"
      alt={tr("Сообщение с авиабилетом", "A message with a plane ticket")}
      className="
        absolute left-[3%] top-[22%] z-20
        w-[84%] h-auto
        rounded-2xl shadow-lg
        pointer-events-none select-none
      "
      loading="lazy"
    />

    <div
      className="
        absolute left-[3%] top-[43%] z-30
        w-[53%]
        pointer-events-none select-none
      "
    >
      <ChatContextMenu />
    </div>
  </IPhoneFrame>
);

const IPhoneSceneFinance: React.FC = () => (
  <IPhoneFrame>
    <div className="absolute inset-0 flex flex-col bg-white dark:bg-gray-950">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white text-sm font-semibold shrink-0">
          SN
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[20px] font-medium text-gray-900 dark:text-white truncate">
            Sergey Nenashev
          </p>
          <p className="text-[16px] text-emerald-500">online</p>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-4 overflow-hidden">
        <div className="flex justify-center">
          <div
            className="
              px-3 py-1 rounded-full
              bg-blue-50 dark:bg-blue-950/50
              ring-1 ring-blue-100 dark:ring-blue-900/60
              text-blue-700 dark:text-blue-300
              text-[15px] font-medium
              flex items-center gap-1.5
            "
          >
            <Sparkles size={13} aria-hidden="true" />
            {tr("В этом диалоге сидит Dayla", "Dayla is in this chat")}
          </div>
        </div>

        <div className="flex justify-start">
          <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-gray-100 dark:bg-gray-800 px-3 py-2">
            <p className="text-[20px] text-gray-800 dark:text-gray-200">
              {tr("Пришлите отчётность к концу квартала", "Send the reports by the end of the quarter")}
            </p>
          </div>
        </div>

      </div>
    </div>
  </IPhoneFrame>
);

interface DaylaChatCardProps {
  forwardedFrom?: string;
  userMessage?: string;
  daylaMessage: React.ReactNode;
}

const DaylaChatCard: React.FC<DaylaChatCardProps> = ({
  forwardedFrom,
  userMessage,
  daylaMessage,
}) => (
  <div
    className={cn(
      "relative overflow-hidden rounded-2xl",
      "bg-white/55 dark:bg-gray-900/40",
      "backdrop-blur-2xl",
      "ring-1 ring-white/60 dark:ring-white/10",
      "shadow-[0_8px_32px_rgba(15,23,42,0.12),inset_0_1px_0_rgba(255,255,255,0.75)]",
      "dark:shadow-[0_8px_32px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.06)]",
    )}
  >

    <div className="relative p-4 space-y-4">
      {(forwardedFrom || userMessage) && (
        <div className="flex justify-end">
          <div
            className={cn(
              "max-w-[82%] rounded-2xl rounded-br-sm",
              "bg-gradient-to-br from-blue-500/90 to-blue-600/90",
              "backdrop-blur-md text-white px-4 py-2.5",
              "ring-1 ring-white/25",
              "shadow-[0_4px_16px_rgba(59,130,246,0.35),inset_0_1px_0_rgba(255,255,255,0.35)]",
            )}
          >
            {forwardedFrom && (
              <p className="text-[10px] uppercase tracking-wide opacity-75 mb-1">
                {forwardedFrom}
              </p>
            )}
            {userMessage && <p className="text-sm leading-snug">{userMessage}</p>}
          </div>
        </div>
      )}

      <div className="flex items-end gap-2">
        <div
          aria-hidden="true"
          className="w-7 h-7 rounded-full shrink-0 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-md ring-1 ring-white/40"
        >
          <Sparkles size={13} />
        </div>

        <div className="max-w-[86%] min-w-0">
          <div
            className={cn(
              "rounded-2xl rounded-bl-sm px-4 py-3",
              "bg-white/55 dark:bg-white/[0.06]",
              "backdrop-blur-md",
              "ring-1 ring-white/50 dark:ring-white/5",
              "shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_2px_8px_rgba(15,23,42,0.05)]",
              "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_2px_8px_rgba(0,0,0,0.25)]",
            )}
          >
            <div className="text-sm text-gray-900 dark:text-white leading-snug">
              {daylaMessage}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div className="relative px-4 py-3 border-t border-white/40 dark:border-white/5 bg-white/25 dark:bg-white/[0.02] backdrop-blur-md">
      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        <Send size={14} aria-hidden="true" />
        <span>{tr("Сообщение Dayla…", "Message Dayla…")}</span>
      </div>
    </div>
  </div>
);

type PageBlob = {
  left: string;
  top: string;
  size: string;
  gradient: string;
  shape: string;
  duration: string;
  delay: string;
};

const PAGE_BLOBS: PageBlob[] = [
  { left: "-10%", top: "-2%",  size: "32rem", gradient: "from-blue-500/22     to-indigo-500/10",   shape: "60% 40% 70% 30% / 60% 30% 70% 40%", duration: "24s", delay: "0s"   },
  { left: "55%",  top: "6%",   size: "28rem", gradient: "from-purple-500/18   to-fuchsia-500/10",  shape: "40% 60% 30% 70% / 50% 60% 40% 50%", duration: "28s", delay: "3s"   },

  { left: "60%",  top: "16%",  size: "30rem", gradient: "from-indigo-500/20   to-violet-500/10",   shape: "50% 50% 60% 40% / 40% 50% 60% 50%", duration: "30s", delay: "5s"   },
  { left: "-14%", top: "26%",  size: "28rem", gradient: "from-cyan-500/15     to-blue-500/8",      shape: "70% 30% 50% 50% / 50% 40% 60% 50%", duration: "26s", delay: "2s"   },

  { left: "58%",  top: "36%",  size: "30rem", gradient: "from-fuchsia-500/16  to-purple-500/8",    shape: "60% 40% 40% 60% / 50% 50% 40% 60%", duration: "24s", delay: "4s"   },
  { left: "-10%", top: "46%",  size: "32rem", gradient: "from-blue-500/18     to-indigo-500/8",    shape: "40% 60% 50% 50% / 60% 40% 60% 40%", duration: "32s", delay: "6s"   },

  { left: "70%",  top: "56%",  size: "28rem", gradient: "from-purple-500/16   to-pink-500/8",      shape: "50% 50% 30% 70% / 40% 60% 40% 60%", duration: "28s", delay: "1s"   },
  { left: "-8%",  top: "66%",  size: "30rem", gradient: "from-indigo-500/18   to-blue-500/8",      shape: "60% 40% 50% 50% / 50% 50% 60% 40%", duration: "30s", delay: "3.5s" },

  { left: "40%",  top: "80%",  size: "30rem", gradient: "from-fuchsia-500/14  to-purple-500/8",    shape: "40% 60% 60% 40% / 50% 50% 40% 60%", duration: "32s", delay: "5s"   },
  { left: "-12%", top: "92%",  size: "28rem", gradient: "from-blue-500/16     to-cyan-500/8",      shape: "50% 50% 40% 60% / 60% 40% 50% 50%", duration: "34s", delay: "7s"   },
];

const PageBackdrop: React.FC = () => (
  <>
    <style>{`
      @keyframes page-blob-drift {
        0%, 100% { transform: translate3d(0, 0, 0)    rotate(0deg)  scale(1);    }
        50%      { transform: translate3d(2%, -2%, 0) rotate(10deg) scale(1.09); }
      }
      @keyframes page-pulse {
        0%, 100% { transform: scale(0.6); opacity: 0; }
        50%      { transform: scale(1.5); opacity: 1; }
      }

      /* ─── Crossfade для AI-рекомендаций ─────────────── */
      @keyframes ai-reco-a {
        0%, 45%   { opacity: 1; }
        55%, 95%  { opacity: 0; }
        100%      { opacity: 1; }
      }
      @keyframes ai-reco-b {
        0%, 45%   { opacity: 0; }
        55%, 95%  { opacity: 1; }
        100%      { opacity: 0; }
      }

      .ai-reco-a {
        animation: ai-reco-a 8s ease-in-out infinite;
      }
      .ai-reco-b {
        animation: ai-reco-b 8s ease-in-out infinite;
      }

      @media (prefers-reduced-motion: reduce) {
        .page-blob, .page-pulse, .ai-reco-a, .ai-reco-b { animation: none; }
        /* если reduced-motion: показать только первую рекомендацию */
        .ai-reco-a { opacity: 1; }
        .ai-reco-b { opacity: 0; }
      }
    `}</style>

    <div aria-hidden="true" className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      {PAGE_BLOBS.map((b, i) => (
        <div
          key={`blob-${i}`}
          className={`absolute bg-gradient-to-br blur-3xl page-blob ${b.gradient}`}
          style={{
            left: b.left,
            top: b.top,
            width: b.size,
            height: b.size,
            borderRadius: b.shape,
          }}
        />
      ))}


      <div
        className="absolute inset-0 opacity-[0.035] dark:opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          color: "#000",
        }}
      />
    </div>
  </>
);



const MON_IMG_W = 1144;
const MON_IMG_H = 938;

const MON_UI_W = 800;
const MON_UI_H = 400;

const MONITOR_SCREEN_CORNERS: [Point, Point, Point, Point] = [
  [0.5, 1],
  [99.5, 2.5],
  [93.9, 74],
  [6.7, 60.7],
];

const MonitorScene: React.FC = () => {
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(0.5);

  React.useLayoutEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      if (w > 0) setScale(w / MON_IMG_W);
    };
    update();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const matrix = React.useMemo(() => {
    const dst = MONITOR_SCREEN_CORNERS.map(([px, py]) => [
      (px / 100) * MON_IMG_W,
      (py / 100) * MON_IMG_H,
    ]) as [Point, Point, Point, Point];

    return getPerspectiveMatrix(
      [
        [0, 0],
        [MON_UI_W, 0],
        [MON_UI_W, MON_UI_H],
        [0, MON_UI_H],
      ],
      dst
    );
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="relative w-full"
      style={{ height: MON_IMG_H * scale }}
    >
      <div
        className="absolute top-0 left-0 origin-top-left"
        style={{
          width: MON_IMG_W,
          height: MON_IMG_H,
          transform: `scale(${scale})`,
          WebkitMaskImage:
            "linear-gradient(to bottom, black 0%, black 45%, rgba(0,0,0,0.7) 55%, rgba(0,0,0,0.25) 60%, transparent 80%, transparent 100%)",
            maskImage:
            "linear-gradient(to bottom, black 0%, black 45%, rgba(0,0,0,0.7) 55%, rgba(0,0,0,0.25) 60%, transparent 80%, transparent 100%)",
        }}
      >
        <img
          src="/images/Monitor.webp"
          alt={tr("Монитор с финансовым отчётом", "A monitor with a financial report")}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
          loading="lazy"
          draggable={false}
        />

        <div
          className="absolute top-0 left-0 overflow-hidden pointer-events-none select-none"
          style={{
            width: MON_UI_W,
            height: MON_UI_H,
            transformOrigin: "0 0",
            transform: matrix,
            borderRadius: 1,
          }}
        >
          <div className="absolute inset-0 flex flex-col bg-white dark:bg-gray-950">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100 dark:border-gray-800">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                {tr("СН", "SN")}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[20px] font-medium text-gray-900 dark:text-white truncate">
                  Sergey Nenashev
                </p>
                <p className="text-[16px] text-emerald-500">online</p>
              </div>
            </div>

            <div className="flex-1 p-5 space-y-3 overflow-hidden">

              <div className="flex justify-center">
                <div
                  className="
                    px-3 py-1 rounded-full
                    bg-blue-50 dark:bg-blue-950/50
                    ring-1 ring-blue-100 dark:ring-blue-900/60
                    text-blue-700 dark:text-blue-300
                    text-[14px] font-medium
                    flex items-center gap-1.5
                  "
                >
                  <Sparkles size={13} aria-hidden="true" />
                  {tr("В этом диалоге сидит Dayla", "Dayla is in this chat")}
                </div>
              </div>

              <div className="flex justify-start">
                <div className="max-w-[60%] space-y-2.5">
                  <div className="rounded-2xl rounded-bl-sm bg-gray-100 dark:bg-gray-800 px-3.5 py-2">
                    <p className="text-[20px] text-gray-800 dark:text-gray-200">
                      {tr("Пришлите отчётность к концу квартала", "Send the reports by the end of the quarter")}
                    </p>
                  </div>
                </div>
              </div>


            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


const HERO_SCENE_W = 790;
const HERO_SCENE_H = 600;

const HeroScene: React.FC = () => (
  <div
    className="relative w-full min-w-0"
    style={{
      containerType: "inline-size",
      aspectRatio: `${HERO_SCENE_W / HERO_SCENE_H}`,
    }}
    aria-label={tr("Календарь и голосовой ассистент Dayla", "The calendar and Dayla's voice assistant")}
    role="img"
  >
    <div
      className="absolute top-0 left-0 origin-top-left"
      style={{
        width: HERO_SCENE_W,
        height: HERO_SCENE_H,
        transform: `scale(calc(100cqw / ${HERO_SCENE_W*1.1}px))`,
      }}
    >
      {/* ── Маскот ──────── */}
      <div
        className="absolute z-0"
        style={{
          left: -80,
          top: -70,
          width: 825,
          WebkitMaskImage: [
            "linear-gradient(to bottom, black 0%, black 45%, rgba(0,0,0,0.5) 68%, transparent 90%)",
            "linear-gradient(to right, black 0%, black 55%, rgba(0,0,0,0.5) 78%, transparent 100%)",
            "linear-gradient(to left, black 0%, black 85%, transparent 100%)",
          ].join(", "),
          maskImage: [
            "linear-gradient(to bottom, black 0%, black 45%, rgba(0,0,0,0.5) 68%, transparent 90%)",
            "linear-gradient(to right, black 0%, black 55%, rgba(0,0,0,0.5) 78%, transparent 100%)",
            "linear-gradient(to left, black 0%, black 85%, transparent 100%)",
          ].join(", "),
          WebkitMaskComposite: "source-in",
          maskComposite: "intersect",
        }}
      >
        <MascotFade
          src="/images/MaskotWB.webp"
          alt={tr("Ассистент Dayla говорит по телефону", "The Dayla assistant on the phone")}
          fadeStart={40}
          fadeLength={60}
          blend
          glow
        />
      </div>

      <div
        className="absolute z-10"
        style={{ left: 335, top: 320, width: 500 }}
      >
        <HeroMockup />
      </div>

      <div
        className="absolute z-20"
        style={{ left: 441, top: 105, width: 390 }}
      >
        <SpeechBubble />
      </div>
    </div>
  </div>
);

const Hero: React.FC<{ onStart: () => void }> = ({ onStart }) => (
  <section className="relative">
    <div className="max-w-6xl mx-auto px-4 md:px-6 pt-28 md:pt-40 lg:pt-52 pb-4 md:pb-6 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start min-w-0">
    <div className="text-eyebrow min-w-0">
        <Badge variant="default" className="mb-4">
          <Sparkles size={12} className="mr-1" aria-hidden="true" />
          {tr("Бесплатный персональный ИИ-ассистент", "A free personal AI assistant")}
        </Badge>

        <h1 className="text-eyebrowtext-4xl md:text-6xl font-semibold tracking-tight leading-[1.05]">
          {tr("Планируйте день", "Plan your day")}{" "}
          <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 bg-clip-text text-transparent">
            {tr("за минуту", "in a minute")}
          </span>
        </h1>

        <p className="mt-5 text-lg text-gray-600 dark:text-gray-400 max-w-xl">
          {tr(
            "Скажите о своих планах — Dayla найдёт время в календаре, расставит приоритеты и напомнит",
            "Tell Dayla your plans — it finds time in your calendar, sets priorities and reminds you"
          )}
        </p>

        <div className="mt-2 flex flex-col sm:flex-row gap-3">
          
        </div>

      </div>

      <div className="min-w-0">
        <HeroScene />
      </div>
    </div>
  </section>
);

const SpeechBubble: React.FC = () => (
  <Card className="relative p-5 md:p-6 shadow-lg">
    <CardContent className="p-0 min-w-0">
      <div className="flex items-start gap-3">
        <div
          aria-hidden="true"
          className="shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center"
        >
          <Mic size={18} className="text-white" />
        </div>

        <div className="min-w-0">
          <p className="text-lg md:text-xl leading-snug text-gray-900 dark:text-white">
            {tr("Завтра в 16 созвон с командой", "Team call tomorrow at 4 pm")}
          </p>
        </div>
      </div>
    </CardContent>

    <div
      aria-hidden="true"
      className="absolute -left-2 top-[70%] -translate-y-1/2 w-4 h-4 rotate-45 bg-white dark:bg-gray-800"
    />
  </Card>
);

const MOCK_TASKS: Array<{
  time: string;
  title: string;
  done?: boolean;
  isNew?: boolean;   // ← новое
}> = [
  { time: "09:30", title: tr("Лекция по программированию", "Programming lecture") },
  { time: "11:10", title: tr("Лекция по экономике", "Economics lecture") },
  { time: "16:00", title: tr("Созвон с командой", "Team call"), isNew: true },
  { time: "18:30", title: tr("Сделать лабораторную работу", "Do the lab assignment") },
];

const AI_RECOMMENDATION_STUDENT = tr(
  "Не успели задачу? Перенесём на завтра",
  "Didn't finish a task? Move it tomorrow"
);
const AI_RECOMMENDATION_PRO = tr("Уделим больше времени изучению английского?", "Shall we spend more time on English?");

const HeroMockup: React.FC = () => (
  <div className="relative w-full">
    <div className="absolute -inset-4 bg-gradient-to-br from-blue-500/25 via-indigo-500/15 to-purple-500/25 rounded-3xl blur-2xl" />
    <Card className="relative w-full p-0 overflow-hidden shadow-xl">
      <div className="p-5 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{tr("Завтра", "Tomorrow")}</p>
          <p className="text-base md:text-lg font-medium">
            {new Intl.DateTimeFormat(LOCALE, {
              weekday: "long",
              day: "numeric",
              month: "long",
            }).format(new Date(Date.now() + 24 * 60 * 60 * 1000))}
          </p>
        </div>
      </div>

      <ul className="p-3 space-y-1.5">
        {MOCK_TASKS.map((t) => {
          return (
            <li
              key={t.time + t.title}
              className={cn(
                "relative flex items-center gap-2.5 p-2.5 rounded transition-colors",
                "hover:bg-gray-50 dark:hover:bg-gray-800/60",
                t.done && "opacity-60",

                // ─── Подсветка новой задачи ───
                t.isNew &&
                  "bg-blue-50/70 dark:bg-blue-950/30 " +
                  "ring-1 ring-blue-200/70 dark:ring-blue-800/50 " +
                  "hover:bg-blue-50 dark:hover:bg-blue-950/40"
              )}
            >
              <span className="text-sm text-gray-400 w-14 tabular-nums shrink-0">
                {t.time}
              </span>

              {/* Цветная полоска слева: у новой — синяя, у обычных — прозрачная */}
              <span
                aria-hidden="true"
                className={cn(
                  "w-1 self-stretch rounded shrink-0",
                  t.isNew ? "bg-blue-500" : "bg-transparent"
                )}
              />

              <span
                className={cn(
                  "text-base flex-1 min-w-0 truncate",
                  t.done && "line-through text-gray-400"
                )}
              >
                {t.title}
              </span>

              {/* Бейдж «Новое» */}
              {t.isNew && (
                <span
                  className={cn(
                    "shrink-0 inline-flex items-center gap-1",
                    "px-2 py-0.5 rounded-full",
                    "text-[11px] font-semibold uppercase tracking-wide",
                    "bg-blue-500 text-white",
                    "shadow-[0_1px_4px_rgba(59,130,246,0.45)]"
                  )}
                >
                  <Sparkles size={10} aria-hidden="true" />
                  {tr("Новое", "New")}
                </span>
              )}
            </li>
          );
        })}

        <li className="relative flex flex-col gap-2.5 p-3 rounded bg-blue-50/70 dark:bg-blue-900/20">
          <div className="flex items-center gap-3">
            <span className="relative shrink-0">
              <Sparkles size={16} className="text-blue-500" aria-hidden="true" />
              <span
                aria-hidden="true"
                className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"
              />
            </span>

            <div className="relative flex-1 min-w-0 h-6" aria-label={tr("Рекомендация ИИ", "AI recommendation")}>
              <span className="ai-reco-a absolute inset-0 flex items-center text-base text-blue-800 dark:text-blue-200 text-ellipsis">
                {AI_RECOMMENDATION_STUDENT}
              </span>
              <span
                className="ai-reco-b absolute inset-0 flex items-center text-base text-blue-800 dark:text-blue-200 whitespace-nowrap overflow-hidden text-ellipsis"
                aria-hidden="true"
              >
                {AI_RECOMMENDATION_PRO}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              className="
                inline-flex items-center gap-1 px-3 h-7 rounded text-xs font-medium
                bg-blue-600 text-white hover:bg-blue-700 transition-colors
              "
            >
              {tr("Давай", "Sure")}
            </button>

            <button
              type="button"
              className="
                inline-flex items-center px-2.5 h-7 rounded text-xs font-medium
                text-blue-700/70 dark:text-blue-300/70 hover:text-blue-900 dark:hover:text-blue-100
                transition-colors
              "
            >
              {tr("Позже", "Later")}
            </button>
          </div>
        </li>
      </ul>
    </Card>
  </div>
);

const WHITE_GRADIENT_STOPS = [
  { offset: "0%",   color: "#ffffff" },
  { offset: "60%",  color: "#f8fafc" },
  { offset: "100%", color: "#e2e8f0" },
];

const futureINTEGRATIONS = [
  { src: "/images/google-calendar.png",       alt: "Google Calendar", w: 44 },
  { src: "/images/apple-calendar.webp",   alt: "Apple Calendar",  w: 44 },
  { src: "/images/yandexcalendar.png",        alt: "Yandex Calendar", w: 44 },
  { src: "/images/Jira_Software_Logo.svg",    alt: "Jira",            w: 40 },
  { src: "/images/Notion.webp",                alt: "Notion",          w: 44 },
  { src: "/images/TelegramWB.webp",            alt: "Telegram",        w: 44 },
  { src: "/images/slack.webp",                 alt: "Slack",           w: 44 },
  { src: "/images/tc_logo_square.webp",        alt: "TrueConf",        w: 44 },
];

const INTEGRATIONS = [
  { src: "/images/google-calendar.png",       alt: "Google Calendar",  w: 44 },
  { src: "/images/yandexcalendar.png",        alt: "Yandex Calendar",  w: 44 },
  { src: "/images/apple-calendar.webp",       alt: "Apple Calendar",   w: 44 },
  { src: "/images/samsung-calendar.webp",     alt: "Samsung Calendar", w: 44 },
  { src: "/images/Jira_Software_Logo.svg",    alt: "Jira",             w: 40 },
  { src: "/images/Notion.webp",               alt: "Notion",           w: 44 },
  { src: "/images/TelegramWB.webp",           alt: "Telegram",         w: 44 },
];

// Насколько секция наезжает на предыдущий блок сверху (задает длину верхнего градиента)
const FINAL_CTA_OVERLAP_TOP_VH = 30; 
// Дополнительное пространство снизу (задает длину нижнего градиента)
const FINAL_CTA_EXTRA_BOTTOM_VH = 15; 

// АЛЬФА СРЕДНЕЙ ЧАСТИ: 1 - полностью непрозрачный центр, 0.5 - полупрозрачный
const FINAL_CTA_GRADIENT_ALPHA = 0.5; 

// Насколько опустить верхнюю границу неактивного контейнера (в процентах)
const FINAL_CTA_INACTIVE_TOP_INSET = 35; 

// НОВОЕ: Насколько опустить сам градиент сверху (в vh). Увеличивай, чтобы градиент начинался ниже.
const FINAL_CTA_MASK_TOP_OFFSET_VH = 25; 

// Ширина градиента слева и справа (в vw)
const FINAL_CTA_HORIZONTAL_GRADIENT_VW = 15; 

// Вертикальная маска (управляет верхом и низом)
const FINAL_CTA_MASK_VERTICAL = `
  linear-gradient(
    to bottom,
    rgba(0,0,0,0) 0vh,
    rgba(0,0,0,0) ${FINAL_CTA_MASK_TOP_OFFSET_VH}vh,
    rgba(0,0,0,${FINAL_CTA_GRADIENT_ALPHA}) calc(${FINAL_CTA_MASK_TOP_OFFSET_VH}vh + ${FINAL_CTA_OVERLAP_TOP_VH}vh),
    rgba(0,0,0,${FINAL_CTA_GRADIENT_ALPHA}) calc(100vh + ${FINAL_CTA_OVERLAP_TOP_VH}vh),
    rgba(0,0,0,0) calc(100vh + ${FINAL_CTA_OVERLAP_TOP_VH + FINAL_CTA_EXTRA_BOTTOM_VH}vh)
  )
`;

// Горизонтальная маска (управляет левом и правом)
const FINAL_CTA_MASK_HORIZONTAL = `
  linear-gradient(
    to right,
    rgba(0,0,0,0) 0%,
    rgba(0,0,0,${FINAL_CTA_GRADIENT_ALPHA}) ${FINAL_CTA_HORIZONTAL_GRADIENT_VW}vw,
    rgba(0,0,0,${FINAL_CTA_GRADIENT_ALPHA}) calc(100% - ${FINAL_CTA_HORIZONTAL_GRADIENT_VW}vw),
    rgba(0,0,0,0) 100%
  )
`;

// Объединяем маски
const FINAL_CTA_MASK = `${FINAL_CTA_MASK_VERTICAL}, ${FINAL_CTA_MASK_HORIZONTAL}`;

const ORBIT_PERIOD_MS = 24000;
const ORBIT_TRANSITION_MS = 700;
// On a phone the orbit and the row of calendars are smaller, so all seven icons fit the screen
const PHONE_MAX_W = 640;
const isPhoneWidth = () => window.innerWidth <= PHONE_MAX_W;
const rowIconSize = () => (isPhoneWidth() ? 40 : 56);
const rowGap = () => (isPhoneWidth() ? 8 : 12);
const rowYOffset = () => (isPhoneWidth() ? 100 : 140);
const orbitRadiusScale = () => (isPhoneWidth() ? 0.75 : 1 / 1.2);
// Иконка рисуется в максимальном размере орбиты и уменьшается через scale():
// анимация меняет только transform/opacity — без layout на каждом кадре.
const ORBIT_ICON_BASE = 96;
const ORBIT_ICON_IMG_BASE = 58;

const FinalCTA: React.FC<{
  onStart: () => void;
  onActiveChange?: (active: boolean) => void;
}> = ({ onStart, onActiveChange }) => {
  // ... (код useRef и useEffect остается без изменений до return) ...
  const sectionRef = React.useRef<HTMLElement>(null);
  const [active, setActive] = React.useState(false);
  const lastActive = React.useRef(false);
  const lastY = React.useRef(0);
  const iconRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  const [isNarrow, setIsNarrow] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const update = () => setIsNarrow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

    React.useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    lastY.current = window.scrollY;
    
    const update = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const visibleTop = Math.max(0, rect.top);
      const visibleBottom = Math.min(vh, rect.bottom);
      const visible = Math.max(0, visibleBottom - visibleTop);
      const ratio = visible / Math.min(vh, rect.height || vh);
      
      // Убрали проверку goingUp. Теперь блок активируется при видимости > 50% 
      // независимо от того, скроллим мы вверх или вниз.
      const next = ratio > 0.5;
      
      if (next !== lastActive.current) {
        lastActive.current = next;
        setActive(next);
        onActiveChange?.(next);
      }
      lastY.current = window.scrollY;
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [onActiveChange]);

  React.useEffect(() => {
    // ... (код анимации иконок остается без изменений) ...
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
      const size = rowIconSize();
      const gap = rowGap();
      const perRow = Math.max(1, Math.floor((maxWidth + gap) / (size + gap)));
      const rowIdx = Math.floor(i / perRow);
      const colIdx = i % perRow;
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
      const tr = on ? `transform ${ORBIT_TRANSITION_MS}ms cubic-bezier(0.4,0,0.2,1), opacity ${ORBIT_TRANSITION_MS}ms ease-out` : "none";
      icons.forEach((el) => { if (el) el.style.transition = tr; });
      void (icons[0]?.offsetWidth ?? 0);
    };

    if (active && isPhoneWidth()) {
      const applyStatic = () => {
        if (!isPhoneWidth()) return;
        const maxWidth = Math.min(window.innerWidth - 32, 600);
        setTransition(true);
        icons.forEach((el, i) => { if (el) writeIcon(el, staticValues(i, maxWidth)); });
      };
      applyStatic();
      window.addEventListener("resize", applyStatic);
      return () => window.removeEventListener("resize", applyStatic);
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
      return () => {
        window.clearTimeout(timeoutId);
        if (rafId) cancelAnimationFrame(rafId);
      };
    } else {
      const applyStatic = () => {
        const maxWidth = Math.min(window.innerWidth - (isPhoneWidth() ? 32 : 120), 600);
        setTransition(true);
        icons.forEach((el, i) => { if (el) writeIcon(el, staticValues(i, maxWidth)); });
      };
      applyStatic();
      window.addEventListener("resize", applyStatic);
      return () => window.removeEventListener("resize", applyStatic);
    }
  }, [active, isNarrow]);

   return (
    <section
      ref={sectionRef}
      id="integrations"
      className="relative isolate w-full overflow-hidden"
      style={{
        marginTop: `-${FINAL_CTA_OVERLAP_TOP_VH}vh`,
        paddingTop: `${FINAL_CTA_OVERLAP_TOP_VH}vh`,
        paddingBottom: `${FINAL_CTA_EXTRA_BOTTOM_VH}vh`,
      }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 transition-[clip-path] duration-700 ease-out will-change-[clip-path]"
        style={{
          background: "linear-gradient(135deg, #2563eb 0%, #4f46e5 50%, #7c3aed 100%)",
          clipPath: isNarrow || active 
            ? "inset(0% 0% 0% 0% round 0px)" 
            : `inset(${FINAL_CTA_INACTIVE_TOP_INSET}% 12% 18% 12% round 32px)`,
          WebkitMaskImage: FINAL_CTA_MASK,
          maskImage: FINAL_CTA_MASK,
          // Добавлено: Пересечение масок для создания градиента со всех сторон
          WebkitMaskComposite: "source-in",
          maskComposite: "intersect",
        }}
      />

      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-0 pointer-events-none transition-opacity duration-700",
          active ? "opacity-25" : "opacity-0"
        )}
        style={{
          clipPath: isNarrow || active 
            ? "inset(0% 0% 0% 0% round 0px)" 
            : `inset(${FINAL_CTA_INACTIVE_TOP_INSET}% 12% 18% 12% round 32px)`,
          WebkitMaskImage: FINAL_CTA_MASK,
          maskImage: FINAL_CTA_MASK,
          // Добавлено: Пересечение масок для создания градиента со всех сторон
          WebkitMaskComposite: "source-in",
          maskComposite: "intersect",
        }}
      >
        <div className="absolute -top-10 left-1/4 w-72 h-72 rounded-full bg-white/40 dark:bg-white/10 blur-3xl" />
        <div className="absolute -bottom-10 right-1/4 w-72 h-72 rounded-full bg-white/40 dark:bg-white/10 blur-3xl" />
      </div>

      <div
        className={cn(
          "relative z-10 mx-auto w-full max-w-6xl px-6 md:px-16 text-white",
          "flex flex-col items-center justify-center"
        )}
        style={{ 
          minHeight: "100vh" // Контент всегда ровно 100vh
        }}
      >
        {/* ... (Остальной контент FinalCTA без изменений) ... */}
        <div className="text-center max-w-3xl">
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight leading-[1.1]">
            {tr("Ваш день живёт в\u00a0Google, Jira, Notion и\u00a0блокноте.", "Your day lives in\u00a0Google, Jira, Notion and\u00a0a notebook.")}{" "}
            <span className="text-white/85">
              {tr("Dayla задаёт единый ритм.", "Dayla sets one rhythm.")}
            </span>
          </h2>
        </div>

        <div className="mt-16 flex flex-col items-center text-center">
          <p className="text-lg md:text-xl font-medium">
            {tr("Личный ассистент, который держит день в\u00a0форме.", "A personal assistant that keeps your day in\u00a0shape.")}
          </p>

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

            <button
              type="button"
              onClick={onStart}
              className={cn(
                "group relative z-10 inline-flex items-center justify-center overflow-hidden",
                "px-8 md:px-6 h-14 md:h-16",
                "text-lg md:text-xl font-semibold text-white",
                "rounded-full",
                "transition-all duration-300 ease-out",
                "hover:-translate-y-0.5 active:translate-y-0",
                // Стеклянные стили кнопки
                "bg-white/10 dark:bg-white/[0.05] backdrop-blur-xl",
                "ring-1 ring-white/30 dark:ring-white/10",
                "shadow-[0_4px_24px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.7),inset_0_-1px_0_rgba(15,23,42,0.06)]",
                "dark:shadow-[0_4px_24px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.3)]",
                "hover:bg-white/20 dark:hover:bg-white/[0.1]"
              )}
            >
              {/* Блик для кнопки */}
              <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-full bg-[linear-gradient(135deg,rgba(255,255,255,0.1)_0%,rgba(255,255,255,0.02)_25%,transparent_45%,transparent_75%,rgba(147,197,253,0.05)_100%)]" />
              
              <span className="relative inline-flex items-center">
                {tr("Начать бесплатно", "Start for free")}
                <ArrowRight size={22} className="ml-2 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true" />
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};


const SLIDE_DESIGN_WIDTH = 1280;
// Below this container width the slides switch to the stacked phone layout, designed 420px wide
const SLIDE_MOBILE_BREAKPOINT = 768;
const SLIDE_MOBILE_DESIGN_WIDTH = 420;

interface ScaledSlideProps {
  children: React.ReactNode;
  /** Общий scale для всех слайдов. */
  scale: number;
  /** The width the slide is laid out at before scaling. */
  designWidth: number;
  /** Натуральная высота контента в дизайн-пикселях (до transform). */
  onMeasured?: (designHeight: number) => void;
}

const ScaledSlide: React.FC<ScaledSlideProps> = ({
  children,
  scale,
  designWidth,
  onMeasured,
}) => {
  const innerRef = React.useRef<HTMLDivElement>(null);

  React.useLayoutEffect(() => {
    const inner = innerRef.current;
    if (!inner) return;

    // offsetHeight не зависит от transform — это чистая высота layout'а.
    const update = () => onMeasured?.(inner.offsetHeight);

    update();
    if (typeof ResizeObserver === "undefined") return;

    const ro = new ResizeObserver(update);
    ro.observe(inner);
    return () => ro.disconnect();
  }, [onMeasured]);

  return (
    <div className="w-full h-full overflow-hidden flex items-center justify-center">
      <div
        ref={innerRef}
        style={{
          width: designWidth,
          flexShrink: 0,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
        {children}
      </div>
    </div>
  );
};

const AUTO_ADVANCE_MS = 8000;
const MANUAL_PAUSE_MS = 25000;

/* A slide is laid out at a fixed design width and scaled to the screen. On a phone that width is narrow,
   and the picture and the chat stand one under the other instead of side by side. */
type SlideProps = { mobile: boolean };

const SLIDE_PAD = (mobile: boolean) => (mobile ? "pt-4 pb-20" : "py-16");
const SLIDE_INNER = (mobile: boolean) => (mobile ? "px-4" : "px-6");
const SLIDE_HEAD = (mobile: boolean) => (mobile ? "mb-6" : "max-w-2xl mb-14");
const SLIDE_TITLE = (mobile: boolean) =>
  cn("font-semibold tracking-tight", mobile ? "text-[28px] leading-tight" : "text-4xl");
const SLIDE_PHONE = (mobile: boolean) => (mobile ? "max-w-[300px]" : "max-w-[400px]");
const SLIDE_NOTE = (mobile: boolean) => (mobile ? "mt-6 text-center" : "mt-16 max-w-2xl mx-auto text-center");

const SlideFlight: React.FC<SlideProps> = ({ mobile }) => (
  <div className={SLIDE_PAD(mobile)}>
    <div className={cn("max-w-5xl mx-auto", SLIDE_INNER(mobile))}>
      <div className={SLIDE_HEAD(mobile)}>
        <Badge className="text-eyebrow mb-3">{tr("Парсинг документов", "Document parsing")}</Badge>
        <h2 className={SLIDE_TITLE(mobile)}>
          {tr("Пересылайте события — Dayla всё спланирует", "Forward events — Dayla plans the rest")}
        </h2>
      </div>

      <div className={mobile ? "flex flex-col gap-4" : "grid grid-cols-2 gap-20 items-center"}>
        <div className="relative flex justify-center">
          <div className={cn("relative w-full", SLIDE_PHONE(mobile))}>
            <IPhoneScene />
          </div>
        </div>
        <div className="relative">
          <DaylaChatCard
            forwardedFrom={tr("Переслано от Папы", "Forwarded from Dad")}
            userMessage={tr("Авиабилет PD-205 · VKO → LED", "Plane ticket PD-205 · VKO → LED")}
            daylaMessage={
              <>
                {tr("Распознала авиабилет:", "I read the plane ticket:")}{' '}
                <strong className="font-semibold">{tr("дата — 05 апреля, 21:55", "date — 5 April, 21:55")}</strong>,{' '}
                <strong className="font-semibold">{tr("место посадки — Внуково, терминал A", "boarding — Vnukovo, terminal A")}</strong>.
              </>
            }
          />
        </div>
      </div>
    </div>
  </div>
);

const SlideFinance: React.FC<SlideProps> = ({ mobile }) => (
  <div className={SLIDE_PAD(mobile)}>
    <div className={cn("max-w-6xl mx-auto", SLIDE_INNER(mobile))}>
      <div className={SLIDE_HEAD(mobile)}>
        <Badge className="text-eyebrow mb-3">{tr("Из рабочего чата — в план", "From a work chat to your plan")}</Badge>
        <h2 className={SLIDE_TITLE(mobile)}>
          {tr("Dayla работает там же, где и вы", "Dayla work where you do")}
        </h2>
        <p className="mt-3 text-gray-600 dark:text-gray-400">
          {tr("Начните проект в Dayla, поделитесь контекстом с рабочей командой в Telegram — и позвольте Dayla довести дело до конца.", "Start a project in ChatGPT, share context with your team in Slack — and let Dayla finish the job. The assistant keeps context across all channels.")}
        </p>
      </div>

      <div className={mobile ? "flex flex-col gap-4" : "grid grid-cols-2 gap-20 items-center"}>
        <div className="relative flex justify-center">
          <div className={cn("relative w-full", SLIDE_PHONE(mobile))}>
            <IPhoneSceneFinance />
          </div>
        </div>
        <div className={cn("relative", mobile ? "w-full" : "max-w-sm mx-auto")}>
          <DaylaChatCard
            daylaMessage={
              <>
                {tr("Записала «Отчётность за квартал» на", "Saved “Quarterly reports” for")}{" "}
                <strong className="font-semibold">{tr("27 декабря", "27 December")}</strong>{" "}
                {tr(
                  "и напомню за день.",
                  "and will remind you a day before. Confirm in a private message — it's all in the calendar"
                )}
              </>
            }
          />
        </div>
      </div>
    </div>
  </div>
);

const SlideGTD: React.FC<SlideProps> = ({ mobile }) => (
  <div className={SLIDE_PAD(mobile)}>
    <div className={cn("max-w-6xl mx-auto", SLIDE_INNER(mobile))}>
      <div className={SLIDE_HEAD(mobile)}>
        <Badge className="text-eyebrow mb-3">{tr("Систематизация и дисциплина", "Structure and discipline")}</Badge>
        <h2 className={SLIDE_TITLE(mobile)}>
          {tr("Всё разложено по полочкам", "One sentence — and everything is in order")}
        </h2>
      </div>

      <div className={mobile ? "flex flex-col gap-6" : "grid grid-cols-[minmax(0,4fr)_minmax(0,6fr)] gap-16 items-center"}>
        <div className={cn("relative flex justify-center", mobile && "mx-auto w-full max-w-[260px]")}>
          <GTDAggregation />
        </div>
        <div className="relative">
          <DaylaChatCard
            userMessage={tr("Систематизируй задачи по GTD из рабочих чатов и Telegram", "Organise my tasks from work chats and Telegram using GTD")}
            daylaMessage={GTD_RESPONSE}
          />
        </div>
      </div>
    </div>
  </div>
);

const USE_CASE_SLIDES: { id: string; render: (mobile: boolean) => React.ReactNode }[] = [
  { id: "flight",  render: (mobile) => <SlideFlight mobile={mobile} />  },
  { id: "finance", render: (mobile) => <SlideFinance mobile={mobile} /> },
  { id: "gtd",     render: (mobile) => <SlideGTD mobile={mobile} />     },
];

const SWIPE_MIN_PX = 40;

const UserCaseCarousel: React.FC<{
  /** Оставлен для обратной совместимости. Больше не используется. */
  paused?: boolean;
}> = () => {
  const containerRef = React.useRef<HTMLElement>(null);
  const trackRef = React.useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = React.useState({ w: 0, h: 0 });
  const [translateX, setTranslateX] = React.useState(0);
  const [progress, setProgress] = React.useState(0);
  const total = USE_CASE_SLIDES.length;

  /* ─── Меряем вьюпорт ─── */
  React.useLayoutEffect(() => {
    const update = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  /* ─── Меряем натуральные высоты слайдов ─── */
  const measurementsRef = React.useRef<Record<number, number>>({});
  const [measureVersion, setMeasureVersion] = React.useState(0);
  const handleMeasured = React.useCallback((idx: number, designHeight: number) => {
    if (measurementsRef.current[idx] === designHeight) return;
    measurementsRef.current[idx] = designHeight;
    setMeasureVersion((v) => v + 1);
  }, []);
  const measuredCallbacks = React.useMemo(
    () => USE_CASE_SLIDES.map((_, i) => (h: number) => handleMeasured(i, h)),
    [handleMeasured]
  );

  const mobile = viewport.w > 0 && viewport.w < SLIDE_MOBILE_BREAKPOINT;
  const designWidth = mobile ? SLIDE_MOBILE_DESIGN_WIDTH : SLIDE_DESIGN_WIDTH;

  const maxDesignHeight = React.useMemo(() => {
    const hs = Object.values(measurementsRef.current);
    return hs.length ? Math.max(...hs) : 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measureVersion]);

  const scale = React.useMemo(() => {
    if (!viewport.w || !viewport.h || !maxDesignHeight) return 1;
    return Math.min(viewport.w / designWidth, viewport.h / maxDesignHeight);
  }, [viewport, designWidth, maxDesignHeight]);

  /* ─── Скролл: вертикаль двигает трек влево ─── */
  React.useEffect(() => {
    const handleScroll = () => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const scrollableHeight = rect.height - window.innerHeight;
      if (scrollableHeight <= 0) return;
      const scrollProgress = Math.max(0, Math.min(1, -rect.top / scrollableHeight));
      setProgress(scrollProgress);
      // Каждый слайд шириной viewport. Сдвигаем на (total-1) * viewport.
      const maxTranslate = (total - 1) * rect.width;
      // progress 0 → -maxTranslate (трек сдвинут влево, виден первый слайд)
      // progress 1 → 0 (трек на месте, виден последний слайд)
      // Трек ползёт вправо, слайды выезжают влево.
      setTranslateX((scrollProgress - 1) * maxTranslate);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [total]);

  return (
    <section
      ref={containerRef}
      id="usecases"
      className="relative"
      style={{ height: `calc(100svh * ${total})` }}
      aria-roledescription="carousel"
      aria-label={tr("Сценарии использования", "Use cases")}
    >
      <div className="sticky top-0 h-[100svh] overflow-hidden flex flex-col pt-14 md:pt-0">
        <div className="relative flex-1 w-full overflow-hidden">
          <div
            ref={trackRef}
            className="flex h-full will-change-transform"
            style={{
              transform: `translateX(${translateX}px)`,
              width: `${total * 100}%`,
            }}
          >
            {USE_CASE_SLIDES.map((slide, i) => (
              <div
                key={slide.id}
                className="h-full shrink-0"
                style={{ width: `${100 / total}%` }}
              >
                <ScaledSlide
                  scale={scale}
                  designWidth={designWidth}
                  onMeasured={measuredCallbacks[i]}
                >
                  {slide.render(mobile)}
                </ScaledSlide>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const DesktopAgentVideoSection: React.FC = () => {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const timeoutRef = React.useRef<number | null>(null);
  const [showComingSoon, setShowComingSoon] = React.useState(false);

  // Процент затухания на каждой стороне
  const FADE = 12;
  const vMask = `linear-gradient(to bottom, transparent 0%, black ${FADE}%, black ${100 - FADE}%, transparent 100%)`;
  const hMask = `linear-gradient(to right, transparent 0%, black ${FADE}%, black ${100 - FADE}%, transparent 100%)`;
  const combinedMask = `${vMask}, ${hMask}`;

  const handleEnded = () => {
    setShowComingSoon(true);
    // Через 3 секунды — убрать оверлей, отмотать в начало и запустить заново
    timeoutRef.current = window.setTimeout(() => {
      setShowComingSoon(false);
      const v = videoRef.current;
      if (v) {
        v.currentTime = 0;
        v.play().catch(() => {});
      }
    }, 3000);
  };

  // Чистим таймаут, если компонент размонтируется
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <section className="relative py-16 md:py-24 px-4 md:px-6 bg-gray-50 dark:bg-gray-900/50">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 md:mb-12 text-center">
          <Badge className="text-eyebrow mb-3">
            {tr("Парсинг документов", "Document parsing")}
          </Badge>
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight leading-[1.1] text-gray-900 dark:text-white max-w-3xl mx-auto">
            {tr(
              "Dayla может взять тяжёлую задачу и самостоятельно вести её дальше",
              "Dayla can take a project and run with it"
            )}
          </h2>
        </div>

        <div
          className="relative overflow-hidden bg-black"
          style={{
            WebkitMaskImage: combinedMask,
            WebkitMaskComposite: "source-in",
            maskImage: combinedMask,
            maskComposite: "intersect",
          }}
        >
          {/* Видео: loop убран, чтобы срабатывал onEnded */}
          <video
            ref={videoRef}
            className={cn(
              "block w-full h-auto scale-[1.2] origin-center transition-[filter,opacity] duration-700 ease-out",
              showComingSoon && "blur-xl opacity-60"
            )}
            autoPlay
            muted
            playsInline
            preload="auto"
            poster="/videos/DesktopAgent-poster.jpg"
            onEnded={handleEnded}
          >
            <source src="/videos/DesktopAgent.mp4" type="video/mp4" />
            <source src="/videos/DesktopAgent.mov" type="video/quicktime" />
            <img
              src="/videos/DesktopAgent-poster.jpg"
              alt={tr("Демонстрация Dayla", "Dayla demo")}
              className="block w-full h-auto"
            />
          </video>

          {/* Оверлей «Coming soon»: плавно проявляется и исчезает */}
          <div
            aria-hidden={!showComingSoon}
            className={cn(
              "absolute inset-0 z-10 flex items-center justify-center pointer-events-none",
              "transition-opacity duration-700 ease-out",
              showComingSoon ? "opacity-100" : "opacity-0"
            )}
          >
            {/* Мягкая подложка под текстом, чтобы читалось поверх любого кадра */}
            <div className="absolute inset-0 bg-black/30" />

            <div
              className={cn(
                "relative px-6 py-3 md:px-8 md:py-4 rounded-full",
                "backdrop-blur-md",
                "bg-white/10 dark:bg-white/[0.06]",
                "ring-1 ring-white/30",
                "shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.35)]",
                "text-white font-semibold tracking-widest uppercase",
                "text-sm md:text-base",
                // Небольшой подъём, чтобы появление было «аккуратным»
                "transition-transform duration-700 ease-out",
                showComingSoon ? "translate-y-0 scale-100" : "translate-y-1 scale-95"
              )}
            >
              Coming soon
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const SCREENSHOTS = [
  {
    id: "today",
    image: "/images/functional/today.png",
    scale: 1.0,
    title: "Передовой ИИ, на который можно положиться",
    description: "Все задачи, встречи и дедлайны собраны в одном месте. Dayla работает 24/7, чтобы вы не работали по вечерам.",
  },
  {
    id: "assistant",
    image: "/images/functional/assistant.png",
    scale: 0.8,
    title: "Всегда на связи — в чате или голосом",
    description: "Задавайте вопросы, развивайте идеи и делитесь обратной связью прямо в диалоге. Чем больше вы работаете вместе, тем лучше Dayla понимает ваши предпочтения и ход мыслей.",
  },
  {
    id: "thisweek",
    image: "/images/functional/thisweek.png",
    scale: 1.35,
    title: "Расширение ваших возможностей",
    description: "Когда Dayla знает ваши цели и требования, вы можете браться за большее, не руководя каждым шагом.",
  },
  {
    id: "anonymizeddata",
    image: "/images/functional/anonymizeddata.png",
    scale: 0.9,
    title: "Контроль всегда остаётся у вас",
    description: "Dayla использует механизмы защиты шифрования информации и меры конфиденциальности. Все данные обезличены.",
  },
];

/* ─── Настройки ─── */
// Halos
const HALO_SCALE_1 = 1.08;
const HALO_BLUR_1  = 8;
const HALO_SCALE_2 = 1.20;
const HALO_BLUR_2  = 24;
const HALO_SCALE_3 = 1.35;
const HALO_BLUR_3  = 48;

// ─── Liquid Glass подписи ───
// Карточка
// ─── Тень / градиент подписи ───
const TEXT_HALO_INSET          = "-inset-5";       // размер halo
const TEXT_HALO_BG_LIGHT       = "bg-gray-900/50"; // плотность тени
const TEXT_HALO_BG_DARK        = "dark:bg-black/70";
const TEXT_GLASS_LIGHT          = "bg-white/80";
const TEXT_GLASS_DARK           = "dark:bg-gray-900/70";

// Halo (мягкая тень-градиент вокруг карточки)
const TEXT_HALO_BLUR            = "blur-md";             // ← БЛЮР САМОЙ ТЕНИ

// Внешняя тень карточки — сделал менее резкой (было rgba(15,23,42,1) — полностью чёрная)
const TEXT_CARD_SHADOW          = "inset 0 1px 0 rgba(255,255,255,0.6), 0 2px 8px rgba(15,23,42,0.25)";

// Размер скриншотов (база для scale = 1.0)
const SCREENSHOT_BASE_MAX_VW = 53;   // было 80 / 1.5
const SCREENSHOT_BASE_MAX_VH = 53;   // было 80 / 1.5
const SCREENSHOT_BASE_MAX_VW_MOBILE = 36;   // ← новая
const SCREENSHOT_BASE_MAX_VH_MOBILE = 36;

// Motion
const OPACITY_FALLOFF_ENTER = 2.0;
const OPACITY_FALLOFF_EXIT  = 0.5;
const SLIDE_MAX_SCALE       = 2.0;
const SLIDE_TRANSITION_MS   = 300;
const SLIDE_PAUSE_RATIO     = 0.4;

// Text
const TEXT_TRANSITION_MS   = 300;
const TEXT_DELAY_MS        = 400;
const TEXT_VISIBLE_OFFSET  = 0.5;
// ─── Расширение текста при уходе ───
const TEXT_EXPAND_MAX    = 20;   // максимальный scale (условная «бесконечность»)
const TEXT_EXPAND_POWER  = 2;    // нелинейность: 1 = линейно, 2–3 = резкий «вылет»
const TEXT_FADE_START    = 0.05; // absOff, откуда начинается угасание
const TEXT_FADE_END      = 0.55; // absOff, где текст полностью прозрачен

// Lock
const LOCK_APPEAR_AT    = 0.9;   // secProgress, при котором замок монтируется (drop-анимация стартует)
const LOCK_BLUR_START   = 0.9;   // secProgress, при котором начинается blur скриншота
const LOCK_BLUR_MAX_PX  = 3;     // максимальная сила blur
const LOCK_SCALE_MIN    = 0.8;
const LOCK_SCALE_MAX    = 1.8;
const LOCK_BG_MIN       = 0.15;
const LOCK_BG_MAX       = 0.85;

function applyDwell(raw: number, total: number, dwellRatio: number): number {
  const segments = total - 1;
  if (segments <= 0) return 0;
  const perSeg = 1 / segments;
  const dwell  = perSeg * dwellRatio;
  const move   = perSeg - dwell;
  const c = Math.max(0, Math.min(1, raw));
  for (let i = 0; i < segments; i++) {
    const segStart = i * perSeg;
    if (c < segStart + dwell) return i;
    if (c < segStart + perSeg) return i + (c - segStart - dwell) / move;
  }
  return segments;
}

/* ─── Замок — отдельный компонент, чтобы управлять моментом монтирования ─── */
const SecurityLockOverlay: React.FC<{ secProgress: number }> = ({ secProgress }) => {
  // Монтируется только при достаточно видимом слайде.
  // Unmount при уходе → анимация replay при следующем подходе.
  if (secProgress < LOCK_APPEAR_AT) return null;

  const lockScale = LOCK_SCALE_MIN + secProgress * (LOCK_SCALE_MAX - LOCK_SCALE_MIN);
  const lockBg    = LOCK_BG_MIN    + secProgress * (LOCK_BG_MAX    - LOCK_BG_MIN);

  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
      role="img"
      aria-label="Данные защищены"
    >
      {/* drop-анимация на внешнем слое */}
      <div className="lock-enter">
        {/* непрерывный рост scale на внутреннем слое */}
        <div
          style={{
            transform: `scale(${lockScale})`,
            transition: `transform ${SLIDE_TRANSITION_MS}ms ease-out`,
            willChange: "transform",
          }}
        >
          <div
            className="lock-glow rounded-2xl md:rounded-3xl backdrop-blur-2xl ring-1 ring-white/50 dark:ring-white/20 p-4 md:p-5"
            style={{ backgroundColor: `rgba(255,255,255,${lockBg})` }}
          >
            <Lock
              className="w-8 h-8 md:w-10 md:h-10 text-blue-600 dark:text-blue-300"
              strokeWidth={2.5}
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const FeatureScreenshotsCarousel: React.FC = () => {
  const containerRef = React.useRef<HTMLElement>(null);
  const [rawProgress, setRawProgress] = React.useState(0);
  const total = SCREENSHOTS.length;

  React.useEffect(() => {
    const onScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const sh = rect.height - window.innerHeight;
      if (sh <= 0) return;
      setRawProgress(Math.max(0, Math.min(1, -rect.top / sh)));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const currentFloat = applyDwell(rawProgress, total, SLIDE_PAUSE_RATIO);

  return (
    <section
      ref={containerRef}
      className="relative bg-gray-50 dark:bg-gray-900/50"
      style={{ height: `calc(100svh * ${total})` }}
    >
      <style>{`
        @keyframes lock-drop {
          0%   { opacity: 0; transform: translateY(-48px) scale(0.4) rotate(-20deg); }
          60%  { opacity: 1; transform: translateY(4px) scale(1.12) rotate(6deg); }
          80%  { transform: translateY(-2px) scale(0.97) rotate(-2deg); }
          100% { opacity: 1; transform: translateY(0) scale(1) rotate(0); }
        }
        @keyframes lock-glow {
          0%, 100% { box-shadow: 0 8px 32px rgba(59,130,246,0.35), inset 0 1px 0 rgba(255,255,255,0.5); }
          50%      { box-shadow: 0 8px 52px rgba(59,130,246,0.75), inset 0 1px 0 rgba(255,255,255,0.5); }
        }
        .lock-enter { animation: lock-drop 0.9s cubic-bezier(0.34,1.56,0.64,1) both; }
        .lock-glow  { animation: lock-glow 2.5s ease-in-out 1s infinite; }
      `}</style>

      <div className="sticky top-0 h-[100svh] overflow-hidden flex flex-col pt-14 md:pt-0">
        <div className="shrink-0 relative z-30">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-b from-gray-50 via-gray-50/95 to-transparent dark:from-gray-950 dark:via-gray-950/95 dark:to-transparent pointer-events-none"
          />
          <div className="relative max-w-6xl w-full mx-auto px-4 md:px-6 pt-6 md:pt-10 pb-8">
            <Badge className="text-eyebrow mb-3">Интерфейс</Badge>
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-gray-900 dark:text-white">
              Как это работает
            </h2>
          </div>
        </div>

        <div className="relative flex-1">
          {SCREENSHOTS.map((item, i) => {
            const offset = i - currentFloat;
            const absOff = Math.abs(offset);
            const eased  = Math.pow(absOff, 1.2);

            const isLeaving = offset < 0;
            const falloff   = isLeaving ? OPACITY_FALLOFF_EXIT : OPACITY_FALLOFF_ENTER;
            const slideOpacity = Math.pow(Math.max(0, 1 - eased), falloff);
            const slideScale   = 1 + eased * (SLIDE_MAX_SCALE - 1);

            const isSecurity = item.id === "anonymizeddata";
            const secProgress = isSecurity ? Math.max(0, Math.min(1, 1 - absOff)) : 0;

            // Blur — только на самом скриншоте; замок всегда острый
            const lockBlurRaw = Math.max(
              0,
              (secProgress - LOCK_BLUR_START) / (1 - LOCK_BLUR_START)
            );
            const lockBlur = lockBlurRaw * LOCK_BLUR_MAX_PX;

            const isCurrent = absOff < TEXT_VISIBLE_OFFSET;

            // Размер скриншота: база × per-image scale (1.5× меньше исходного)
            const perScale = item.scale || 1;
            const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
            const baseVW = isMobile ? SCREENSHOT_BASE_MAX_VW_MOBILE : SCREENSHOT_BASE_MAX_VW;
            const baseVH = isMobile ? SCREENSHOT_BASE_MAX_VH_MOBILE : SCREENSHOT_BASE_MAX_VH;
            const imgMaxW = baseVW * perScale;
            const imgMaxH = baseVH * perScale;

            // Экспоненциальный рост scale при уходе от центра
            const textT = Math.max(0, Math.min(1, absOff / TEXT_FADE_END));
            const textScale = 1 + Math.pow(textT, TEXT_EXPAND_POWER) * (TEXT_EXPAND_MAX - 1);

            // Плавное утопание в alpha 0
            const textOpacity =
              absOff <= TEXT_FADE_START ? 1 :
              absOff >= TEXT_FADE_END   ? 0 :
              1 - (absOff - TEXT_FADE_START) / (TEXT_FADE_END - TEXT_FADE_START);

            return (
              <div
                key={item.id}
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  opacity: slideOpacity,
                  zIndex: Math.round(20 - eased * 20),
                  transform: `scale(${slideScale})`,
                  pointerEvents: isCurrent ? "auto" : "none",
                  willChange: "transform, opacity",
                  transition: `opacity ${SLIDE_TRANSITION_MS}ms ease-out`,
                }}
              >
                <div className="relative inline-block isolate">
                  {/* Halo 1 — плотное ядро, alpha ≈ 100% на краю */}
                  <img
                    src={item.image}
                    aria-hidden="true"
                    className="absolute inset-0 w-full h-full rounded-[24px] md:rounded-[32px] pointer-events-none select-none z-0"
                    style={{
                      transform: `scale(${HALO_SCALE_1})`,
                      filter: `blur(${HALO_BLUR_1}px) saturate(1.15)`,
                    }}
                  />
                  <img
                    src={item.image}
                    aria-hidden="true"
                    className="absolute inset-0 w-full h-full rounded-[24px] md:rounded-[32px] pointer-events-none select-none z-0"
                    style={{
                      transform: `scale(${HALO_SCALE_2})`,
                      filter: `blur(${HALO_BLUR_2}px) saturate(1.15)`,
                    }}
                  />
                  <img
                    src={item.image}
                    aria-hidden="true"
                    className="absolute inset-0 w-full h-full rounded-[24px] md:rounded-[32px] pointer-events-none select-none z-0"
                    style={{
                      transform: `scale(${HALO_SCALE_3})`,
                      filter: `blur(${HALO_BLUR_3}px) saturate(1.2)`,
                    }}
                  />

                  {/* Резкая картинка — задаёт размер обёртки.
                      Blur, если это скриншот безопасности и secProgress > LOCK_BLUR_START. */}
                  <div className="relative z-10 inline-block overflow-hidden rounded-[24px] md:rounded-[32px]">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="block select-none pointer-events-none"
                      style={{
                        maxWidth: `${imgMaxW}vw`,
                        maxHeight: `${imgMaxH}vh`,
                        width: "auto",
                        height: "auto",
                        filter: lockBlur > 0.5 ? `blur(${lockBlur}px)` : undefined,
                        transition: `filter ${SLIDE_TRANSITION_MS}ms ease-out`,
                      }}
                      loading="lazy"
                    />
                  </div>

                  {/* Замок — острый, z-20, монтируется при secProgress ≥ LOCK_APPEAR_AT */}
                  {isSecurity && <SecurityLockOverlay secProgress={secProgress} />}

                  {/* ─── Liquid Glass подпись: карточка не скейлится, текст скейлится ─── */}
<div
  className="absolute bottom-3 md:bottom-5 left-1/2 z-30 pointer-events-none"
  style={{
    width: "calc(100% - 1.5rem)",
    maxWidth: "calc(100% - 1.5rem)",
    transform: "translateX(-50%)",   // только центрирование, без scale
    opacity: textOpacity,
    willChange: "opacity",
  }}
>
  {/* Тень-градиент */}
  <div
    aria-hidden="true"
    className={`pointer-events-none absolute ${TEXT_HALO_INSET} rounded-2xl ${TEXT_HALO_BG_LIGHT} ${TEXT_HALO_BG_DARK} ${TEXT_HALO_BLUR}`}
  />

  {/* ─── Слой 1: стеклянная карточка (фон) — НЕ скейлится ─── */}
  <div
    className={`relative overflow-hidden rounded-xl ${TEXT_GLASS_LIGHT} ${TEXT_GLASS_DARK} backdrop-blur-2xl ring-1 ring-white/50 dark:ring-white/20`}
    style={{ boxShadow: TEXT_CARD_SHADOW }}
  >
    {/* Sheen */}
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 rounded-xl bg-[linear-gradient(135deg,rgba(255,255,255,0.15)_0%,rgba(255,255,255,0.03)_25%,transparent_45%,transparent_75%,rgba(147,197,253,0.08)_100%)]"
    />

    {/* Невидимый spacer — держит размер карточки по тексту, но сам текст не рендерит */}
    <div className="px-4 py-3 opacity-0 select-none" aria-hidden="true">
      <h3 className="text-sm md:text-base font-semibold mb-1 line-clamp-2">
        {item.title}
      </h3>
      <p className="text-xs md:text-sm leading-snug line-clamp-2">
        {item.description}
      </p>
    </div>
  </div>

  {/* ─── Слой 2: текст — СКЕЙЛИТСЯ независимо, вылетает из карточки ─── */}
  <div
    className="absolute inset-0 pointer-events-none"
    style={{
      transform: `scale(${textScale})`,
      transformOrigin: "center bottom",
      willChange: "transform",
    }}
  >
    <div className="px-4 py-3">
      <h3 className="text-sm md:text-base font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
        {item.title}
      </h3>
      <p className="text-xs md:text-sm text-gray-800 dark:text-gray-200 leading-snug line-clamp-2">
        {item.description}
      </p>
    </div>
  </div>
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