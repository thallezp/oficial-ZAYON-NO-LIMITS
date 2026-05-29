export default function CalendarLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-7 w-40 rounded-md bg-card/60 animate-pulse" />
        <div className="h-4 w-72 rounded-md bg-card/40 animate-pulse" />
      </div>
      {/* Filter badges */}
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-6 w-20 rounded-full bg-card/40 animate-pulse"
          />
        ))}
      </div>
      {/* Tabs */}
      <div className="h-9 w-48 rounded-lg bg-card/40 animate-pulse" />
      {/* Calendar grid skeleton */}
      <div className="h-[680px] rounded-xl border border-border/60 bg-card/40 animate-pulse" />
    </div>
  );
}
