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
import { formatDate } from "@/lib/utils";
import { Pencil } from "lucide-react";
import type { Staff, ApiResponse, PaginatedResponse } from "@/types";

export default function StaffPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const institutionId = user?.institutionId;
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editStaff, setEditStaff] = useState<Staff | null>(null);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [dialogError, setDialogError] = useState("");
  const limit = 20;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["staff", institutionId, search, page],
    queryFn: async () => {
      if (!institutionId) return { items: [], total: 0, page: 1, limit: 20, pages: 0 };
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.set("search", search);
      const { data: res } = await apiClient.get<ApiResponse<PaginatedResponse<Staff>>>(
        `/institutions/${institutionId}/staff?${params}`
      );
      return res.data;
    },
    enabled: !!institutionId,
  });

  const openCreate = () => {
    setEditStaff(null);
    setDialogError("");
    setDialogOpen(true);
  };

  const openEdit = (staff: Staff) => {
    setEditStaff(staff);
    setDialogError("");
    setDialogOpen(true);
  };

  const handleSubmit = useCallback(async (values: Record<string, any>) => {
    if (!institutionId) return;
    setDialogLoading(true);
    setDialogError("");
    try {
      if (editStaff) {
        await apiClient.put(`/institutions/${institutionId}/staff/${editStaff.id}`, values);
        toast({ title: "Staff updated", variant: "success" });
      } else {
        await apiClient.post(`/institutions/${institutionId}/staff`, values);
        toast({ title: "Staff created", variant: "success" });
      }
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    } catch (err: unknown) {
      setDialogError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Operation failed");
    } finally {
      setDialogLoading(false);
    }
  }, [institutionId, editStaff, queryClient, toast]);

  const fields: FormField[] = [
    { name: "firstName", label: "First Name", required: true },
    { name: "lastName", label: "Last Name", required: true },
    { name: "email", label: "Email", type: "email", required: true },
    { name: "password", label: "Password", type: "password", placeholder: editStaff ? "Leave blank to keep current" : "Min 8 characters", required: !editStaff, minLength: 8 },
    { name: "staffType", label: "Staff Type", type: "select", required: true, options: [
      { label: "Teaching", value: "teaching" },
      { label: "Non-Teaching", value: "non-teaching" },
      { label: "Admin", value: "admin" },
    ]},
    { name: "designation", label: "Designation" },
    { name: "phone", label: "Phone" },
    { name: "gender", label: "Gender", type: "select", options: [{ label: "Male", value: "Male" }, { label: "Female", value: "Female" }, { label: "Other", value: "Other" }] },
    { name: "dob", label: "Date of Birth", type: "date" },
    { name: "address", label: "Address" },
    { name: "qualification", label: "Qualification" },
    { name: "specialization", label: "Specialization" },
    { name: "joiningDate", label: "Joining Date", type: "date" },
    { name: "salary", label: "Salary", type: "number" },
  ];

  const columns: Column<Staff>[] = [
    { key: "employeeId", header: "Emp ID", className: "font-medium" },
    { key: "firstName", header: "First Name" },
    { key: "lastName", header: "Last Name" },
    { key: "email", header: "Email" },
    { key: "designation", header: "Designation" },
    { key: "staffType", header: "Type" },
    {
      key: "status",
      header: "Status",
      cell: (s) => (
        <Badge variant={s.status === "active" ? "success" : "secondary"}>
          {s.status}
        </Badge>
      ),
    },
    {
      key: "joiningDate",
      header: "Joined",
      cell: (s) => s.joiningDate ? formatDate(s.joiningDate) : "-",
    },
    {
      key: "actions",
      header: "Actions",
      cell: (s) => (
        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openEdit(s); }}>
          <Pencil className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader title="Staff" description="Manage all faculty and staff members." />
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
          keyExtractor={(s) => s.id}
          emptyMessage="No staff found"
          addButton={{ label: "Add Staff", onClick: openCreate }}
        />
        <FormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          title={editStaff ? "Edit Staff" : "Create Staff"}
          description={editStaff ? `Editing ${editStaff.firstName} ${editStaff.lastName}` : "Add a new staff member."}
          fields={fields}
          onSubmit={handleSubmit}
          initialValues={editStaff ? {
            firstName: editStaff.firstName,
            lastName: editStaff.lastName,
            email: editStaff.email,
            staffType: editStaff.staffType,
            designation: editStaff.designation,
            phone: editStaff.phone,
            gender: editStaff.gender,
            dob: editStaff.dob,
            address: editStaff.address,
            qualification: editStaff.qualification,
            specialization: editStaff.specialization,
            joiningDate: editStaff.joiningDate,
            salary: editStaff.salary,
          } : undefined}
          isLoading={dialogLoading}
          error={dialogError}
        />
      </div>
    </AppShell>
  );
}
