import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6 animate-fade-in">
      <header className="space-y-3 border-b border-border/60 pb-6">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-3 w-96" />
      </header>
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 md:col-span-3 space-y-1">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-8" />
          ))}
        </div>
        <div className="col-span-12 md:col-span-9 space-y-3">
          <Skeleton className="h-9 w-72" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {Array.from({ length: 15 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
