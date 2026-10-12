import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/utils/cn";
import { Icon } from "./icons";

/**
 * Hints on the first visit to the app: what each section is for and how to talk to the assistant.
 * Each step points at an element marked data-tour="<id>" — the sidebar on a desktop, the tab bar on a phone;
 * a step whose element is not on this screen is skipped. Seen once per user in this browser.
 */

type Step = { target?: string; title: string; text: string };

const STEPS: Step[] = [
  {
    title: "Добро пожаловать в Dayla",
    text: "За минуту покажу, что где. Подсказки можно пропустить и открыть снова в профиле.",
  },
  {
    target: "assistant",
    title: "Ассистент — главное",
    text: "Пишите как человеку: «созвон с Олей завтра в 15:00», «перенеси отчёт на пятницу», «напоминай пить воду каждые 2 часа», «что у меня на неделе?». Можно голосом или файлом PDF/DOCX.",
  },
  {
    target: "today",
    title: "Сегодня",
    text: "План на день: задачи по времени, отметка «выполнено» одним касанием и советы, как всё успеть.",
  },
  {
    target: "calendar",
    title: "Календарь",
    text: "Неделя и месяц целиком. Нажмите на день, чтобы посмотреть его или добавить задачу.",
  },
  {
    target: "tasks",
    title: "Задачи",
    text: "Все дела списком: теги, дедлайны, повторы. Просроченное видно сразу.",
  },
  {
    target: "new",
    title: "Новая задача",
    text: "Задачу можно добавить и вручную: дата, время, повтор, напоминание.",
  },
  {
    target: "dock",
    title: "Чат в любом разделе",
    text: "«Спросить Dayla» открывает ассистента поверх любой страницы.",
  },
  {
    target: "account",
    title: "Профиль и интеграции",
    text: "Подключите Telegram — туда приходят напоминания. В «Интеграциях» — Google, Яндекс, Notion, Jira и Samsung Calendar.",
  },
];

const KEY = "dayla.tour.v1";
const RESTART = "dayla:tour";
const GUTTER = 16;
const CARD_WIDTH = 340;
const PAD = 6;

const storageKey = (userId: number) => `${KEY}.${userId}`;

function seen(userId: number): boolean {
  try {
    return window.localStorage.getItem(storageKey(userId)) === "1";
  } catch {
    return false;
  }
}

function remember(userId: number) {
  try {
    window.localStorage.setItem(storageKey(userId), "1");
  } catch {
    // Without storage the hints may show again next time: harmless
  }
}

/** Show the hints again (the button in the profile). */
export function restartTour() {
  window.dispatchEvent(new Event(RESTART));
}

function visibleTarget(id: string | undefined): HTMLElement | null {
  if (!id) return null;
  for (const element of document.querySelectorAll<HTMLElement>(`[data-tour="${id}"]`)) {
    const rect = element.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) return element;
  }
  return null;
}

/** The steps that make sense on this screen: those without a target, and those whose target is visible. */
function available(): Step[] {
  return STEPS.filter((step) => !step.target || visibleTarget(step.target));
}

type Place = { spot: DOMRect | null; top: number; left: number; width: number };

function place(step: Step, cardHeight: number): Place {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = Math.min(CARD_WIDTH, vw - GUTTER * 2);
  const element = visibleTarget(step.target);
  if (!element) return { spot: null, top: Math.max(GUTTER, (vh - cardHeight) / 2), left: (vw - width) / 2, width };
  const spot = element.getBoundingClientRect();
  const clampLeft = (value: number) => Math.min(Math.max(GUTTER, value), vw - width - GUTTER);
  const clampTop = (value: number) => Math.min(Math.max(GUTTER, value), vh - cardHeight - GUTTER);
  // A sidebar item: the card to its right
  if (spot.right + PAD + 12 + width + GUTTER <= vw && spot.width < vw / 3) {
    return { spot, top: clampTop(spot.top + spot.height / 2 - cardHeight / 2), left: spot.right + PAD + 12, width };
  }
  // A tab bar item at the bottom: the card above it; otherwise below
  const below = spot.bottom + PAD + 12;
  const top = below + cardHeight + GUTTER <= vh ? below : spot.top - PAD - 12 - cardHeight;
  return { spot, top: clampTop(top), left: clampLeft(spot.left + spot.width / 2 - width / 2), width };
}

