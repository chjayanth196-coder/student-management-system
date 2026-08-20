"use client";

import { useState, useCallback } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable, Column } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { FormDialog, FormField } from "@/components/ui/form-dialog";
import { useToast } from "@/lib/hooks";
import { Pencil, Bus } from "lucide-react";
import type { ApiResponse, PaginatedResponse } from "@/types";

interface TransportRoute {
  id: string;
  routeName: string;
  startPoint: string;
  endPoint: string;
  busNo?: string;
  driverName?: string;
  driverPhone?: string;
  pickupTime?: string;
  dropTime?: string;
  fee?: number;
  institutionId: string;
  createdAt: string;
}

export default function TransportPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const institutionId = user?.institutionId;
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRoute, setEditRoute] = useState<TransportRoute | null>(null);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [dialogError, setDialogError] = useState("");
  const limit = 20;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["transport-routes", institutionId, search, page],
    queryFn: async () => {
      if (!institutionId) return { items: [], total: 0, page: 1, limit: 20, pages: 0 };
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.set("search", search);
      const { data: res } = await apiClient.get<ApiResponse<PaginatedResponse<TransportRoute>>>(
        `/institutions/${institutionId}/transport/routes?${params}`
      );
      return res.data;
    },
    enabled: !!institutionId,
  });

  const openCreate = () => { setEditRoute(null); setDialogError(""); setDialogOpen(true); };
  const openEdit = (route: TransportRoute) => { setEditRoute(route); setDialogError(""); setDialogOpen(true); };

  const handleSubmit = useCallback(async (values: Record<string, any>) => {
    if (!institutionId) return;
    setDialogLoading(true);
    setDialogError("");
    try {
      if (editRoute) {
        await apiClient.put(`/institutions/${institutionId}/transport/routes/${editRoute.id}`, values);
        toast({ title: "Route updated", variant: "success" });
      } else {
        await apiClient.post(`/institutions/${institutionId}/transport/routes`, values);
        toast({ title: "Route created", variant: "success" });
      }
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["transport-routes"] });
    } catch (err: unknown) {
      setDialogError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Operation failed");
    } finally {
      setDialogLoading(false);
    }
  }, [institutionId, editRoute, queryClient, toast]);

  const fields: FormField[] = [
    { name: "routeName", label: "Route Name", placeholder: "Route 1 - North Campus", required: true },
    { name: "startPoint", label: "Start Point", required: true },
    { name: "endPoint", label: "End Point", required: true },
    { name: "busNo", label: "Bus Number" },
    { name: "driverName", label: "Driver Name" },
    { name: "driverPhone", label: "Driver Phone" },
    { name: "pickupTime", label: "Pickup Time", placeholder: "08:00 AM" },
    { name: "dropTime", label: "Drop Time", placeholder: "05:00 PM" },
    { name: "fee", label: "Monthly Fee", type: "number" },
  ];

  const columns: Column<TransportRoute>[] = [
    { key: "routeName", header: "Route", className: "font-medium" },
    { key: "startPoint", header: "Start" },
    { key: "endPoint", header: "End" },
    { key: "busNo", header: "Bus No" },
    { key: "driverName", header: "Driver" },
    { key: "pickupTime", header: "Pickup" },
    { key: "dropTime", header: "Drop" },
    { key: "fee", header: "Fee", cell: (r) => (r.fee ? `$${r.fee}` : "-") },
    {
      key: "actions",
      header: "",
      cell: (r) => (
        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openEdit(r); }}>
          <Pencil className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader title="Transport Management" description="Manage routes, bus passes and drivers." />
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
          keyExtractor={(r) => r.id}
          emptyMessage="No routes found"
          emptyIcon={<Bus className="h-12 w-12 text-muted-foreground" />}
          addButton={{ label: "Add Route", onClick: openCreate }}
        />
        <FormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          title={editRoute ? "Edit Route" : "Add Route"}
          description={editRoute ? `Editing ${editRoute.routeName}` : "Add a new transport route."}
          fields={fields}
          onSubmit={handleSubmit}
          initialValues={editRoute ? {
            routeName: editRoute.routeName,
            startPoint: editRoute.startPoint,
            endPoint: editRoute.endPoint,
            busNo: editRoute.busNo,
            driverName: editRoute.driverName,
            driverPhone: editRoute.driverPhone,
            pickupTime: editRoute.pickupTime,
            dropTime: editRoute.dropTime,
            fee: editRoute.fee,
          } : undefined}
          isLoading={dialogLoading}
          error={dialogError}
        />
      </div>
    </AppShell>
  );
}

