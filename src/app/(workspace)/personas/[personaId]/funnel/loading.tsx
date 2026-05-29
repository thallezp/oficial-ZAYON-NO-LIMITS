export default function FunnelLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-7 w-40 rounded-md bg-card/60 animate-pulse" />
        <div className="h-4 w-72 rounded-md bg-card/40 animate-pulse" />
      </div>
      <div className="h-24 rounded-2xl border border-border/60 bg-card/40 animate-pulse" />
      <div className="h-[720px] rounded-xl border border-border/60 bg-card/40 animate-pulse" />
    </div>
  );
}
