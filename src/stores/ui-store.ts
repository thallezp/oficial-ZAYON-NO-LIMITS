"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;
  aiPanelOpen: boolean;
  toggleAIPanel: () => void;
  setAIPanelOpen: (open: boolean) => void;
  /**
   * Prompt que deve ser enviado automaticamente pelo painel da IA
   * assim que ele monta. Usado pelo Command Menu para "chamar a IA"
   * com uma instrução pronta. O painel limpa o valor ao consumir.
   */
  pendingAIPrompt: string | null;
  setPendingAIPrompt: (prompt: string | null) => void;
  /**
   * Abre o painel da IA e injeta um prompt para envio automático.
   */
  triggerAIPrompt: (prompt: string) => void;
  theme: "dark" | "light";
  setTheme: (theme: "dark" | "light") => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      commandOpen: false,
      setCommandOpen: (open) => set({ commandOpen: open }),
      aiPanelOpen: false,
      toggleAIPanel: () =>
        set((state) => ({ aiPanelOpen: !state.aiPanelOpen })),
      setAIPanelOpen: (open) => set({ aiPanelOpen: open }),
      pendingAIPrompt: null,
      setPendingAIPrompt: (prompt) => set({ pendingAIPrompt: prompt }),
      triggerAIPrompt: (prompt) =>
        set({ aiPanelOpen: true, pendingAIPrompt: prompt }),
      theme: "dark",
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: "zayon.ui",
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
      }),
    },
  ),
);
