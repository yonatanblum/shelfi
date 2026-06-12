import type { ShelfAnalysisRecord } from "@/lib/types/shelf-analysis";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPrice } from "@/lib/formatters";

type ShelfItemsTableProps = {
  analysis: ShelfAnalysisRecord;
  emptyMessage?: string;
};

function flattenItems(analysis: ShelfAnalysisRecord) {
  return analysis.shelves.flatMap((shelf) =>
    shelf.items.map((item) => ({
      ...item,
      shelfLevel: shelf.shelfLevel,
      positionDescription: shelf.positionDescription,
    })),
  );
}

export function ShelfItemsTable({
  analysis,
  emptyMessage = "No items detected in this analysis.",
}: ShelfItemsTableProps) {
  const items = flattenItems(analysis);

  return (
    <Card className="brutal-card rounded-md ring-0">
      <CardHeader>
        <CardTitle className="text-lg font-bold">All Detected Items</CardTitle>
        <CardDescription>
          Flat inventory view across all shelf levels with compliance flags.
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {items.length === 0 ? (
          <div className="rounded-md border-2 border-dashed border-foreground bg-muted px-6 py-10 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-foreground hover:bg-transparent">
                <TableHead>Shelf</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Variant</TableHead>
                <TableHead>Facings</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Flags</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id} className="border-foreground">
                  <TableCell>
                    <div>
                      <p className="font-semibold">L{item.shelfLevel}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.positionDescription}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{item.itemId}</TableCell>
                  <TableCell className="font-semibold">{item.brand}</TableCell>
                  <TableCell>{item.productName}</TableCell>
                  <TableCell className="max-w-48 text-sm text-muted-foreground">
                    {item.packagingVariant}
                  </TableCell>
                  <TableCell>{item.visibleFacings}</TableCell>
                  <TableCell>
                    {item.priceTagDetected
                      ? formatPrice(item.priceAmount, item.priceCurrency ?? "USD")
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
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
                        {item.priceTagDetected ? "Tag" : "No tag"}
                      </Badge>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
