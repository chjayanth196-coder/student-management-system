"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Plus,
  FileDown,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  cell?: (item: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  total: number;
  page: number;
  limit: number;
  isLoading: boolean;
  error?: string | null;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onPageChange: (page: number) => void;
  onRefresh?: () => void;
  title?: string;
  description?: string;
  addButton?: {
    label: string;
    onClick: () => void;
  };
  exportButton?: {
    label: string;
    onClick: () => void;
  };
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
}

export function DataTable<T>({
  columns,
  data,
  total,
  page,
  limit,
  isLoading,
  error,
  searchPlaceholder = "Search...",
  searchValue,
  onSearchChange,
  onPageChange,
  onRefresh,
  title,
  description,
  addButton,
  exportButton,
  emptyMessage = "No data found",
  emptyIcon,
  keyExtractor,
  onRowClick,
}: DataTableProps<T>) {
  const totalPages = Math.ceil(total / limit);

  return (
    <Card>
      {(title || addButton || onSearchChange || onRefresh) && (
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {title && <CardTitle>{title}</CardTitle>}
              {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {onSearchChange && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={searchPlaceholder}
                    className="h-9 w-[200px] pl-9 lg:w-[300px]"
                    value={searchValue || ""}
                    onChange={(e) => onSearchChange(e.target.value)}
                  />
                </div>
              )}
              {onRefresh && (
                <Button variant="outline" size="icon" onClick={onRefresh}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
              {exportButton && (
                <Button variant="outline" size="sm" onClick={exportButton.onClick}>
                  <FileDown className="mr-2 h-4 w-4" />
                  {exportButton.label}
                </Button>
              )}
              {addButton && (
                <Button onClick={addButton.onClick}>
                  <Plus className="mr-2 h-4 w-4" />
                  {addButton.label}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      )}
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <p className="mt-4 text-lg font-medium text-destructive">Error</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            {onRefresh && (
              <Button variant="outline" className="mt-4" onClick={onRefresh}>
                Try Again
              </Button>
            )}
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            {emptyIcon || (
              <div className="rounded-full bg-muted p-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <p className="mt-4 text-lg font-medium">{emptyMessage}</p>
            <p className="text-sm text-muted-foreground">
              Try adjusting your search or filters.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((col) => (
                      <TableHead key={col.key} className={col.className}>
                        {col.header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((item) => (
                    <TableRow
                      key={keyExtractor(item)}
                      className={cn(onRowClick && "cursor-pointer hover:bg-muted/50")}
                      onClick={() => onRowClick?.(item)}
                    >
                      {columns.map((col) => {
                        const value = (item as Record<string, unknown>)[col.key];
                        return (
                          <TableCell key={col.key} className={col.className}>
                            {col.cell ? col.cell(item) : value !== null && value !== undefined ? String(value) : "-"}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t px-2 py-4">
                <p className="text-sm text-muted-foreground">
                  Showing {(page - 1) * limit + 1} to{" "}
                  {Math.min(page * limit, total)} of {total} results
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onPageChange(page - 1)}
                    disabled={page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onPageChange(page + 1)}
                    disabled={page >= totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

