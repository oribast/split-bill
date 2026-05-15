export function Skeleton({ count = 1 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm animate-pulse"
        >
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-3" />
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full mb-2" />
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
        </div>
      ))}
    </div>
  );
}
