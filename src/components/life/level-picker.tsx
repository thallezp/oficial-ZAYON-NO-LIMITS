"use client";

import { cn } from "@/lib/utils/cn";

interface Props {
  value?: number | null;
  onChange: (v: number) => void;
  max?: number;
  className?: string;
}

/** Seletor de nível 1..max (energia, libido, qualidade etc.). */
export function LevelPicker({ value, onChange, max = 5, className }: Props) {
  return (
    <div className={cn("flex gap-1.5", className)}>
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={cn(
            "h-9 w-9 rounded-lg border text-sm font-semibold transition",
            (value ?? 0) >= n
              ? "border-primary bg-primary/15 text-primary"
              : "border-border/60 text-muted-foreground hover:bg-accent",
          )}
        >
          {n}
        </button>
      ))}
    </div>
  );
}
