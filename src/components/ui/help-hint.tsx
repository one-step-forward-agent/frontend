import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { tr } from "@/i18n";

/** Native popovers stay above clipped cards and modal dialogs, including on touch screens. */
export function HelpHint({ children, label }: { children: ReactNode; label: string }) {
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const popover = useRef<HTMLSpanElement>(null);
  const [position, setPosition] = useState({ left: 8, top: 8 });

  function positionHint() {
    const rect = trigger.current?.getBoundingClientRect();
    if (!rect) return;
    const width = Math.min(320, window.innerWidth - 16);
    setPosition({
      left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)),
      top: rect.bottom + 8 + (popover.current?.offsetHeight ?? 0) <= window.innerHeight - 8
        ? rect.bottom + 8
        : Math.max(8, rect.top - (popover.current?.offsetHeight ?? 0) - 8),
    });
  }

  useEffect(() => {
    const reposition = (event: Event) => {
      if (event.target instanceof Node && popover.current?.contains(event.target)) return;
      if (popover.current?.matches(":popover-open")) positionHint();
    };
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, []);

  return (
    <span className="inline-flex shrink-0 align-middle font-normal">
      <button
        ref={trigger}
        type="button"
        popoverTarget={id}
        aria-label={`${tr("Подсказка", "Help")}: ${label}`}
        aria-describedby={`${id}-text`}
        onClick={positionHint}
        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-gray-500/10 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:text-gray-400 dark:hover:text-white"
      >
        <span aria-hidden="true" className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-current text-[11px] font-semibold leading-none">?</span>
      </button>
      <span
        ref={popover}
        id={id}
        popover="auto"
        onToggle={event => { if (event.newState === "open") positionHint(); }}
        onClick={event => event.stopPropagation()}
        className="fixed m-0 w-80 max-w-[calc(100vw-1rem)] overflow-y-auto rounded-xl border border-gray-200 bg-white p-3 text-left text-sm font-normal leading-relaxed text-gray-700 shadow-lg dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
        style={{ ...position, maxHeight: "min(50dvh, 24rem)" }}
      >
        <span id={`${id}-text`}>{children}</span>
      </span>
    </span>
  );
}
