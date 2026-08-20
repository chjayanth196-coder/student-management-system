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
import { Pencil } from "lucide-react";
import type { Student, ApiResponse, PaginatedResponse } from "@/types";

export default function StudentsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const institutionId = user?.institutionId;
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [dialogError, setDialogError] = useState("");
  const limit = 20;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["students", institutionId, search, page],
    queryFn: async () => {
      if (!institutionId) return { items: [], total: 0, page: 1, limit: 20, pages: 0 };
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.set("search", search);
      const { data: res } = await apiClient.get<ApiResponse<PaginatedResponse<Student>>>(
        `/institutions/${institutionId}/students?${params}`
      );
      return res.data;
    },
    enabled: !!institutionId,
  });

  const openCreate = () => {
    setEditStudent(null);
    setDialogError("");
    setDialogOpen(true);
  };

  const openEdit = (student: Student) => {
    setEditStudent(student);
    setDialogError("");
    setDialogOpen(true);
  };

  const handleSubmit = useCallback(async (values: Record<string, any>) => {
    if (!institutionId) return;
    setDialogLoading(true);
    setDialogError("");
    try {
      if (editStudent) {
        await apiClient.put(`/institutions/${institutionId}/students/${editStudent.id}`, values);
        toast({ title: "Student updated", variant: "success" });
      } else {
        await apiClient.post(`/institutions/${institutionId}/students`, values);
        toast({ title: "Student created", variant: "success" });
      }
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["students"] });
    } catch (err: unknown) {
      setDialogError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Operation failed");
    } finally {
      setDialogLoading(false);
    }
  }, [institutionId, editStudent, queryClient, toast]);

  const fields: FormField[] = [
    { name: "name", label: "Full Name", placeholder: "John Doe", required: true },
    { name: "email", label: "Email", type: "email", placeholder: "student@example.com", required: true },
    { name: "password", label: "Password", type: "password", placeholder: editStudent ? "Leave blank to keep current" : "Min 8 characters", required: !editStudent, minLength: 8 },
    { name: "rollNo", label: "Roll No", placeholder: "S001" },
    { name: "enrollmentNo", label: "Enrollment No" },
    { name: "phone", label: "Phone", placeholder: "+91 9876543210" },
    { name: "gender", label: "Gender", type: "select", options: [{ label: "Male", value: "Male" }, { label: "Female", value: "Female" }, { label: "Other", value: "Other" }] },
    { name: "dob", label: "Date of Birth", type: "date" },
    { name: "address", label: "Address" },
    { name: "className", label: "Class" },
    { name: "section", label: "Section" },
    { name: "parentName", label: "Parent Name" },
    { name: "parentPhone", label: "Parent Phone" },
  ];

  const columns: Column<Student>[] = [
    { key: "rollNo", header: "Roll No", className: "font-medium" },
    { key: "name", header: "Name" },
    { key: "email", header: "Email" },
    { key: "className", header: "Class" },
    { key: "section", header: "Section" },
    {
      key: "isActive",
      header: "Status",
      cell: (s) => (
        <Badge variant={s.isActive ? "success" : "secondary"}>
          {s.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    { key: "parentName", header: "Parent" },
    { key: "parentPhone", header: "Parent Phone" },
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
        <PageHeader title="Students" description="Manage all enrolled students." />
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
          emptyMessage="No students found"
          addButton={{ label: "Add Student", onClick: openCreate }}
        />
        <FormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          title={editStudent ? "Edit Student" : "Create Student"}
          description={editStudent ? `Editing ${editStudent.name}` : "Add a new student to the institution."}
          fields={fields}
          onSubmit={handleSubmit}
          initialValues={editStudent ? {
            name: editStudent.name,
            email: editStudent.email,
            rollNo: editStudent.rollNo,
            enrollmentNo: editStudent.enrollmentNo,
            phone: editStudent.phone,
            gender: editStudent.gender,
            dob: editStudent.dob,
            address: editStudent.address,
            className: editStudent.className,
            section: editStudent.section,
            parentName: editStudent.parentName,
            parentPhone: editStudent.parentPhone,
          } : undefined}
          isLoading={dialogLoading}
          error={dialogError}
        />
      </div>
    </AppShell>
  );
}
