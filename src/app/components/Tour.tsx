import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/utils/cn";
import { Icon } from "./icons";
import { tr } from "@/i18n";

/**
 * Hints on the first visit to the app: what each section is for and how to talk to the assistant.
 * Each step points at an element marked data-tour="<id>" — the sidebar on a desktop, the tab bar on a phone;
 * a step whose element is not on this screen is skipped (or shown in the middle, if it is `always`).
 * Seen once per user in this browser. The awards have their own hints, shown the first time the level bar is.
 */

type Step = { target?: string; title: string; text: string; always?: boolean };
export type TourName = "main" | "rewards";

const STEPS: Step[] = [
  {
    title: tr("Добро пожаловать в Deyla", "Welcome to Deyla"),
    text: tr("За минуту покажу, что где. Подсказки можно пропустить и открыть снова в профиле.", "In a minute I'll show you what's where. You can skip the tips and open them again from your profile."),
  },
  {
    target: "assistant",
    title: tr("Ассистент — главное", "The assistant comes first"),
    text: tr(
      "Пишите как человеку: «созвон с Олей завтра в 15:00», «перенеси отчёт на пятницу», «напоминай пить воду каждые 2 часа», «что у меня на неделе?». Можно голосом или файлом PDF/DOCX.",
      "Write as you would to a person: “call with Olya tomorrow at 3 pm”, “move the report to Friday”, “remind me to drink water every 2 hours”, “what do I have this week?”. Voice and PDF/DOCX files work too."
    ),
  },
  {
    target: "today",
    title: tr("Сегодня", "Today"),
    text: tr("План на день: задачи по времени, отметка «выполнено» одним касанием и советы, как всё успеть.", "The plan for the day: your tasks hour by hour, progress and tips on getting it all done."),
  },
  {
    target: "calendar",
    title: tr("Календарь", "Calendar"),
    text: tr("Неделя и месяц целиком. Нажмите на день, чтобы посмотреть его или добавить задачу.", "The whole week and month. Tap a day to see it or add a task."),
  },
  {
    target: "tasks",
    title: tr("Задачи", "Tasks"),
    text: tr("Все дела списком: теги, дедлайны, повторы. Просроченное видно сразу.", "Everything as a list: tags, deadlines, repeats. Overdue items stand out."),
  },
  {
    target: "new",
    title: tr("Новая задача", "New task"),
    text: tr("Задачу можно добавить и вручную: дата, время, повтор, напоминание.", "You can also add a task by hand: date, time, repeat, reminder."),
  },
  {
    target: "dock",
    title: tr("Чат в любом разделе", "Chat from anywhere"),
    text: tr("«Спросить Deyla» открывает ассистента поверх любой страницы.", "“Ask Deyla” opens the assistant over any page."),
  },
  {
    target: "account",
    title: tr("Профиль и интеграции", "Profile and integrations"),
    text: tr("Подключите Telegram — туда приходят напоминания. В «Интеграциях» — Google, Яндекс, Apple и Samsung Calendar, Jira и Notion.", "Connect Telegram — reminders arrive there. Integrations has Google, Yandex, Apple and Samsung Calendar, Jira and Notion."),
  },
  // Temporarily off together with "Перенос из чатов с нейросетями" (Integrations.tsx)
  // {
  //   target: "account",
  //   title: tr("Перенесите чаты с нейросетями", "Bring over your AI chats"),
  //   text: tr(
  //     "Уже обсуждали цели и планы с ChatGPT, Claude или Gemini? В «Интеграциях» → «Перенос из чатов с нейросетями» пришлите ссылку на чат и напишите, что из него важно, — Deyla учтёт это при планировании.",
  //     "Already discussed your goals and plans with ChatGPT, Claude or Gemini? In Integrations → “Bring over chats with other AIs”, share the chat link and say what matters in it — Deyla will use it when planning."
  //   ),
  // },
];

const REWARD_STEPS: Step[] = [
  {
    title: tr("Награды за дела", "Rewards for getting things done"),
    text: tr("Выполняйте задачи — получайте очки, уровни и значки. Покажу за полминуты.", "Get things done to earn points, levels and badges. Here is how in half a minute."),
  },
  {
    target: "level",
    always: true,
    title: tr("Очки и уровни", "Points and levels"),
    text: tr(
      "10 очков за каждую выполненную задачу и 20 — за день, когда сделано всё. Серии в 3, 7, 14, 30 и 100 дней дают бонус. Сняли отметку — очки уходят.",
      "10 points for every task done and 20 for a day with everything done. Streaks of 3, 7, 14, 30 and 100 days give a bonus. Untick a task and its points go."
    ),
  },
  {
    target: "badges",
    always: true,
    title: tr("Значки по сферам жизни", "Badges for your life areas"),
    text: tr(
      "У каждой сферы из онбординга три значка: за 5, 25 и 100 задач. Ставьте тег сферы: «тренировка завтра #Спорт».",
      "Each life area from onboarding has three badges: for 5, 25 and 100 tasks. Add the area's tag: “workout tomorrow #Sport”."
    ),
  },
  {
    title: tr("Итоги в Telegram", "Results in Telegram"),
    text: tr("Вечером бот напишет, сколько очков вы получили за день и сколько осталось до уровня и значка.", "In the evening the bot tells you the day's points and how much is left to the next level and badge."),
  },
  {
    target: "account",
    title: tr("Всё в профиле", "All in your profile"),
    text: tr("Значки — в «Аккаунт → Награды». Там же награды можно выключить.", "Badges are in Account → Awards. You can turn the rewards off there too."),
  },
];

