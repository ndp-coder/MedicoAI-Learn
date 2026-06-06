import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function SkeletonStatsRow() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {[1, 2, 3, 4].map(i => (
        <Card key={i} className="border-none shadow-sm">
          <CardContent className="p-3 flex items-center gap-3">
            <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-3 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function SkeletonSubjectList() {
  return (
    <div className="space-y-2.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Card key={i} className="border-none shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-center gap-3 mb-2">
              <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-2.5 w-48" />
              </div>
              <Skeleton className="h-5 w-10 rounded-full" />
            </div>
            <Skeleton className="h-1.5 w-full rounded-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function SkeletonQuizCard() {
  return (
    <Card className="border-none shadow-sm">
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
