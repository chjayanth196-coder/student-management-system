"use client";

import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { ScrollText } from "lucide-react";
import type { Result, ApiResponse } from "@/types";

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

export default function ResultsPage() {
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

  const getGradeColor = (grade?: string) => {
    if (!grade) return "default" as const;
    if (["A+", "A"].includes(grade)) return "success" as const;
    if (["B+", "B"].includes(grade)) return "info" as const;
    if (["C+", "C"].includes(grade)) return "warning" as const;
    return "destructive" as const;
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Results"
          description="View academic results and performance."
        />

        {user?.role === "Student" && report && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Overall Grade</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{report.summary.overallGrade || "N/A"}</div>
                <p className="text-xs text-muted-foreground">Current performance</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Total Marks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {report.terms.reduce((s, t) => s + t.totalMarks, 0)}/
                  {report.terms.reduce((s, t) => s + t.maxMarks, 0)}
                </div>
                <p className="text-xs text-muted-foreground">Obtained / Total</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Percentage</CardTitle>
              </CardHeader>
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
                {report.terms.map((term) => (
                  <div key={term.term}>
                    <h3 className="mb-2 text-lg font-semibold">{term.term} - {term.grade} ({term.percentage.toFixed(1)}%)</h3>
                    <div className="space-y-2">
                      {term.results.map((result) => (
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
                            <Badge variant={getGradeColor(result.grade)}>
                              {result.grade || "N/A"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-sm font-medium">
                    Overall: {report.summary.overallGrade} ({report.summary.overallPercentage.toFixed(1)}%) - {report.summary.totalSubjects} subjects across {report.summary.totalTerms} terms
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
                    : "No results have been published yet."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

