"use client";

import * as React from "react";

type ShortcutHandler = (e: KeyboardEvent) => void;

interface ShortcutOptions {
  combo: string;
  handler: ShortcutHandler;
  enabled?: boolean;
  ignoreInputs?: boolean;
}

function normalize(combo: string): {
  key: string;
  meta: boolean;
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
} {
  const parts = combo.toLowerCase().split("+").map((p) => p.trim());
  return {
    key: parts[parts.length - 1],
    meta: parts.includes("cmd") || parts.includes("meta"),
    ctrl: parts.includes("ctrl") || parts.includes("control"),
    shift: parts.includes("shift"),
    alt: parts.includes("alt") || parts.includes("option"),
  };
}

export function useShortcut({
  combo,
  handler,
  enabled = true,
  ignoreInputs = true,
}: ShortcutOptions) {
  React.useEffect(() => {
    if (!enabled) return;
    const target = normalize(combo);
    const fn = (e: KeyboardEvent) => {
      if (ignoreInputs) {
        const tag = (e.target as HTMLElement)?.tagName;
        const isEditable = (e.target as HTMLElement)?.isContentEditable;
        if (tag === "INPUT" || tag === "TEXTAREA" || isEditable) return;
      }
      const matches =
        e.key.toLowerCase() === target.key &&
        e.shiftKey === target.shift &&
        e.altKey === target.alt &&
        (target.meta ? e.metaKey || e.ctrlKey : !e.metaKey) &&
        (target.ctrl ? e.ctrlKey || e.metaKey : true);
      if (matches) handler(e);
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [combo, handler, enabled, ignoreInputs]);
}
