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
import { Pencil, Target } from "lucide-react";
import type { ApiResponse, PaginatedResponse } from "@/types";

interface PlacementDrive {
  id: string;
  companyName: string;
  jobRole: string;
  jobDescription?: string;
  package?: number;
  location?: string;
  eligibilityCriteria?: string;
  applicationDeadline?: string;
  driveDate?: string;
  institutionId: string;
  createdAt: string;
}

export default function PlacementPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const institutionId = user?.institutionId;
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDrive, setEditDrive] = useState<PlacementDrive | null>(null);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [dialogError, setDialogError] = useState("");
  const limit = 20;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["placement-drives", institutionId, search, page],
    queryFn: async () => {
      if (!institutionId) return { items: [], total: 0, page: 1, limit: 20, pages: 0 };
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.set("status", search);
      const { data: res } = await apiClient.get<ApiResponse<PaginatedResponse<PlacementDrive>>>(
        `/institutions/${institutionId}/placement/drives?${params}`
      );
      return res.data;
    },
    enabled: !!institutionId,
  });

  const openCreate = () => { setEditDrive(null); setDialogError(""); setDialogOpen(true); };
  const openEdit = (drive: PlacementDrive) => { setEditDrive(drive); setDialogError(""); setDialogOpen(true); };

  const handleSubmit = useCallback(async (values: Record<string, any>) => {
    if (!institutionId) return;
    setDialogLoading(true);
    setDialogError("");
    try {
      if (editDrive) {
        await apiClient.put(`/institutions/${institutionId}/placement/drives/${editDrive.id}`, values);
        toast({ title: "Drive updated", variant: "success" });
      } else {
        await apiClient.post(`/institutions/${institutionId}/placement/drives`, values);
        toast({ title: "Drive created", variant: "success" });
      }
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["placement-drives"] });
    } catch (err: unknown) {
      setDialogError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Operation failed");
    } finally {
      setDialogLoading(false);
    }
  }, [institutionId, editDrive, queryClient, toast]);

  const fields: FormField[] = [
    { name: "companyName", label: "Company Name", required: true },
    { name: "jobRole", label: "Job Role", required: true },
    { name: "package", label: "Package (LPA)", type: "number" },
    { name: "location", label: "Location" },
    { name: "driveDate", label: "Drive Date", type: "date" },
    { name: "applicationDeadline", label: "Application Deadline", type: "date" },
    { name: "eligibilityCriteria", label: "Eligibility Criteria" },
    { name: "jobDescription", label: "Job Description" },
  ];

  const columns: Column<PlacementDrive>[] = [
    { key: "companyName", header: "Company", className: "font-medium" },
    { key: "jobRole", header: "Role" },
    { key: "package", header: "Package", cell: (d) => (d.package ? `₹${d.package} LPA` : "-") },
    { key: "location", header: "Location" },
    { key: "driveDate", header: "Drive Date", cell: (d) => d.driveDate ? new Date(d.driveDate).toLocaleDateString() : "-" },
    {
      key: "actions",
      header: "",
      cell: (d) => (
        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openEdit(d); }}>
          <Pencil className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader title="Placement & Career" description="Manage placement drives and student applications." />
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
          keyExtractor={(d) => d.id}
          emptyMessage="No placement drives found"
          emptyIcon={<Target className="h-12 w-12 text-muted-foreground" />}
          addButton={{ label: "Add Drive", onClick: openCreate }}
        />
        <FormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          title={editDrive ? "Edit Drive" : "Create Drive"}
          description={editDrive ? `Editing ${editDrive.companyName} - ${editDrive.jobRole}` : "Create a new placement drive."}
          fields={fields}
          onSubmit={handleSubmit}
          initialValues={editDrive ? {
            companyName: editDrive.companyName,
            jobRole: editDrive.jobRole,
            package: editDrive.package,
            location: editDrive.location,
            driveDate: editDrive.driveDate,
            applicationDeadline: editDrive.applicationDeadline,
            eligibilityCriteria: editDrive.eligibilityCriteria,
            jobDescription: editDrive.jobDescription,
          } : undefined}
          isLoading={dialogLoading}
          error={dialogError}
        />
      </div>
    </AppShell>
  );
}

