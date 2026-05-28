"use client";

import { create } from "zustand";

export type QuickCreateEntity =
  | "task"
  | "subtask"
  | "document"
  | "content"
  | "lead"
  | "revenue"
  | "expense"
  | "persona"
  | "flow"
  | "tool"
  | "project"
  | "event"
  | "folder"
  | "promptChain"
  | "modelingProfile"
  | "invite";

export interface QuickCreateContext {
  parentTaskId?: string;
  projectId?: string;
  defaultChannel?: string;
  defaultContentType?: string;
}

interface QuickCreateState {
  open: boolean;
  entity: QuickCreateEntity | null;
  context: QuickCreateContext;
  setOpen: (open: boolean) => void;
  openWith: (entity: QuickCreateEntity, context?: QuickCreateContext) => void;
  close: () => void;
}

export const useQuickCreate = create<QuickCreateState>((set) => ({
  open: false,
  entity: null,
  context: {},
  setOpen: (open) => set({ open, ...(open ? {} : { context: {} }) }),
  openWith: (entity, context = {}) => set({ open: true, entity, context }),
  close: () => set({ open: false, context: {} }),
}));