export function Tour({ userId }: { userId: number }) {
  const [steps, setSteps] = useState<Step[] | null>(null);
  const [index, setIndex] = useState(0);
  const [layout, setLayout] = useState<Place | null>(null);
  const card = useRef<HTMLDivElement>(null);
  const next = useRef<HTMLButtonElement>(null);

  const start = useCallback(() => {
    setIndex(0);
    setSteps(available());
  }, []);

  useEffect(() => {
    // After the first paint, so the navigation is there to point at
    const timer = !seen(userId) ? window.setTimeout(start, 600) : undefined;
    window.addEventListener(RESTART, start);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(RESTART, start);
    };
  }, [userId, start]);

  const step = steps?.[index];

  const finish = useCallback(() => {
    remember(userId);
    setSteps(null);
    setLayout(null);
  }, [userId]);

  useLayoutEffect(() => {
    if (!step) return;
    const update = () => setLayout(place(step, card.current?.offsetHeight ?? 200));
    update();
    // The card's height is known after it renders with the new text
    const frame = window.requestAnimationFrame(update);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [step]);

  useEffect(() => {
    if (!step) return;
    next.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") finish();
      if (event.key === "ArrowRight") setIndex((value) => Math.min(value + 1, (steps?.length ?? 1) - 1));
      if (event.key === "ArrowLeft") setIndex((value) => Math.max(value - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, steps, finish]);

  if (!steps || !step) return null;
  const last = index === steps.length - 1;
  const spot = layout?.spot;

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-labelledby="tour-title">
      {/* The dimmed page with a window around the element the step is about */}
      {spot ? (
        <div
          aria-hidden="true"
          className="fixed rounded-2xl ring-2 ring-sky-400 transition-all duration-300 pointer-events-none"
          style={{
            top: spot.top - PAD,
            left: spot.left - PAD,
            width: spot.width + PAD * 2,
            height: spot.height + PAD * 2,
            boxShadow: "0 0 0 9999px rgba(15,23,42,0.6)",
          }}
        />
      ) : (
        <div aria-hidden="true" className="fixed inset-0 bg-slate-900/60" />
      )}
      {/* Clicks outside the card do nothing: the hints end with their own buttons */}
      <div className="fixed inset-0" onClick={(event) => event.stopPropagation()} />

      <div
        ref={card}
        className={cn(
          "fixed rounded-2xl p-4 transition-[top,left] duration-300",
          "bg-white dark:bg-gray-900 text-gray-900 dark:text-white",
          "ring-1 ring-black/5 dark:ring-white/10 shadow-[0_20px_60px_rgba(15,23,42,0.35)]"
        )}
        style={{ top: layout?.top ?? -9999, left: layout?.left ?? 0, width: layout?.width ?? CARD_WIDTH }}
      >
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-white bg-gradient-to-br from-sky-400 to-violet-500"
          >
            <Icon name="assistant" size={16} />
          </span>
          <div className="min-w-0">
            <p id="tour-title" className="font-semibold leading-snug">
              {step.title}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-gray-600 dark:text-gray-300">{step.text}</p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <span className="text-xs tabular-nums text-gray-500 dark:text-gray-400" aria-label={`Подсказка ${index + 1} из ${steps.length}`}>
            {index + 1} / {steps.length}
          </span>
          <span className="ml-auto flex items-center gap-1.5">
            {!last && (
              <button
                type="button"
                onClick={finish}
                className="h-9 px-3 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-500/10"
              >
                Пропустить
              </button>
            )}
            {index > 0 && (
              <button
                type="button"
                onClick={() => setIndex(index - 1)}
                aria-label="Назад"
                className="h-9 w-9 inline-flex items-center justify-center rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-500/10"
              >
                <Icon name="left" size={16} />
              </button>
            )}
            <button
              ref={next}
              type="button"
              onClick={() => (last ? finish() : setIndex(index + 1))}
              className="h-9 px-4 rounded-xl text-sm font-medium text-white bg-gradient-to-br from-sky-500 to-violet-500 hover:brightness-105"
            >
              {last ? "Начать" : "Далее"}
            </button>
          </span>
        </div>
      </div>
    </div>
  );
}
