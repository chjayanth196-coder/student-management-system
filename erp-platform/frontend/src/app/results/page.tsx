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
import { ScrollText, Save } from "lucide-react";
import type {
  AcademicYear,
  ApiResponse,
  Class,
  PaginatedResponse,
  Result,
  Section,
  Student,
  Subject,
} from "@/types";

interface StudentReport {
  student: {
    id: string;
    name: string;
    rollNo: string;
    className: string;
    section: string;
  };
  terms: Array<{
    term: string;
    results: Result[];
    totalMarks: number;
    maxMarks: number;
    percentage: number;
    grade: string;
  }>;
  summary: {
    totalTerms: number;
    totalSubjects: number;
    overallPercentage: number;
    overallGrade: string;
  };
}

interface ResultWithRelations extends Result {
  student?: { id: string; name: string; rollNo?: string; enrollmentNo?: string };
  subject?: { id: string; subjectName: string; subjectCode: string; credits?: number };
}

const ENTRY_ROLES = ["SuperAdmin", "CollegeAdmin", "Principal", "Faculty"];
const EXAM_TYPES = ["Internal", "MidSemester", "Semester", "Practical", "Assignment", "Quiz"];
const TERMS = ["Term 1", "Term 2", "Term 3", "Semester 1", "Semester 2", "Annual"];

const gradeVariant = (grade?: string): "success" | "info" | "warning" | "destructive" => {
  if (!grade) return "destructive";
  if (["A+", "A"].includes(grade)) return "success";
  if (["B+", "B"].includes(grade)) return "info";
  if (["C+", "C"].includes(grade)) return "warning";
  return "destructive";
};

