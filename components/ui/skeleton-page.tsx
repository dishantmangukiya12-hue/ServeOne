"use client";

export function PageSkeleton({ type = "default" }: { type?: "default" | "table" | "cards" | "list" }) {
  return (
    <div className="min-h-screen bg-background">
      <main className="p-4 md:p-6 animate-pulse">
        {/* Title */}
        <div className="h-7 w-48 bg-muted rounded-lg mb-6" />

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-card rounded-xl p-4 border">
              <div className="h-4 w-20 bg-muted rounded mb-2" />
              <div className="h-6 w-16 bg-muted rounded" />
            </div>
          ))}
        </div>

        {type === "table" && (
          <div className="bg-card rounded-xl border">
            {/* Table header */}
            <div className="flex gap-4 p-4 border-b">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-4 flex-1 bg-muted rounded" />
              ))}
            </div>
            {/* Table rows */}
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex gap-4 p-4 border-b last:border-0">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="h-4 flex-1 bg-muted/60 rounded" />
                ))}
              </div>
            ))}
          </div>
        )}

        {type === "cards" && (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="bg-card rounded-xl p-4 border h-24">
                <div className="h-5 w-8 bg-muted rounded mb-2" />
                <div className="h-3 w-16 bg-muted/60 rounded" />
              </div>
            ))}
          </div>
        )}

        {type === "list" && (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-card rounded-xl p-4 border flex gap-4">
                <div className="w-12 h-12 bg-muted rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-muted rounded" />
                  <div className="h-3 w-48 bg-muted/60 rounded" />
                </div>
                <div className="h-5 w-16 bg-muted rounded" />
              </div>
            ))}
          </div>
        )}

        {type === "default" && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-xl p-6 border">
                <div className="h-5 w-40 bg-muted rounded mb-4" />
                <div className="space-y-3">
                  <div className="h-4 w-full bg-muted/60 rounded" />
                  <div className="h-4 w-3/4 bg-muted/60 rounded" />
                  <div className="h-4 w-1/2 bg-muted/60 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
