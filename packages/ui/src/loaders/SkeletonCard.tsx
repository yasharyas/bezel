export function SkeletonCard() {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden animate-pulse">
      <div className="aspect-square bg-muted" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-1/2" />
        <div className="flex items-center justify-between mt-3">
          <div className="h-5 bg-muted rounded w-12" />
          <div className="h-8 w-8 bg-muted rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex gap-3 p-3 bg-muted rounded-lg animate-pulse">
      <div className="w-16 h-16 rounded-lg bg-muted-foreground/10 shrink-0" />
      <div className="flex-1 space-y-2 py-1">
        <div className="h-4 bg-muted-foreground/10 rounded w-2/3" />
        <div className="h-3 bg-muted-foreground/10 rounded w-1/3" />
        <div className="h-4 bg-muted-foreground/10 rounded w-1/4" />
      </div>
    </div>
  );
}
