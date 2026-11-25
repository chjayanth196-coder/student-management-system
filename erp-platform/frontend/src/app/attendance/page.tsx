"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { formatDate } from "@/lib/utils";
import { ClipboardCheck, CalendarDays, Users, CheckCircle2, XCircle, Clock } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  ApiResponse,
  Attendance,
  Class,
  PaginatedResponse,
  Section,
  Student,
  Subject,
} from "@/types";

type AttendanceStatusValue = "Present" | "Absent" | "Late";

interface AttendanceWithSummary {
  records: Attendance[];
  summary: { total: number; present: number; absent: number; late: number; percentage: number };
}

interface SectionReportRow {
  id: string;
  name: string;
  rollNo?: string;
  email: string;
  present: number;
  absent: number;
  late: number;
  total: number;
  percentage: number;
}

interface SectionReport {
  section: { id: string; sectionName: string; classId: string; className?: string };
  summary: {
    totalStudents: number;
    records: number;
    present: number;
    absent: number;
    late: number;
    percentage: number;
  };
  students: SectionReportRow[];
}

const MANAGE_ROLES = ["SuperAdmin", "CollegeAdmin", "Principal", "Faculty", "HOD"];
const todayISO = () => new Date().toISOString().slice(0, 10);
const monthStartISO = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
};

const statusVariant = (status: string): "success" | "destructive" | "warning" =>
  status === "Present" ? "success" : status === "Absent" ? "destructive" : "warning";

