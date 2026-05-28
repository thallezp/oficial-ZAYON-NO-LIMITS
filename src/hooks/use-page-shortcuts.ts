"use client";

import { useShortcut } from "./use-shortcut";
import {
  useQuickCreate,
  type QuickCreateEntity,
  type QuickCreateContext,
} from "@/stores/quick-create-store";

/**
 * Registra `N` (e Shift+N) como atalho para abrir o Quick Create
 * com a entity específica desta aba.
 *
 * Uso:
 *   useNewEntityShortcut("task")
 *   useNewEntityShortcut("revenue")
 *   useNewEntityShortcut("content", { defaultChannel: "instagram" })
 */
export function useNewEntityShortcut(
  entity: QuickCreateEntity,
  context?: QuickCreateContext,
  enabled = true,
) {
  const openWith = useQuickCreate((s) => s.openWith);
  useShortcut({
    combo: "n",
    enabled,
    handler: (e) => {
      e.preventDefault();
      openWith(entity, context);
    },
  });
}
