import { Skeleton } from '@/components/Skeleton';

export default function DraftLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Top bar skeleton */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 md:px-4 py-3 md:py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-4">
              <div>
                <Skeleton className="h-3 w-12 mb-1" />
                <Skeleton className="h-7 w-10" />
              </div>
              <Skeleton className="h-8 w-px" />
              <div>
                <Skeleton className="h-3 w-20 mb-1" />
                <Skeleton className="h-5 w-28" />
              </div>
            </div>
            <div className="min-w-[180px]">
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Content area: grid placeholder */}
      <div className="flex-1 p-4">
        <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-2 max-w-7xl mx-auto">
          {Array.from({ length: 20 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
