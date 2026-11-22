import { create } from "zustand";
import { api } from "../api/client";
import { tr } from "@/i18n";

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

export function UnreadAssistant() {
  const unread = useAssistantInbox((state) => state.unread);
  return unread > 0 ? <span role="status" aria-label={tr(`Непрочитанных сообщений от Дейлы: ${unread}`, `Unread messages from Deyla: ${unread}`)} className="relative inline-flex min-w-4 h-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-semibold text-white leading-none">{unread > 99 ? "99+" : unread}</span> : null;
}
