export default function Loading() {
  return (
    <main className="flex-1 w-full">
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
        {/* Breadcrumb skeleton */}
        <div className="flex items-center gap-2">
          <div className="h-4 w-10 rounded bg-white/8 animate-pulse" />
          <div className="h-4 w-2 rounded bg-white/8 animate-pulse" />
          <div className="h-4 w-24 rounded bg-white/8 animate-pulse" />
          <div className="h-4 w-2 rounded bg-white/8 animate-pulse" />
          <div className="h-4 w-32 rounded bg-white/8 animate-pulse" />
        </div>

        {/* Badge skeleton */}
        <div className="h-7 w-28 rounded-full bg-white/8 animate-pulse" />

        {/* Title skeleton */}
        <div className="space-y-3">
          <div className="h-10 w-3/4 rounded-lg bg-white/8 animate-pulse" />
          <div className="h-10 w-1/2 rounded-lg bg-white/8 animate-pulse" />
        </div>

        {/* Aliases skeleton */}
        <div className="flex gap-2">
          <div className="h-7 w-36 rounded bg-white/8 animate-pulse" />
          <div className="h-7 w-16 rounded-md bg-white/8 animate-pulse" />
          <div className="h-7 w-20 rounded-md bg-white/8 animate-pulse" />
        </div>

        <div className="h-px bg-white/8" />

        {/* Definition skeleton */}
        <div className="space-y-3">
          <div className="h-5 w-full rounded bg-white/8 animate-pulse" />
          <div className="h-5 w-full rounded bg-white/8 animate-pulse" />
          <div className="h-5 w-5/6 rounded bg-white/8 animate-pulse" />
          <div className="h-5 w-full rounded bg-white/8 animate-pulse" />
          <div className="h-5 w-3/4 rounded bg-white/8 animate-pulse" />
        </div>

        <div className="h-px bg-white/8" />

        {/* Related terms skeleton */}
        <div className="space-y-4">
          <div className="h-7 w-44 rounded-lg bg-white/8 animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl bg-[#1A1A24] border border-white/8 p-4 space-y-2"
              >
                <div className="flex justify-between gap-2">
                  <div className="h-4 w-32 rounded bg-white/8 animate-pulse" />
                  <div className="h-4 w-16 rounded-full bg-white/8 animate-pulse" />
                </div>
                <div className="h-3 w-full rounded bg-white/8 animate-pulse" />
                <div className="h-3 w-4/5 rounded bg-white/8 animate-pulse" />
                <div className="h-3 w-14 rounded bg-white/8 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
