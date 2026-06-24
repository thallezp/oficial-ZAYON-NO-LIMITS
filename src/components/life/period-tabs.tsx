"use client";

import { cn } from "@/lib/utils/cn";
import { PERIODS, type Period } from "@/lib/utils/finance";

interface Props {
  value: Period;
  onChange: (p: Period) => void;
  className?: string;
}

/** Segmentado Dia / Semana / Mês para re-escopar as visões financeiras. */
export function PeriodTabs({ value, onChange, className }: Props) {
  return (
    <div className={cn("inline-flex rounded-lg border border-border/60 bg-card/60 p-0.5", className)}>
      {PERIODS.map((p) => (
        <button
          key={p.key}
          type="button"
          onClick={() => onChange(p.key)}
          className={cn(
            "rounded-md px-3 py-1 text-xs font-medium transition",
            value === p.key
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
