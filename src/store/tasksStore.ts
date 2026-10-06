import { create } from 'zustand';
import type { DaylaEvent } from '@/api/dayla';

interface TasksState {
  /** Растёт после каждого изменения задач — разделы перезагружают данные. */
  version: number;
  dialog: { open: boolean; event: DaylaEvent | null; date: string | null; untimed: boolean };
  changed: () => void;
  openNew: (date?: string | null, untimed?: boolean) => void;
  openEdit: (event: DaylaEvent) => void;
  close: () => void;
}

export const useTasksStore = create<TasksState>((set) => ({
  version: 0,
  dialog: { open: false, event: null, date: null, untimed: false },
  changed: () => set((state) => ({ version: state.version + 1 })),
  openNew: (date = null, untimed = false) => set({ dialog: { open: true, event: null, date, untimed } }),
  openEdit: (event) => set({ dialog: { open: true, event, date: null, untimed: false } }),
  close: () => set((state) => ({ dialog: { ...state.dialog, open: false } })),
}));