export default function ResultsPage() {
  const { user } = useAuth();
  const canManage = !!user && ENTRY_ROLES.includes(user.role);
  const defaultTab = canManage ? "entry" : "my";

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader title="Results" description="Enter marks, review class performance and view report cards." />
        <Tabs defaultValue={defaultTab} className="space-y-4">
          <TabsList>
            {canManage && <TabsTrigger value="entry">Marks Entry</TabsTrigger>}
            {canManage && <TabsTrigger value="class">Class Results</TabsTrigger>}
            <TabsTrigger value="my">My Results</TabsTrigger>
          </TabsList>

          {canManage && (
            <TabsContent value="entry">
              <MarksEntry />
            </TabsContent>
          )}
          {canManage && (
            <TabsContent value="class">
              <ClassResults />
            </TabsContent>
          )}
          <TabsContent value="my">
            <MyResults />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

function useAcademicData() {
  const { user } = useAuth();
  const institutionId = user?.institutionId;

  const classes = useQuery({
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

  const sections = useQuery({
    queryKey: ["sections", institutionId],
    queryFn: async () => {
      if (!institutionId) return [] as Section[];
      const { data: res } = await apiClient.get<ApiResponse<Section[]>>(
        `/institutions/${institutionId}/sections`
      );
      return res.data;
    },
    enabled: !!institutionId,
  });

  const subjects = useQuery({
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

  const students = useQuery({
    queryKey: ["results-students", institutionId],
    queryFn: async () => {
      if (!institutionId) return [] as Student[];
      const { data: res } = await apiClient.get<ApiResponse<PaginatedResponse<Student>>>(
        `/institutions/${institutionId}/students?limit=1000`
      );
      return res.data.items;
    },
    enabled: !!institutionId,
  });

  const years = useQuery({
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

  return { institutionId: institutionId as string | undefined, classes, sections, subjects, students, years };
}

function MarksEntry() {
  const { institutionId, classes, sections, subjects, students, years } = useAcademicData();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [academicYearId, setAcademicYearId] = useState("");
  const [term, setTerm] = useState("Term 1");
  const [examType, setExamType] = useState("Internal");
  const [maxMarks, setMaxMarks] = useState("100");
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!academicYearId && years.data?.length) {
      const current = years.data.find((y) => y.isCurrent) || years.data[0];
      setAcademicYearId(current.id);
    }
  }, [years.data, academicYearId]);

  const classSections = useMemo(
    () => (sections.data || []).filter((s) => !classId || s.classId === classId),
    [sections.data, classId]
  );
  const classSubjects = useMemo(
    () => (subjects.data || []).filter((s) => !classId || s.classId === classId),
    [subjects.data, classId]
  );
  const selectedClass = useMemo(
    () => (classes.data || []).find((c) => c.id === classId),
    [classes.data, classId]
  );
  const selectedSection = useMemo(
    () => (sections.data || []).find((s) => s.id === sectionId),
    [sections.data, sectionId]
  );

  const classStudents = useMemo(() => {
    const all = students.data || [];
    if (!selectedClass) return [];
    return all.filter(
      (s) =>
        s.className === selectedClass.className &&
        (!selectedSection || s.section === selectedSection.sectionName)
    );
  }, [students.data, selectedClass, selectedSection]);
  const studentsKey = classStudents.map((s) => s.id).join(",");

  const { data: existingResults, refetch } = useQuery({
    queryKey: ["results-entry", institutionId, subjectId, term, examType],
    queryFn: async () => {
      if (!institutionId || !subjectId) return [] as ResultWithRelations[];
      const params = new URLSearchParams({ subjectId, term, examType });
      const { data: res } = await apiClient.get<ApiResponse<ResultWithRelations[]>>(
        `/institutions/${institutionId}/results?${params}`
      );
      return res.data;
    },
    enabled: !!institutionId && !!subjectId,
  });

  const existingKey = (existingResults || [])
    .map((r) => `${r.studentId}:${r.marksObtained}:${r.maxMarks}`)
    .join("|");

  useEffect(() => {
    const next: Record<string, string> = {};
    for (const s of classStudents) next[s.id] = "";
    for (const r of existingResults || []) {
      if (next[r.studentId] !== undefined) next[r.studentId] = String(r.marksObtained);
    }
    setMarks(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingKey, studentsKey, subjectId, term, examType]);

  const handleSave = async () => {
    if (!institutionId || !subjectId || !academicYearId) {
      toast({ title: "Select class, subject and academic year", variant: "destructive" });
      return;
    }
    const max = Number(maxMarks) || 100;
    const entries = classStudents
      .map((s) => ({ student: s, value: marks[s.id] }))
      .filter((e) => e.value !== "" && e.value !== undefined && !Number.isNaN(Number(e.value)));

    if (entries.length === 0) {
      toast({ title: "Enter at least one mark", variant: "destructive" });
      return;
    }

    setSaving(true);
    let success = 0;
    let failed = 0;
    for (const entry of entries) {
      const marksObtained = Number(entry.value);
      const existing = (existingResults || []).find(
        (r) => r.studentId === entry.student.id && r.subjectId === subjectId
      );
      try {
        if (existing) {
          await apiClient.put(`/institutions/${institutionId}/results/${existing.id}`, {
            marksObtained,
            maxMarks: max,
          });
        } else {
          await apiClient.post(`/institutions/${institutionId}/results`, {
            studentId: entry.student.id,
            subjectId,
            academicYearId,
            examType,
            term,
            marksObtained,
            maxMarks: max,
          });
        }
        success += 1;
      } catch {
        failed += 1;
      }
    }
    setSaving(false);
    toast({
      title: "Marks saved",
      description: `${success} saved${failed ? `, ${failed} failed` : ""}`,
      variant: failed ? "destructive" : "success",
    });
    await refetch();
    queryClient.invalidateQueries({ queryKey: ["results-entry"] });
    queryClient.invalidateQueries({ queryKey: ["class-results"] });
  };

  const handleClassChange = (value: string) => {
    setClassId(value);
    setSectionId("");
    setSubjectId("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Marks Entry</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label>Class</Label>
            <Select value={classId} onValueChange={handleClassChange}>
              <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
              <SelectContent>
                {(classes.data || []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.className}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Section</Label>
            <Select value={sectionId} onValueChange={setSectionId}>
              <SelectTrigger><SelectValue placeholder="Select section" /></SelectTrigger>
              <SelectContent>
                {classSections.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.sectionName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Subject</Label>
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
              <SelectContent>
                {classSubjects.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.subjectName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Academic Year</Label>
            <Select value={academicYearId} onValueChange={setAcademicYearId}>
              <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
              <SelectContent>
                {(years.data || []).map((y) => (
                  <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Term</Label>
            <Select value={term} onValueChange={setTerm}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TERMS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Exam Type</Label>
            <Select value={examType} onValueChange={setExamType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {EXAM_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Max Marks</Label>
            <Input type="number" min={1} value={maxMarks} onChange={(e) => setMaxMarks(e.target.value)} />
          </div>
        </div>

        {!selectedClass || classStudents.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Select a class (and section) that has students to enter marks.
          </p>
        ) : (
          <>
            <div className="space-y-2">
              {classStudents.map((s) => (
                <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.rollNo || "No roll no"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      max={Number(maxMarks) || 100}
                      className="w-28"
                      placeholder={`/ ${maxMarks}`}
                      value={marks[s.id] ?? ""}
                      onChange={(e) => setMarks((prev) => ({ ...prev, [s.id]: e.target.value }))}
                    />
                    <span className="text-sm text-muted-foreground">/ {maxMarks}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Saving..." : "Save Marks"}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function ClassResults() {
  const { institutionId, classes, sections, students } = useAcademicData();
  const [classId, setClassId] = useState("");
  const [term, setTerm] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["class-results", institutionId, classId, term],
    queryFn: async () => {
      if (!institutionId) return [] as ResultWithRelations[];
      const params = new URLSearchParams();
      if (term) params.set("term", term);
      const qs = params.toString();
      const { data: res } = await apiClient.get<ApiResponse<ResultWithRelations[]>>(
        `/institutions/${institutionId}/results${qs ? `?${qs}` : ""}`
      );
      return res.data;
    },
    enabled: !!institutionId,
  });

  const selectedClass = (classes.data || []).find((c) => c.id === classId);
  const classStudentIds = useMemo(() => {
    if (!selectedClass) return new Set<string>();
    return new Set(
      (students.data || [])
        .filter((s) => s.className === selectedClass.className)
        .map((s) => s.id)
    );
  }, [students.data, selectedClass]);

  const rows = (data || []).filter((r) => !classId || classStudentIds.has(r.studentId));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Class Results</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Class</Label>
            <Select value={classId} onValueChange={setClassId}>
              <SelectTrigger><SelectValue placeholder="All classes" /></SelectTrigger>
              <SelectContent>
                {(classes.data || []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.className}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Term</Label>
            <Select value={term} onValueChange={setTerm}>
              <SelectTrigger><SelectValue placeholder="All terms" /></SelectTrigger>
              <SelectContent>
                {TERMS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {sections.data && sections.data.length > 0 && (
            <div className="space-y-2">
              <Label>Note</Label>
              <p className="pt-2 text-xs text-muted-foreground">
                Results are filtered using the students assigned to the selected class.
              </p>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : rows.length > 0 ? (
          <div className="space-y-2">
            {rows.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3">
                <div>
                  <p className="font-medium">{r.student?.name || "Student"}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.subject?.subjectName || "Subject"} · {r.term} · {r.examType}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-medium">{r.marksObtained}/{r.maxMarks}</p>
                    <p className="text-xs text-muted-foreground">{r.percentage?.toFixed(1)}%</p>
                  </div>
                  <Badge variant={gradeVariant(r.grade)}>{r.grade || "N/A"}</Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">No results found.</p>
        )}
      </CardContent>
    </Card>
  );
}

function MyResults() {
  const { user } = useAuth();
  const institutionId = user?.institutionId;
  const studentId = user?.id;

  const { data: report, isLoading } = useQuery({
    queryKey: ["results-student-report", institutionId, studentId],
    queryFn: async () => {
      if (!institutionId || !studentId) return null;
      const { data: res } = await apiClient.get<ApiResponse<StudentReport>>(
        `/institutions/${institutionId}/results/student/${studentId}`
      );
      return res.data;
    },
    enabled: !!institutionId && !!studentId && user?.role === "Student",
  });

  return (
    <div className="space-y-4">
      {user?.role === "Student" && report && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Overall Grade</CardTitle></CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{report.summary.overallGrade || "N/A"}</div>
              <p className="text-xs text-muted-foreground">Current performance</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Total Marks</CardTitle></CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {report.terms.reduce((s, t) => s + t.totalMarks, 0)}/
                {report.terms.reduce((s, t) => s + t.maxMarks, 0)}
              </div>
              <p className="text-xs text-muted-foreground">Obtained / Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Percentage</CardTitle></CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{report.summary.overallPercentage.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">Overall percentage</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Result Records</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : report?.terms && report.terms.length > 0 ? (
            <div className="space-y-6">
              {report.terms.map((t) => (
                <div key={t.term}>
                  <h3 className="mb-2 text-lg font-semibold">
                    {t.term} - {t.grade} ({t.percentage.toFixed(1)}%)
                  </h3>
                  <div className="space-y-2">
                    {t.results.map((result) => (
                      <div key={result.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <p className="font-medium">{result.examType || "General"}</p>
                          <p className="text-sm text-muted-foreground">{result.term}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-medium">{result.marksObtained}/{result.maxMarks}</p>
                            <p className="text-xs text-muted-foreground">{result.percentage?.toFixed(1)}%</p>
                          </div>
                          <Badge variant={gradeVariant(result.grade)}>{result.grade || "N/A"}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm font-medium">
                  Overall: {report.summary.overallGrade} ({report.summary.overallPercentage.toFixed(1)}%) -{" "}
                  {report.summary.totalSubjects} subjects across {report.summary.totalTerms} terms
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ScrollText className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-lg font-medium">No results found</p>
              <p className="text-sm text-muted-foreground">
                {user?.role === "Student"
                  ? "Your results will appear here when published."
                  : "Select a different tab to enter or review results."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
