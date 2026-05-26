import { KanbanSkeleton } from "@/components/ui/loading";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6 animate-fade-in">
      <header className="space-y-3 border-b border-border/60 pb-6">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-3 w-80" />
      </header>
      <Skeleton className="h-9 w-72" />
      <KanbanSkeleton />
    </div>
  );
}
