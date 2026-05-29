export default function FlowsLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-7 w-32 rounded-md bg-card/60 animate-pulse" />
        <div className="h-4 w-72 rounded-md bg-card/40 animate-pulse" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-32 rounded-xl border border-border/60 bg-card/40 animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}
