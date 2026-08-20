"use client";

import { useState, useCallback } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable, Column } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { FormDialog, FormField } from "@/components/ui/form-dialog";
import { useToast } from "@/lib/hooks";
import { Pencil, BookX } from "lucide-react";
import type { ApiResponse, PaginatedResponse } from "@/types";

interface LibraryBook {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  publisher?: string;
  category?: string;
  quantity: number;
  available: number;
  rackNo?: string;
  description?: string;
  institutionId: string;
  createdAt: string;
}

export default function LibraryPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const institutionId = user?.institutionId;
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editBook, setEditBook] = useState<LibraryBook | null>(null);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [dialogError, setDialogError] = useState("");
  const limit = 20;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["library-books", institutionId, search, page],
    queryFn: async () => {
      if (!institutionId) return { items: [], total: 0, page: 1, limit: 20, pages: 0 };
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.set("search", search);
      const { data: res } = await apiClient.get<ApiResponse<PaginatedResponse<LibraryBook>>>(
        `/institutions/${institutionId}/library/books?${params}`
      );
      return res.data;
    },
    enabled: !!institutionId,
  });

  const openCreate = () => { setEditBook(null); setDialogError(""); setDialogOpen(true); };
  const openEdit = (book: LibraryBook) => { setEditBook(book); setDialogError(""); setDialogOpen(true); };

  const handleSubmit = useCallback(async (values: Record<string, any>) => {
    if (!institutionId) return;
    setDialogLoading(true);
    setDialogError("");
    try {
      if (editBook) {
        await apiClient.put(`/institutions/${institutionId}/library/books/${editBook.id}`, values);
        toast({ title: "Book updated", variant: "success" });
      } else {
        await apiClient.post(`/institutions/${institutionId}/library/books`, values);
        toast({ title: "Book created", variant: "success" });
      }
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["library-books"] });
    } catch (err: unknown) {
      setDialogError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Operation failed");
    } finally {
      setDialogLoading(false);
    }
  }, [institutionId, editBook, queryClient, toast]);

  const fields: FormField[] = [
    { name: "title", label: "Title", required: true },
    { name: "author", label: "Author", required: true },
    { name: "isbn", label: "ISBN" },
    { name: "publisher", label: "Publisher" },
    { name: "category", label: "Category", type: "select", options: [
      { label: "Academic", value: "Academic" },
      { label: "Fiction", value: "Fiction" },
      { label: "Non-Fiction", value: "Non-Fiction" },
      { label: "Reference", value: "Reference" },
      { label: "Magazine", value: "Magazine" },
      { label: "Other", value: "Other" },
    ]},
    { name: "quantity", label: "Quantity", type: "number", min: 1 },
    { name: "rackNo", label: "Rack No" },
    { name: "description", label: "Description" },
  ];

  const columns: Column<LibraryBook>[] = [
    { key: "title", header: "Title", className: "font-medium" },
    { key: "author", header: "Author" },
    { key: "isbn", header: "ISBN" },
    { key: "category", header: "Category" },
    { key: "quantity", header: "Qty" },
    {
      key: "available",
      header: "Available",
      cell: (b) => (
        <Badge variant={b.available > 0 ? "success" : "destructive"}>
          {b.available}/{b.quantity}
        </Badge>
      ),
    },
    { key: "rackNo", header: "Rack" },
    {
      key: "actions",
      header: "",
      cell: (b) => (
        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openEdit(b); }}>
          <Pencil className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader title="Library Management" description="Manage books, catalog, and availability." />
        <DataTable
          columns={columns}
          data={data?.items || []}
          total={data?.total || 0}
          page={page}
          limit={limit}
          isLoading={isLoading}
          error={error?.message}
          searchValue={search}
          onSearchChange={(v) => { setSearch(v); setPage(1); }}
          onPageChange={setPage}
          onRefresh={() => refetch()}
          keyExtractor={(b) => b.id}
          emptyMessage="No books found"
          emptyIcon={<BookX className="h-12 w-12 text-muted-foreground" />}
          addButton={{ label: "Add Book", onClick: openCreate }}
        />
        <FormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          title={editBook ? "Edit Book" : "Add New Book"}
          description={editBook ? `Editing "${editBook.title}"` : "Add a new book to the library."}
          fields={fields}
          onSubmit={handleSubmit}
          initialValues={editBook ? {
            title: editBook.title,
            author: editBook.author,
            isbn: editBook.isbn,
            publisher: editBook.publisher,
            category: editBook.category,
            quantity: editBook.quantity,
            rackNo: editBook.rackNo,
            description: editBook.description,
          } : undefined}
          isLoading={dialogLoading}
          error={dialogError}
        />
      </div>
    </AppShell>
  );
}
