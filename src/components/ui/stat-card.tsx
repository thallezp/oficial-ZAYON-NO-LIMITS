"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  delta?: number;
  deltaSuffix?: string;
  icon?: React.ReactNode;
  hint?: string;
  className?: string;
  accent?: "default" | "primary" | "success" | "warning" | "danger" | "info";
}

const accentMap = {
  default: "from-secondary/20 to-transparent",
  primary: "from-primary/20 to-transparent",
  success: "from-success/15 to-transparent",
  warning: "from-warning/15 to-transparent",
  danger: "from-destructive/15 to-transparent",
  info: "from-info/15 to-transparent",
} as const;

export function StatCard({
  label,
  value,
  delta,
  deltaSuffix = "vs período anterior",
  icon,
  hint,
  className,
  accent = "default",
}: StatCardProps) {
  const positive = (delta ?? 0) >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "relative overflow-hidden rounded-xl border border-border/60 bg-card p-5 group",
        className,
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-60 transition-opacity group-hover:opacity-100",
          accentMap[accent],
        )}
      />
      <div className="relative flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="text-2xl font-semibold tracking-tight num">{value}</p>
          {hint && (
            <p className="text-[11px] text-muted-foreground">{hint}</p>
          )}
        </div>
        {icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-card/80 text-muted-foreground">
            {icon}
          </div>
        )}
      </div>
      {delta !== undefined && (
        <div className="relative mt-4 flex items-center gap-1.5 text-xs">
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium",
              positive
                ? "bg-success/15 text-success"
                : "bg-destructive/15 text-destructive",
            )}
          >
            {positive ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {Math.abs(delta).toFixed(1)}%
          </span>
          <span className="text-muted-foreground">{deltaSuffix}</span>
        </div>
      )}
    </motion.div>
  );
}