export default function AttendancePage() {
  const { user } = useAuth();
  const institutionId = user?.institutionId;
  const canManage = !!user && MANAGE_ROLES.includes(user.role);

  const { data: classes } = useQuery({
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

  const { data: sections } = useQuery({
    queryKey: ["sections", institutionId],
    queryFn: async () => {
      if (!institutionId) return [];
      const { data: res } = await apiClient.get<ApiResponse<Section[]>>(
        `/institutions/${institutionId}/sections`
      );
      return res.data;
    },
    enabled: !!institutionId,
  });

  const { data: subjects } = useQuery({
    queryKey: ["subjects", institutionId],
    queryFn: async () => {
      if (!institutionId) return [];
      const { data: res } = await apiClient.get<ApiResponse<Subject[]>>(
        `/institutions/${institutionId}/subjects`
      );
      return res.data;
    },
    enabled: !!institutionId,
  });

  const { data: studentsData } = useQuery({
    queryKey: ["attendance-students", institutionId],
    queryFn: async () => {
      if (!institutionId) return { items: [] as Student[] };
      const { data: res } = await apiClient.get<ApiResponse<PaginatedResponse<Student>>>(
        `/institutions/${institutionId}/students?limit=1000`
      );
      return res.data;
    },
    enabled: !!institutionId,
  });

  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [date, setDate] = useState(todayISO());
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatusValue>>({});
  const [saving, setSaving] = useState(false);
  const [reportStart, setReportStart] = useState(monthStartISO());
  const [reportEnd, setReportEnd] = useState(todayISO());
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const classSections = useMemo(
    () => (sections || []).filter((s) => !classId || s.classId === classId),
    [sections, classId]
  );
  const classSubjects = useMemo(
    () => (subjects || []).filter((s) => !classId || s.classId === classId),
    [subjects, classId]
  );
  const selectedClass = useMemo(
    () => (classes || []).find((c) => c.id === classId),
    [classes, classId]
  );
  const selectedSection = useMemo(
    () => (sections || []).find((s) => s.id === sectionId),
    [sections, sectionId]
  );

  const classStudents = useMemo(() => {
    const all = studentsData?.items || [];
    if (!selectedClass) return [];
    return all.filter(
      (s) =>
        s.className === selectedClass.className &&
        (!selectedSection || s.section === selectedSection.sectionName)
    );
  }, [studentsData, selectedClass, selectedSection]);
  const classStudentKey = classStudents.map((s) => s.id).join(",");

  const { data: existingRecords, refetch: refetchExisting } = useQuery({
    queryKey: ["attendance-section", institutionId, sectionId, subjectId, date],
    queryFn: async () => {
      if (!institutionId || !sectionId) return [] as Attendance[];
      const params = new URLSearchParams({ date });
      if (subjectId) params.set("subjectId", subjectId);
      const { data: res } = await apiClient.get<ApiResponse<Attendance[]>>(
        `/institutions/${institutionId}/attendance/section/${sectionId}?${params}`
      );
      return res.data;
    },
    enabled: !!institutionId && !!sectionId && canManage,
  });

  const existingKey = (existingRecords || [])
    .map((r) => `${r.studentId}:${r.status}`)
    .join("|");

  useEffect(() => {
    if (!sectionId) return;
    const next: Record<string, AttendanceStatusValue> = {};
    for (const s of classStudents) next[s.id] = "Present";
    for (const r of existingRecords || []) {
      if (next[r.studentId]) next[r.studentId] = r.status as AttendanceStatusValue;
    }
    setStatuses(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingKey, classStudentKey, sectionId]);

  const { data: report, isLoading: reportLoading } = useQuery({
    queryKey: ["attendance-report", institutionId, sectionId, reportStart, reportEnd],
    queryFn: async () => {
      if (!institutionId || !sectionId) return null;
      const params = new URLSearchParams({ sectionId });
      if (reportStart) params.set("startDate", reportStart);
      if (reportEnd) params.set("endDate", reportEnd);
      const { data: res } = await apiClient.get<ApiResponse<SectionReport>>(
        `/institutions/${institutionId}/attendance/report?${params}`
      );
      return res.data;
    },
    enabled: !!institutionId && !!sectionId && canManage,
  });

  // Reset dependent selections when class changes
  const handleClassChange = (value: string) => {
    setClassId(value);
    setSectionId("");
    setSubjectId("");
  };

  const markAll = (status: AttendanceStatusValue) => {
    const next: Record<string, AttendanceStatusValue> = {};
    for (const s of classStudents) next[s.id] = status;
    setStatuses(next);
  };

  const handleSave = async () => {
    if (!institutionId || !sectionId || !subjectId) {
      toast({ title: "Select class, section and subject", variant: "destructive" });
      return;
    }
    if (classStudents.length === 0) {
      toast({ title: "No students in this section", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const records = classStudents.map((s) => ({
        studentId: s.id,
        status: statuses[s.id] || "Present",
      }));
      await apiClient.post(
        `/institutions/${institutionId}/attendance/daily/bulk?sectionId=${sectionId}&subjectId=${subjectId}`,
        { date, records, subjectId }
      );
      toast({ title: "Attendance saved", description: `${records.length} records processed`, variant: "success" });
      await refetchExisting();
      queryClient.invalidateQueries({ queryKey: ["attendance-report"] });
    } catch (err: unknown) {
      toast({
        title: "Failed to save attendance",
        description: (err as { response?: { data?: { message?: string } } })?.response?.data?.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const defaultTab = canManage ? "mark" : "me";

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader title="Attendance" description="Mark attendance, review reports and track records." />

        <Tabs defaultValue={defaultTab} className="space-y-4">
          <TabsList>
            {canManage && <TabsTrigger value="mark">Mark Attendance</TabsTrigger>}
            {canManage && <TabsTrigger value="reports">Reports</TabsTrigger>}
            <TabsTrigger value="me">My Attendance</TabsTrigger>
          </TabsList>

          {canManage && (
            <TabsContent value="mark" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardCheck className="h-5 w-5" /> Daily Attendance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-2">
                      <Label>Class</Label>
                      <Select value={classId} onValueChange={handleClassChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                        <SelectContent>
                          {(classes || []).map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.className}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Section</Label>
                      <Select value={sectionId} onValueChange={setSectionId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select section" />
                        </SelectTrigger>
                        <SelectContent>
                          {classSections.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.sectionName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Subject</Label>
                      <Select value={subjectId} onValueChange={setSubjectId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                        <SelectContent>
                          {classSubjects.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.subjectName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                    </div>
                  </div>

                  {!sectionId ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      Select a class and section to load students.
                    </p>
                  ) : classStudents.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      No students found for this section. Assign students to this class/section from the Students page.
                    </p>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => markAll("Present")}>
                          Mark all present
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => markAll("Absent")}>
                          Mark all absent
                        </Button>
                        <span className="text-sm text-muted-foreground">{classStudents.length} students</span>
                      </div>

                      <div className="space-y-2">
                        {classStudents.map((s) => {
                          const current = statuses[s.id] || "Present";
                          return (
                            <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3">
                              <div>
                                <p className="font-medium">{s.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {s.rollNo || "No roll no"} · {s.email}
                                </p>
                              </div>
                              <div className="flex gap-1">
                                {(["Present", "Absent", "Late"] as AttendanceStatusValue[]).map((opt) => (
                                  <Button
                                    key={opt}
                                    size="sm"
                                    variant={current === opt ? "default" : "outline"}
                                    onClick={() => setStatuses((prev) => ({ ...prev, [s.id]: opt }))}
                                  >
                                    {opt}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex justify-end">
                        <Button onClick={handleSave} disabled={saving}>
                          {saving ? "Saving..." : "Save Attendance"}
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {canManage && (
            <TabsContent value="reports" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Attendance Reports</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-4">
                    <div className="space-y-2">
                      <Label>Class</Label>
                      <Select value={classId} onValueChange={handleClassChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                        <SelectContent>
                          {(classes || []).map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.className}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Section</Label>
                      <Select value={sectionId} onValueChange={setSectionId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select section" />
                        </SelectTrigger>
                        <SelectContent>
                          {classSections.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.sectionName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>From</Label>
                      <Input type="date" value={reportStart} onChange={(e) => setReportStart(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>To</Label>
                      <Input type="date" value={reportEnd} onChange={(e) => setReportEnd(e.target.value)} />
                    </div>
                  </div>

                  {!sectionId ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      Select a class and section to view reports.
                    </p>
                  ) : reportLoading ? (
                    <Skeleton className="h-64 w-full" />
                  ) : report ? (
                    <div className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                          <CardContent className="pt-6">
                            <p className="text-sm text-muted-foreground">Overall</p>
                            <p className="text-2xl font-bold">{report.summary.percentage}%</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <p className="text-sm text-muted-foreground">Present</p>
                            <p className="text-2xl font-bold text-green-600">{report.summary.present}</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <p className="text-sm text-muted-foreground">Absent</p>
                            <p className="text-2xl font-bold text-red-600">{report.summary.absent}</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <p className="text-sm text-muted-foreground">Late</p>
                            <p className="text-2xl font-bold text-amber-600">{report.summary.late}</p>
                          </CardContent>
                        </Card>
                      </div>

                      {report.students.length > 0 && (
                        <div className="h-72 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={report.students.map((s) => ({
                              name: s.rollNo || s.name,
                              Present: s.present,
                              Absent: s.absent,
                              Late: s.late,
                            }))}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis allowDecimals={false} />
                              <Tooltip />
                              <Legend />
                              <Bar dataKey="Present" fill="#16a34a" />
                              <Bar dataKey="Absent" fill="#dc2626" />
                              <Bar dataKey="Late" fill="#d97706" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}

                      <div className="space-y-2">
                        {report.students.map((s) => (
                          <div key={s.id} className="flex items-center justify-between rounded-lg border p-3">
                            <div>
                              <p className="font-medium">{s.name}</p>
                              <p className="text-xs text-muted-foreground">{s.rollNo || "No roll no"}</p>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-green-600">P: {s.present}</span>
                              <span className="text-red-600">A: {s.absent}</span>
                              <span className="text-amber-600">L: {s.late}</span>
                              <Badge variant={s.percentage >= 75 ? "success" : "destructive"}>
                                {s.percentage}%
                              </Badge>
                            </div>
                          </div>
                        ))}
                        {report.students.length === 0 && (
                          <p className="py-6 text-center text-sm text-muted-foreground">
                            No students or attendance records found for this range.
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      No report data available.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="me">
            <MyAttendance />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

function MyAttendance() {
  const { user } = useAuth();
  const institutionId = user?.institutionId;

  const { data: myAttendance, isLoading } = useQuery({
    queryKey: ["my-attendance", institutionId, user?.id],
    queryFn: async () => {
      if (!institutionId || !user?.id) return null;
      try {
        const { data: res } = await apiClient.get<ApiResponse<AttendanceWithSummary>>(
          `/institutions/${institutionId}/attendance/me`
        );
        if (res.data) return res.data;
      } catch {
        // fall through to explicit student endpoint
      }
      const { data: res } = await apiClient.get<ApiResponse<Attendance[]>>(
        `/institutions/${institutionId}/attendance/student/${user.id}`
      );
      const records = Array.isArray(res.data) ? res.data : [];
      const total = records.length;
      const present = records.filter((r) => r.status === "Present").length;
      const absent = records.filter((r) => r.status === "Absent").length;
      const late = records.filter((r) => r.status === "Late").length;
      const percentage = total > 0 ? Number(((present / total) * 100).toFixed(2)) : 0;
      return { records, summary: { total, present, absent, late, percentage } };
    },
    enabled: !!institutionId,
  });

  return (
    <div className="space-y-4">
      {myAttendance && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Overall</p>
                <p className="text-2xl font-bold">{myAttendance.summary.percentage}%</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Present</p>
                <p className="text-2xl font-bold">{myAttendance.summary.present}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <XCircle className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">Absent</p>
                <p className="text-2xl font-bold">{myAttendance.summary.absent}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <Clock className="h-8 w-8 text-amber-600" />
              <div>
                <p className="text-sm text-muted-foreground">Late</p>
                <p className="text-2xl font-bold">{myAttendance.summary.late}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : myAttendance?.records && myAttendance.records.length > 0 ? (
            <div className="space-y-2">
              {myAttendance.records.map((record) => (
                <div key={record.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{formatDate(record.date)}</p>
                      {record.subject && <p className="text-sm text-muted-foreground">{record.subject}</p>}
                    </div>
                  </div>
                  <Badge variant={statusVariant(record.status)}>{record.status}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ClipboardCheck className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-lg font-medium">No attendance records</p>
              <p className="text-sm text-muted-foreground">Your attendance records will appear here.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
