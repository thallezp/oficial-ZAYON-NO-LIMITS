"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";

interface SessionsHeatmapProps {
  sessions: any[];
}

export function SessionsHeatmap({ sessions }: SessionsHeatmapProps) {
  // Map sessions to date string (YYYY-MM-DD) -> sum(actualMinutes)
  const minutesByDate = React.useMemo(() => {
    const map = new Map<string, number>();
    sessions.forEach((s) => {
      if (s.startedAt && s.actualMinutes && s.status === "completed") {
        const dateStr = new Date(s.startedAt).toLocaleDateString("en-CA"); // YYYY-MM-DD in local time
        map.set(dateStr, (map.get(dateStr) || 0) + s.actualMinutes);
      }
    });
    return map;
  }, [sessions]);

  // Generate 365 days of grid cells aligned to weeks
  const gridData = React.useMemo(() => {
    const cells: { date: Date; dateStr: string; minutes: number; intensity: number }[] = [];
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today

    // Align start to 365 days ago
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 364);
    // Align to Sunday/Monday of that week. Let's align to Monday (1 = Monday)
    const dayOfWeek = startDate.getDay();
    const distanceToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startDate.setDate(startDate.getDate() - distanceToMonday);

    const cursor = new Date(startDate);
    while (cursor <= today || cells.length % 7 !== 0) {
      const dateStr = cursor.toLocaleDateString("en-CA");
      const minutes = minutesByDate.get(dateStr) || 0;
      
      // Compute intensity level
      let intensity = 0;
      if (minutes > 0 && minutes <= 25) intensity = 1;
      else if (minutes > 25 && minutes <= 60) intensity = 2;
      else if (minutes > 60 && minutes <= 120) intensity = 3;
      else if (minutes > 120) intensity = 4;

      cells.push({
        date: new Date(cursor),
        dateStr,
        minutes,
        intensity,
      });

      cursor.setDate(cursor.getDate() + 1);
    }

    // Split cells into columns (weeks of 7 days)
    const weeks: typeof cells[] = [];
    for (let i = 0; i < cells.length; i += 7) {
      weeks.push(cells.slice(i, i + 7));
    }

    return weeks;
  }, [minutesByDate]);

  // Compute month labels at their first occurrences
  const monthLabels = React.useMemo(() => {
    const labels: { text: string; index: number }[] = [];
    let prevMonth = -1;

    gridData.forEach((week, weekIdx) => {
      const firstDayOfWeek = week[0].date;
      const currentMonth = firstDayOfWeek.getMonth();
      if (currentMonth !== prevMonth) {
        const label = firstDayOfWeek.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
        labels.push({ text: label, index: weekIdx });
        prevMonth = currentMonth;
      }
    });

    return labels;
  }, [gridData]);

  const intensityColors = [
    "bg-muted/30 border-muted-foreground/5 dark:bg-card/25 dark:border-border/30", // level 0
    "bg-success/20 border-success/10 text-success-foreground", // level 1
    "bg-success/40 border-success/20 text-success-foreground", // level 2
    "bg-success/70 border-success/30 text-success-foreground", // level 3
    "bg-success border-success/40 text-success-foreground", // level 4
  ];

  return (
    <div className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-3 shadow-sm select-none">
      <div className="flex justify-between items-center">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Consistência de Foco (Último Ano)
        </h4>
        <span className="text-[10px] text-muted-foreground font-medium">
          {sessions.filter(s => s.status === "completed").length} sessões concluídas
        </span>
      </div>

      <div className="overflow-x-auto no-scrollbar pt-2">
        <div className="flex min-w-[700px] flex-col space-y-1">
          {/* Month labels */}
          <div className="relative h-4 text-[9px] text-muted-foreground/85 font-medium ml-6">
            {monthLabels.map((lbl, idx) => (
              <span
                key={idx}
                className="absolute capitalize"
                style={{ left: `${lbl.index * 13}px` }}
              >
                {lbl.text}
              </span>
            ))}
          </div>

          <div className="flex gap-1">
            {/* Weekday indicators */}
            <div className="flex flex-col justify-around text-[8px] text-muted-foreground font-medium w-5 shrink-0 pr-1 h-[86px]">
              <span>Seg</span>
              <span>Qua</span>
              <span>Sex</span>
            </div>

            {/* Heatmap Grid */}
            <div className="flex gap-1">
              {gridData.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-1">
                  {week.map((cell) => (
                    <div
                      key={cell.dateStr}
                      className={cn(
                        "h-2.5 w-2.5 rounded-sm border transition-all cursor-pointer relative group",
                        intensityColors[cell.intensity]
                      )}
                    >
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex flex-col items-center z-20 pointer-events-none">
                        <div className="bg-popover text-popover-foreground border border-border/80 text-[9px] px-2 py-1 rounded shadow-lg whitespace-nowrap leading-tight">
                          <strong className="block text-[10px]">
                            {cell.minutes === 0 ? "Nenhum minuto" : `${cell.minutes} minutos`}
                          </strong>
                          <span className="text-muted-foreground">
                            {cell.date.toLocaleDateString("pt-BR", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        <div className="w-1.5 h-1.5 bg-popover border-r border-b border-border/80 rotate-45 -mt-1" />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grid Legend */}
      <div className="flex items-center justify-end gap-1.5 text-[9px] text-muted-foreground pt-1.5 border-t border-border/30">
        <span>Menos</span>
        <div className="h-2 w-2 rounded-sm bg-muted/30 border border-muted-foreground/5 dark:bg-card/25" />
        <div className="h-2 w-2 rounded-sm bg-success/20 border border-success/10" />
        <div className="h-2 w-2 rounded-sm bg-success/40 border border-success/20" />
        <div className="h-2 w-2 rounded-sm bg-success/70 border border-success/30" />
        <div className="h-2 w-2 rounded-sm bg-success border border-success/40" />
        <span>Mais</span>
      </div>
    </div>
  );
}
