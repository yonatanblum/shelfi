import type { ShelfRecord } from "@/lib/types/shelf-analysis";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type ShelfBreakdownProps = {
  shelves: ShelfRecord[];
};

function zoneBadgeClass(zoneQuality: string): string {
  const normalized = zoneQuality.toLowerCase();

  if (normalized.includes("premium") || normalized.includes("high")) {
    return "bg-success text-success-foreground";
  }

  if (normalized.includes("medium")) {
    return "bg-secondary text-secondary-foreground";
  }

  return "bg-muted text-muted-foreground";
}

export function ShelfBreakdown({ shelves }: ShelfBreakdownProps) {
  return (
    <Card className="brutal-card rounded-md ring-0">
      <CardHeader>
        <CardTitle className="text-lg font-bold">Shelf-by-Shelf Breakdown</CardTitle>
        <CardDescription>
          Zone quality, facings, and compliance notes per shelf level.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {shelves.length === 0 ? (
          <div className="rounded-md border-2 border-dashed border-foreground bg-muted px-6 py-10 text-center text-sm text-muted-foreground">
            No shelf levels detected.
          </div>
        ) : (
          shelves.map((shelf) => (
            <div
              key={shelf.id}
              className="rounded-md border-2 border-foreground bg-card p-4 brutal-shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Level {shelf.shelfLevel}
                  </p>
                  <p className="mt-1 text-lg font-bold">{shelf.positionDescription}</p>
                </div>
                <Badge
                  className={`border-2 border-foreground ${zoneBadgeClass(shelf.zoneQuality)}`}
                >
                  {shelf.zoneQuality}
                </Badge>
              </div>

              <Separator className="my-4 bg-foreground" />

              <div className="space-y-3">
                {shelf.items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-md border border-foreground/20 bg-muted/40 px-3 py-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold">{item.productName}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.brand} · {item.itemId}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="border-foreground">
                          {item.visibleFacings} facings
                        </Badge>
                        {item.isStacked ? (
                          <Badge variant="outline" className="border-foreground">
                            Stacked
                          </Badge>
                        ) : null}
                        {item.isNested ? (
                          <Badge variant="outline" className="border-foreground">
                            Nested
                          </Badge>
                        ) : null}
                        <Badge
                          className={
                            item.priceTagDetected
                              ? "border-foreground bg-success text-success-foreground"
                              : "border-foreground bg-destructive text-white"
                          }
                        >
                          {item.priceTagDetected ? "Price tag OK" : "Missing tag"}
                        </Badge>
                      </div>
                    </div>
                    <p className="mt-2 text-sm">
                      <span className="font-medium">Variant:</span> {item.packagingVariant}
                    </p>
                    {item.visualNotes ? (
                      <p className="mt-1 text-sm text-muted-foreground">{item.visualNotes}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
