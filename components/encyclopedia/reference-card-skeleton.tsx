export function ReferenceCardSkeleton() {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-5 animate-pulse flex flex-col justify-between space-y-4 min-h-[160px]">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="h-5 w-2/5 bg-muted/60 rounded" />
          <div className="h-5 w-16 bg-muted/40 rounded-full" />
        </div>
        <div className="h-3 w-1/4 bg-muted/40 rounded" />
      </div>
      <div className="space-y-1.5">
        <div className="h-3.5 w-full bg-muted/30 rounded" />
        <div className="h-3.5 w-4/5 bg-muted/30 rounded" />
      </div>
      <div className="flex items-center gap-2 pt-2 border-t border-border/40">
        <div className="h-4 w-12 bg-muted/40 rounded" />
        <div className="h-4 w-20 bg-muted/30 rounded" />
      </div>
    </div>
  );
}
