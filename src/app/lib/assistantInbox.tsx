import { create } from "zustand";
import { api } from "../api/client";
import { tr } from "@/i18n";
import { cn } from "@/utils/cn";

export const useAssistantInbox = create<{
  unread: number;
  setUnread: (unread: number) => void;
  refresh: () => Promise<void>;
}>((set) => ({
  unread: 0,
  setUnread: (unread) => set({ unread }),
  refresh: async () => {
    try { const { unread } = await api.assistant.inbox(0, false); set({ unread }); }
    catch { /* Keep the last known count across temporary network failures. */ }
  },
}));

export function UnreadAssistant({ corner = false }: { corner?: boolean }) {
  const unread = useAssistantInbox((state) => state.unread);
  if (unread <= 0) return null;
  return (
    <span
      role="status"
      aria-label={tr(`Непрочитанных сообщений от Дейлы: ${unread}`, `Unread messages from Deyla: ${unread}`)}
      className={cn(
        "pointer-events-none inline-flex shrink-0 items-center justify-center rounded-full",
        "bg-gradient-to-br from-sky-500 to-violet-500 text-white",
        "text-[10px] font-semibold leading-none tabular-nums",
        "ring-2 ring-white/90 dark:ring-gray-900/90 shadow-[0_2px_8px_rgba(99,102,241,0.25)]",
        corner ? "absolute -right-1.5 -top-1.5 h-[18px] min-w-[18px] px-1" : "h-5 min-w-5 px-1.5"
      )}
    >
      {unread > 99 ? "99+" : unread}
    </span>
  );
}
