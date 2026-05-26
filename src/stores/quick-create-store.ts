"use client";

import { create } from "zustand";

type Entity =
  | "task"
  | "document"
  | "content"
  | "lead"
  | "transaction"
  | "persona"
  | "flow"
  | "tool";

interface QuickCreateState {
  open: boolean;
  entity: Entity | null;
  setOpen: (open: boolean) => void;
  openWith: (entity: Entity) => void;
}

export const useQuickCreate = create<QuickCreateState>((set) => ({
  open: false,
  entity: null,
  setOpen: (open) => set({ open }),
  openWith: (entity) => set({ open: true, entity }),
}));
