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
      theme: "dark",
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: "nexus.ui",
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
      }),
    },
  ),
);
