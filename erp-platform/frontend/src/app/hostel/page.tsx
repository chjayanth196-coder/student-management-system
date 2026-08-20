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
import { Pencil, BedDouble } from "lucide-react";
import type { ApiResponse, PaginatedResponse } from "@/types";

interface HostelRoom {
  id: string;
  hostelName: string;
  roomNo: string;
  roomType: string;
  capacity: number;
  occupied: number;
  rent: number;
  floor?: number;
  amenities?: string;
  institutionId: string;
  createdAt: string;
}

export default function HostelPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const institutionId = user?.institutionId;
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRoom, setEditRoom] = useState<HostelRoom | null>(null);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [dialogError, setDialogError] = useState("");
  const limit = 20;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["hostel-rooms", institutionId, search, page],
    queryFn: async () => {
      if (!institutionId) return { items: [], total: 0, page: 1, limit: 20, pages: 0 };
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.set("hostelName", search);
      const { data: res } = await apiClient.get<ApiResponse<PaginatedResponse<HostelRoom>>>(
        `/institutions/${institutionId}/hostel/rooms?${params}`
      );
      return res.data;
    },
    enabled: !!institutionId,
  });

  const openCreate = () => { setEditRoom(null); setDialogError(""); setDialogOpen(true); };
  const openEdit = (room: HostelRoom) => { setEditRoom(room); setDialogError(""); setDialogOpen(true); };

  const handleSubmit = useCallback(async (values: Record<string, any>) => {
    if (!institutionId) return;
    setDialogLoading(true);
    setDialogError("");
    try {
      if (editRoom) {
        await apiClient.put(`/institutions/${institutionId}/hostel/rooms/${editRoom.id}`, values);
        toast({ title: "Room updated", variant: "success" });
      } else {
        await apiClient.post(`/institutions/${institutionId}/hostel/rooms`, values);
        toast({ title: "Room created", variant: "success" });
      }
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["hostel-rooms"] });
    } catch (err: unknown) {
      setDialogError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Operation failed");
    } finally {
      setDialogLoading(false);
    }
  }, [institutionId, editRoom, queryClient, toast]);

  const fields: FormField[] = [
    { name: "hostelName", label: "Hostel Name", placeholder: "Boys Hostel A", required: true },
    { name: "roomNo", label: "Room Number", required: true },
    { name: "roomType", label: "Room Type", type: "select", required: true, options: [
      { label: "Single", value: "Single" },
      { label: "Double", value: "Double" },
      { label: "Triple", value: "Triple" },
      { label: "Dormitory", value: "Dormitory" },
    ]},
    { name: "capacity", label: "Capacity", type: "number", required: true, min: 1 },
    { name: "rent", label: "Rent / Month", type: "number", required: true, min: 0 },
    { name: "floor", label: "Floor", type: "number" },
    { name: "amenities", label: "Amenities" },
  ];

  const columns: Column<HostelRoom>[] = [
    { key: "hostelName", header: "Hostel", className: "font-medium" },
    { key: "roomNo", header: "Room" },
    { key: "roomType", header: "Type" },
    {
      key: "occupancy",
      header: "Occupancy",
      cell: (r) => (
        <Badge variant={r.occupied >= r.capacity ? "destructive" : r.occupied > 0 ? "warning" : "success"}>
          {r.occupied}/{r.capacity}
        </Badge>
      ),
    },
    { key: "rent", header: "Rent", cell: (r) => `$${r.rent}` },
    { key: "floor", header: "Floor" },
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
        <PageHeader title="Hostel Management" description="Manage rooms, allocations and hostel fees." />
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
          emptyMessage="No rooms found"
          emptyIcon={<BedDouble className="h-12 w-12 text-muted-foreground" />}
          addButton={{ label: "Add Room", onClick: openCreate }}
        />
        <FormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          title={editRoom ? "Edit Room" : "Add Room"}
          description={editRoom ? `Editing ${editRoom.hostelName} - ${editRoom.roomNo}` : "Add a new hostel room."}
          fields={fields}
          onSubmit={handleSubmit}
          initialValues={editRoom ? {
            hostelName: editRoom.hostelName,
            roomNo: editRoom.roomNo,
            roomType: editRoom.roomType,
            capacity: editRoom.capacity,
            rent: editRoom.rent,
            floor: editRoom.floor,
            amenities: editRoom.amenities,
          } : undefined}
          isLoading={dialogLoading}
          error={dialogError}
        />
      </div>
    </AppShell>
  );
}

