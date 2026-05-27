"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Workspace, User } from "@/types";

interface WorkspaceState {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  user: User | null;
  setActiveWorkspace: (id: string) => void;
  setUser: (user: User | null) => void;
  bootstrap: (data: { workspaces: Workspace[]; user: User }) => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      workspaces: [],
      activeWorkspaceId: null,
      user: null,
      setActiveWorkspace: (id) => set({ activeWorkspaceId: id }),
      setUser: (user) => set({ user }),
      bootstrap: ({ workspaces, user }) =>
        set((state) => {
          // CRÍTICO: valida que o ID persistido ainda existe nos workspaces carregados.
          // Sem essa checagem, um ID mock antigo (ex: 'ws_nexus') persiste no localStorage
          // e todas as queries batem em workspace inexistente → retornam vazio.
          const persistedIsValid =
            state.activeWorkspaceId !== null &&
            workspaces.some((w) => w.id === state.activeWorkspaceId);
          return {
            workspaces,
            user,
            activeWorkspaceId: persistedIsValid
              ? state.activeWorkspaceId
              : workspaces[0]?.id ?? null,
          };
        }),
    }),
    {
      name: "zayon.workspace",
      // bump da versão zera o persist quando user voltar (limpa IDs mock antigos)
      version: 2,
      partialize: (state) => ({ activeWorkspaceId: state.activeWorkspaceId }),
      migrate: (persisted: any, fromVersion) => {
        // qualquer versão anterior: descarta o activeWorkspaceId antigo.
        // Bootstrap vai preencher com o ID real do banco.
        if (fromVersion < 2) {
          return { activeWorkspaceId: null };
        }
        return persisted;
      },
    },
  ),
);
