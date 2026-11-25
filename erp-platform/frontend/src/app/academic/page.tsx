"use client";

import { useState, useCallback } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { FormDialog, FormField } from "@/components/ui/form-dialog";
import { useToast } from "@/lib/hooks";
import { formatDate } from "@/lib/utils";
import { BookOpen, Building2, GraduationCap, Pencil, Plus } from "lucide-react";
import type { AcademicYear, Department, Class, ApiResponse } from "@/types";

function SectionCard({ title, icon, count, description }: { title: string; icon: React.ReactNode; count: number; description: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-8 w-8 rounded-lg bg-primary/10 p-1.5 text-primary">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{count}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

export default function AcademicPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const institutionId = user?.institutionId;

  // Dialog state
  const [dialogConfig, setDialogConfig] = useState<{
    open: boolean;
    type: "year" | "department" | "class" | "section" | "subject";
    editItem: any | null;
  }>({ open: false, type: "year", editItem: null });
  const [dialogLoading, setDialogLoading] = useState(false);
  const [dialogError, setDialogError] = useState("");

  const { data: years, isLoading: yearsLoading } = useQuery({
    queryKey: ["academic-years", institutionId],
    queryFn: async () => {
      if (!institutionId) return [];
      const { data: res } = await apiClient.get<ApiResponse<AcademicYear[]>>(
        `/institutions/${institutionId}/academic-years`
      );
      return res.data;
    },
    enabled: !!institutionId,
  });

  const { data: departments, isLoading: deptLoading } = useQuery({
    queryKey: ["departments", institutionId],
    queryFn: async () => {
      if (!institutionId) return [];
      const { data: res } = await apiClient.get<ApiResponse<Department[]>>(
        `/institutions/${institutionId}/departments`
      );
      return res.data;
    },
    enabled: !!institutionId,
  });

  const { data: classes, isLoading: classesLoading } = useQuery({
    queryKey: ["classes", institutionId],
    queryFn: async () => {
      if (!institutionId) return [];
      const { data: res } = await apiClient.get<ApiResponse<Class[]>>(
        `/institutions/${institutionId}/classes`
      );
      return res.data;
    },
    enabled: !!institutionId,
  });

  const openDialog = (type: "year" | "department" | "class" | "section" | "subject", editItem?: any) => {
    setDialogConfig({ open: true, type, editItem: editItem || null });
    setDialogError("");
  };

  const handleSubmit = useCallback(async (values: Record<string, any>) => {
    if (!institutionId) return;
    setDialogLoading(true);
    setDialogError("");
    const { type, editItem } = dialogConfig;
    const endpoints: Record<string, string> = {
      year: "academic-years",
      department: "departments",
      class: "classes",
      section: "sections",
      subject: "subjects",
    };
    const endpoint = endpoints[type];
    try {
      if (editItem) {
        await apiClient.put(`/institutions/${institutionId}/${endpoint}/${editItem.id}`, values);
        toast({ title: `${type} updated`, variant: "success" });
      } else {
        await apiClient.post(`/institutions/${institutionId}/${endpoint}`, values);
        toast({ title: `${type} created`, variant: "success" });
      }
      setDialogConfig((prev) => ({ ...prev, open: false }));
      queryClient.invalidateQueries({ queryKey: ["academic-years"] });
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    } catch (err: unknown) {
      setDialogError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Operation failed");
    } finally {
      setDialogLoading(false);
    }
  }, [institutionId, dialogConfig, queryClient, toast]);

  const getFields = (): FormField[] => {
    const { type } = dialogConfig;
    switch (type) {
      case "year":
        return [
          { name: "name", label: "Year Name", placeholder: "e.g. 2024-2025", required: true },
          { name: "startDate", label: "Start Date", type: "date", required: true },
          { name: "endDate", label: "End Date", type: "date", required: true },
          { name: "isCurrent", label: "Is Current Year?", type: "select", options: [{ label: "Yes", value: "true" }, { label: "No", value: "false" }] },
        ];
      case "department":
        return [
          { name: "name", label: "Department Name", required: true },
          { name: "code", label: "Department Code", required: true },
          { name: "hodName", label: "HOD Name" },
          { name: "description", label: "Description" },
        ];
      case "class":
        return [
          { name: "className", label: "Class Name", placeholder: "e.g. B.Sc CS", required: true },
          { name: "classCode", label: "Class Code", required: true },
          { name: "semesterOrGrade", label: "Semester/Grade" },
          { name: "capacity", label: "Capacity", type: "number" },
          { name: "departmentId", label: "Department ID" },
          { name: "academicYearId", label: "Academic Year ID" },
        ];
      case "section":
        return [
          { name: "sectionName", label: "Section Name", required: true },
          { name: "roomNumber", label: "Room Number" },
          { name: "capacity", label: "Capacity", type: "number" },
          { name: "classId", label: "Class ID" },
        ];
      case "subject":
        return [
          { name: "subjectName", label: "Subject Name", required: true },
          { name: "subjectCode", label: "Subject Code", required: true },
          { name: "credits", label: "Credits", type: "number" },
          { name: "description", label: "Description" },
          { name: "departmentId", label: "Department ID" },
          { name: "classId", label: "Class ID" },
          { name: "academicYearId", label: "Academic Year ID" },
        ];
      default:
        return [];
    }
  };

  const getDialogTitle = () => {
    const { type, editItem } = dialogConfig;
    const labels: Record<string, string> = { year: "Academic Year", department: "Department", class: "Class", section: "Section", subject: "Subject" };
    return editItem ? `Edit ${labels[type]}` : `Create ${labels[type]}`;
  };

  if (!institutionId) {
    return (
      <AppShell>
        <div className="flex h-[50vh] items-center justify-center">
          <p className="text-muted-foreground">No institution selected.</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader title="Academic Management" description="Manage academic structure." />
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <SectionCard title="Academic Years" icon={<BookOpen className="h-4 w-4" />} count={years?.length || 0} description="Active academic years" />
          <SectionCard title="Departments" icon={<Building2 className="h-4 w-4" />} count={departments?.length || 0} description="Active departments" />
          <SectionCard title="Classes" icon={<GraduationCap className="h-4 w-4" />} count={classes?.length || 0} description="Active classes" />
        </div>

        <Tabs defaultValue="years" className="space-y-4">
          <TabsList>
            <TabsTrigger value="years">Academic Years</TabsTrigger>
            <TabsTrigger value="departments">Departments</TabsTrigger>
            <TabsTrigger value="classes">Classes</TabsTrigger>
          </TabsList>

          <TabsContent value="years" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Academic Years</CardTitle>
                  <Button size="sm" onClick={() => openDialog("year")}><Plus className="mr-2 h-4 w-4" /> Add Year</Button>
                </div>
              </CardHeader>
              <CardContent>
                {yearsLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {years?.map((year) => (
                      <div key={year.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <p className="font-medium">{year.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(year.startDate)} - {formatDate(year.endDate)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {year.isCurrent && <Badge variant="success">Current</Badge>}
                          <Badge variant={year.status === "active" ? "default" : "secondary"}>{year.status}</Badge>
                          <Button variant="ghost" size="icon" onClick={() => openDialog("year", year)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {(!years || years.length === 0) && (
                      <p className="py-8 text-center text-sm text-muted-foreground">No academic years found.</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="departments" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Departments</CardTitle>
                  <Button size="sm" onClick={() => openDialog("department")}><Plus className="mr-2 h-4 w-4" /> Add Department</Button>
                </div>
              </CardHeader>
              <CardContent>
                {deptLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {departments?.map((dept) => (
                      <div key={dept.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <p className="font-medium">{dept.name}</p>
                          <p className="text-sm text-muted-foreground">Code: {dept.code}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {dept.hodName && <span className="text-sm text-muted-foreground">HOD: {dept.hodName}</span>}
                          <Badge variant={dept.status === "active" ? "success" : "secondary"}>{dept.status}</Badge>
                          <Button variant="ghost" size="icon" onClick={() => openDialog("department", dept)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {(!departments || departments.length === 0) && (
                      <p className="py-8 text-center text-sm text-muted-foreground">No departments found.</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="classes" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Classes</CardTitle>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openDialog("section")}><Plus className="mr-2 h-4 w-4" /> Section</Button>
                    <Button size="sm" variant="outline" onClick={() => openDialog("subject")}><Plus className="mr-2 h-4 w-4" /> Subject</Button>
                    <Button size="sm" onClick={() => openDialog("class")}><Plus className="mr-2 h-4 w-4" /> Add Class</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {classesLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {classes?.map((cls) => (
                      <div key={cls.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <p className="font-medium">{cls.className}</p>
                          <p className="text-sm text-muted-foreground">Code: {cls.classCode} | {cls.semesterOrGrade}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {cls.capacity && <span className="text-sm text-muted-foreground">Cap: {cls.capacity}</span>}
                          <Badge variant={cls.status === "active" ? "success" : "secondary"}>{cls.status}</Badge>
                          <Button variant="ghost" size="icon" onClick={() => openDialog("class", cls)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {(!classes || classes.length === 0) && (
                      <p className="py-8 text-center text-sm text-muted-foreground">No classes found.</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <FormDialog
          open={dialogConfig.open}
          onOpenChange={(open) => setDialogConfig((prev) => ({ ...prev, open }))}
          title={getDialogTitle()}
          fields={getFields()}
          onSubmit={handleSubmit}
          initialValues={dialogConfig.editItem || undefined}
          isLoading={dialogLoading}
          error={dialogError}
        />
      </div>
    </AppShell>
  );
}