const TOURS: Record<TourName, Step[]> = { main: STEPS, rewards: REWARD_STEPS };
const KEYS: Record<TourName, string> = { main: "deyla.tour.v1", rewards: "deyla.tour.rewards.v1" };
const RESTART = "deyla:tour";
const GUTTER = 16;
const CARD_WIDTH = 340;
const PAD = 6;

const storageKey = (name: TourName, userId: number) => `${KEYS[name]}.${userId}`;

function seen(name: TourName, userId: number): boolean {
  try {
    return window.localStorage.getItem(storageKey(name, userId)) === "1";
  } catch {
    return false;
  }
}

function remember(name: TourName, userId: number) {
  try {
    window.localStorage.setItem(storageKey(name, userId), "1");
  } catch {
    // Without storage the hints may show again next time: harmless
  }
}

type Start = { name: TourName; once: boolean };

/** Show hints: again from a button (once = false), or the first time something appears (once = true). */
export function startTour(name: TourName, once = false) {
  window.dispatchEvent(new CustomEvent<Start>(RESTART, { detail: { name, once } }));
}

/** Show the hints again (the button in the profile). */
export function restartTour() {
  startTour("main");
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
function available(name: TourName): Step[] {
  return TOURS[name].filter((step) => !step.target || step.always || visibleTarget(step.target));
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
  const [tour, setTour] = useState<TourName>("main");
  const [steps, setSteps] = useState<Step[] | null>(null);
  const [index, setIndex] = useState(0);
  const [layout, setLayout] = useState<Place | null>(null);
  const card = useRef<HTMLDivElement>(null);
  const next = useRef<HTMLButtonElement>(null);
  const showing = useRef(false);

  const start = useCallback(
    (name: TourName, once = false) => {
      // First-time hints wait until the welcome ones are seen and never cut into hints on screen
      if (once && (seen(name, userId) || (name !== "main" && !seen("main", userId)) || showing.current)) return;
      showing.current = true;
      setTour(name);
      setIndex(0);
      setSteps(available(name));
    },
    [userId]
  );

  useEffect(() => {
    // After the first paint, so the navigation is there to point at
    const timer = window.setTimeout(() => start("main", true), 600);
    const onStart = (event: Event) => {
      const detail = (event as CustomEvent<Start>).detail;
      // First-time hints wait for the page to settle, so the element a step is about can be found
      window.setTimeout(() => start(detail?.name ?? "main", detail?.once ?? false), detail?.once ? 600 : 0);
    };
    window.addEventListener(RESTART, onStart);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(RESTART, onStart);
    };
  }, [start]);

  const step = steps?.[index];

  const finish = useCallback(() => {
    remember(tour, userId);
    showing.current = false;
    setSteps(null);
    setLayout(null);
  }, [tour, userId]);

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
            <Icon name={tour === "rewards" ? "star" : "assistant"} size={16} />
          </span>
          <div className="min-w-0">
            <p id="tour-title" className="font-semibold leading-snug">
              {step.title}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-gray-600 dark:text-gray-300">{step.text}</p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <span className="text-xs tabular-nums text-gray-500 dark:text-gray-400" aria-label={tr(`Подсказка ${index + 1} из ${steps.length}`, `Tip ${index + 1} of ${steps.length}`)}>
            {index + 1} / {steps.length}
          </span>
          <span className="ml-auto flex items-center gap-1.5">
            {!last && (
              <button
                type="button"
                onClick={finish}
                className="h-9 px-3 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-500/10"
              >
                {tr("Пропустить", "Skip")}
              </button>
            )}
            {index > 0 && (
              <button
                type="button"
                onClick={() => setIndex(index - 1)}
                aria-label={tr("Назад", "Back")}
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
              {last ? (tour === "main" ? tr("Начать", "Start") : tr("Понятно", "Got it")) : tr("Далее", "Next")}
            </button>
          </span>
        </div>
      </div>
    </div>
  );
}
