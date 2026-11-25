"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { useToast } from "@/lib/hooks";
import { FormDialog, FormField } from "@/components/ui/form-dialog";
import { formatDate } from "@/lib/utils";
import { CalendarDays, Pencil, Trash2, Clock } from "lucide-react";
import type {
  AcademicYear,
  ApiResponse,
  Class,
  ExamSchedule,
  Subject,
} from "@/types";

const MANAGE_ROLES = ["SuperAdmin", "CollegeAdmin", "Principal", "HOD"];
const EXAM_TYPES = ["Internal", "MidSemester", "Semester", "Practical", "Assignment", "Quiz"];
const TERMS = ["Term 1", "Term 2", "Term 3", "Semester 1", "Semester 2", "Annual"];

export default function ExamsPage() {
  const { user } = useAuth();
  const institutionId = user?.institutionId;
  const canManage = !!user && MANAGE_ROLES.includes(user.role);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [classFilter, setClassFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editExam, setEditExam] = useState<ExamSchedule | null>(null);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [dialogError, setDialogError] = useState("");

  const { data: classes } = useQuery({
    queryKey: ["classes", institutionId],
    queryFn: async () => {
      if (!institutionId) return [] as Class[];
      const { data: res } = await apiClient.get<ApiResponse<Class[]>>(
        `/institutions/${institutionId}/classes`
      );
      return res.data;
    },
    enabled: !!institutionId,
  });

  const { data: subjects } = useQuery({
    queryKey: ["subjects", institutionId],
    queryFn: async () => {
      if (!institutionId) return [] as Subject[];
      const { data: res } = await apiClient.get<ApiResponse<Subject[]>>(
        `/institutions/${institutionId}/subjects`
      );
      return res.data;
    },
    enabled: !!institutionId,
  });

  const { data: years } = useQuery({
    queryKey: ["academic-years", institutionId],
    queryFn: async () => {
      if (!institutionId) return [] as AcademicYear[];
      const { data: res } = await apiClient.get<ApiResponse<AcademicYear[]>>(
        `/institutions/${institutionId}/academic-years`
      );
      return res.data;
    },
    enabled: !!institutionId,
  });

  const { data: exams, isLoading, error, refetch } = useQuery({
    queryKey: ["exams", institutionId, classFilter],
    queryFn: async () => {
      if (!institutionId) return [] as ExamSchedule[];
      const params = new URLSearchParams();
      if (classFilter) params.set("classId", classFilter);
      const qs = params.toString();
      const { data: res } = await apiClient.get<ApiResponse<ExamSchedule[]>>(
        `/institutions/${institutionId}/exams${qs ? `?${qs}` : ""}`
      );
      return res.data;
    },
    enabled: !!institutionId,
  });

  const classOptions = useMemo(
    () => (classes || []).map((c) => ({ label: c.className, value: c.id })),
    [classes]
  );
  const subjectOptions = useMemo(
    () =>
      (subjects || []).map((s) => ({
        label: `${s.subjectName} (${s.subjectCode})`,
        value: s.id,
      })),
    [subjects]
  );
  const yearOptions = useMemo(
    () => (years || []).map((y) => ({ label: y.name, value: y.id })),
    [years]
  );

  const openCreate = () => {
    setEditExam(null);
    setDialogError("");
    setDialogOpen(true);
  };
  const openEdit = (exam: ExamSchedule) => {
    setEditExam(exam);
    setDialogError("");
    setDialogOpen(true);
  };

  const handleSubmit = async (values: Record<string, any>) => {
    if (!institutionId) return;
    setDialogLoading(true);
    setDialogError("");
    try {
      const payload = {
        examName: values.examName,
        examType: values.examType,
        term: values.term,
        subjectId: values.subjectId,
        classId: values.classId,
        academicYearId: values.academicYearId,
        date: values.date,
        startTime: values.startTime,
        endTime: values.endTime,
        roomNumber: values.roomNumber || undefined,
        maxMarks: Number(values.maxMarks),
        description: values.description || undefined,
      };
      if (editExam) {
        await apiClient.put(`/institutions/${institutionId}/exams/${editExam.id}`, payload);
        toast({ title: "Exam updated", variant: "success" });
      } else {
        await apiClient.post(`/institutions/${institutionId}/exams`, payload);
        toast({ title: "Exam scheduled", variant: "success" });
      }
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["exams"] });
    } catch (err: unknown) {
      setDialogError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "Operation failed"
      );
    } finally {
      setDialogLoading(false);
    }
  };

  const handleDelete = async (exam: ExamSchedule) => {
    if (!institutionId) return;
    if (typeof window !== "undefined" && !window.confirm(`Delete "${exam.examName}"?`)) return;
    try {
      await apiClient.delete(`/institutions/${institutionId}/exams/${exam.id}`);
      toast({ title: "Exam deleted", variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["exams"] });
    } catch (err: unknown) {
      toast({
        title: "Failed to delete exam",
        description: (err as { response?: { data?: { message?: string } } })?.response?.data?.message,
        variant: "destructive",
      });
    }
  };

  const fields: FormField[] = [
    { name: "examName", label: "Exam Name", placeholder: "e.g. Mid Semester Exam", required: true },
    { name: "examType", label: "Exam Type", type: "select", required: true, options: EXAM_TYPES.map((t) => ({ label: t, value: t })) },
    { name: "term", label: "Term", type: "select", required: true, options: TERMS.map((t) => ({ label: t, value: t })) },
    { name: "classId", label: "Class", type: "select", required: true, options: classOptions },
    { name: "subjectId", label: "Subject", type: "select", required: true, options: subjectOptions },
    { name: "academicYearId", label: "Academic Year", type: "select", required: true, options: yearOptions },
    { name: "date", label: "Exam Date", type: "date", required: true },
    { name: "startTime", label: "Start Time", placeholder: "09:00", required: true },
    { name: "endTime", label: "End Time", placeholder: "12:00", required: true },
    { name: "roomNumber", label: "Room Number", placeholder: "e.g. 101" },
    { name: "maxMarks", label: "Max Marks", type: "number", required: true, min: 1 },
    { name: "description", label: "Description" },
  ];

  const initialValues = editExam
    ? {
        examName: editExam.examName,
        examType: editExam.examType,
        term: editExam.term,
        classId: editExam.classId,
        subjectId: editExam.subjectId,
        academicYearId: editExam.academicYearId,
        date: editExam.date ? editExam.date.slice(0, 10) : "",
        startTime: editExam.startTime,
        endTime: editExam.endTime,
        roomNumber: editExam.roomNumber,
        maxMarks: editExam.maxMarks,
        description: editExam.description,
      }
    : undefined;

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader title="Exam Planning" description="Schedule exams, assign rooms and review the exam calendar." />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="w-64">
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger><SelectValue placeholder="Filter by class" /></SelectTrigger>
              <SelectContent>
                {(classes || []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.className}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refetch()}>Refresh</Button>
            {canManage && <Button onClick={openCreate}>+ Schedule Exam</Button>}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Exam Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : error ? (
              <p className="py-8 text-center text-sm text-destructive">
                Failed to load exams. Please try again.
              </p>
            ) : exams && exams.length > 0 ? (
              <div className="space-y-2">
                {exams.map((exam) => (
                  <div key={exam.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 rounded-lg bg-primary/10 p-2 text-primary">
                        <CalendarDays className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">{exam.examName}</p>
                        <p className="text-sm text-muted-foreground">
                          {exam.class?.className || "Class"} · {exam.subject?.subjectName || "Subject"} ·{" "}
                          {exam.term} · {exam.examType}
                        </p>
                        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDate(exam.date)} · {exam.startTime} - {exam.endTime}
                          {exam.roomNumber ? ` · Room ${exam.roomNumber}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="info">Max {exam.maxMarks}</Badge>
                      {canManage && (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(exam)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(exam)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CalendarDays className="h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-lg font-medium">No exams scheduled</p>
                <p className="text-sm text-muted-foreground">
                  {canManage ? "Schedule an exam to get started." : "Exam dates will appear here."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {canManage && (
          <FormDialog
            key={editExam?.id || "new-exam"}
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            title={editExam ? "Edit Exam" : "Schedule Exam"}
            description={editExam ? `Editing ${editExam.examName}` : "Add a new exam to the calendar."}
            fields={fields}
            onSubmit={handleSubmit}
            initialValues={initialValues}
            isLoading={dialogLoading}
            error={dialogError}
            submitLabel={editExam ? "Update" : "Schedule"}
          />
        )}
      </div>
    </AppShell>
  );
}
