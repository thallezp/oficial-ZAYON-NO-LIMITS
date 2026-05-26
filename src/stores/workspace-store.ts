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
        set((state) => ({
          workspaces,
          user,
          activeWorkspaceId: state.activeWorkspaceId ?? workspaces[0]?.id ?? null,
        })),
    }),
    {
      name: "nexus.workspace",
      partialize: (state) => ({ activeWorkspaceId: state.activeWorkspaceId }),
    },
  ),
);
