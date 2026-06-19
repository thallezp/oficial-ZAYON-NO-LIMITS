"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface TimerState {
  sessionId: string | null;
  startedAt: number | null;   // epoch ms
  baseSeconds: number;        // segundos já acumulados antes do último resume
  paused: boolean;
  technique: "pomodoro" | "deep_work" | "free";
  target: { trackId?: string; moduleId?: string; moduleItemId?: string; resourceId?: string; projectId?: string; taskId?: string } | null;
  libraryView: "grid" | "table";
  start: (sessionId: string, target: TimerState["target"], technique: TimerState["technique"]) => void;
  pause: (elapsed: number) => void;
  resume: () => void;
  stop: () => void;
  setLibraryView: (v: "grid" | "table") => void;
}

export const useStudyStore = create<TimerState>()(
  persist(
    (set) => ({
      sessionId: null, startedAt: null, baseSeconds: 0, paused: false,
      technique: "pomodoro", target: null, libraryView: "grid",
      start: (sessionId, target, technique) => set({ sessionId, target, technique, startedAt: Date.now(), baseSeconds: 0, paused: false }),
      pause: (elapsed) => set({ paused: true, baseSeconds: elapsed, startedAt: null }),
      resume: () => set({ paused: false, startedAt: Date.now() }),
      stop: () => set({ sessionId: null, startedAt: null, baseSeconds: 0, paused: false, target: null }),
      setLibraryView: (v) => set({ libraryView: v }),
    }),
    {
      name: "zayon.study",
      // Persiste o estado do timer (além da UI) para que a sessão continue
      // contando mesmo se o usuário fechar o navegador/sistema. O tempo decorrido
      // é recalculado a partir de `startedAt` (epoch ms), então o relógio de parede
      // segue correndo enquanto o app esteve fechado — só para quando alguém parar.
      partialize: (st) => ({
        libraryView: st.libraryView,
        sessionId: st.sessionId,
        startedAt: st.startedAt,
        baseSeconds: st.baseSeconds,
        paused: st.paused,
        technique: st.technique,
        target: st.target,
      }),
    },
  ),
);
