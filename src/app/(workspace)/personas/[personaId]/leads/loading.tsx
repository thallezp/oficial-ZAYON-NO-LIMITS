import { TableSkeleton } from "@/components/ui/loading";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6 animate-fade-in">
      <Skeleton className="h-7 w-40" />
      <Skeleton className="h-32" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <TableSkeleton rows={8} />
    </div>
  );
}
