"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth-context";
import { useApiGet } from "@/lib/hooks";
import {
  Building2,
  DollarSign,
  GraduationCap,
  Users,
  Target,
  Trophy,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import type {
  PlatformAnalytics,
  InstitutionAnalyticsSummary,
  InstitutionDeepAnalytics,
} from "@/types";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-IN").format(value || 0);
}

export default function SuperAdminAnalyticsPage() {
  const { user } = useAuth();
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"income" | "students" | "placements" | "package">("income");

  const { data: analytics, isLoading, error, refetch } = useApiGet<PlatformAnalytics>(
    "/superadmin/analytics"
  );
  const { data: detail, isLoading: detailLoading } = useApiGet<InstitutionDeepAnalytics>(
    selectedInstitutionId ? `/superadmin/analytics/${selectedInstitutionId}` : null
  );

  if (user?.role !== "SuperAdmin") {
    return (
      <AppShell>
        <div className="flex h-[50vh] items-center justify-center">
          <p className="text-muted-foreground">Access restricted to Super Admin.</p>
        </div>
      </AppShell>
    );
  }

  const sortedInstitutions = [...(analytics?.institutions || [])].sort((a, b) => {
    switch (sortBy) {
      case "students":
        return b.students - a.students;
      case "placements":
        return b.placements - a.placements;
      case "package":
        return b.highestPackage - a.highestPackage;
      case "income":
      default:
        return b.totalIncome - a.totalIncome;
    }
  });

  const totals = analytics?.totals;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Platform Analytics</h1>
            <p className="text-muted-foreground">
              Cross-institution insights — growth, placements, and income across every college.
            </p>
          </div>
          <Button variant="outline" onClick={refetch} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>

        {/* Totals */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardContent className="py-6">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="mt-3 h-8 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
              <AlertCircle className="h-10 w-10 text-destructive" />
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardContent className="flex items-center gap-4 py-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Institutions</p>
                  <p className="text-2xl font-bold">{formatNumber(totals?.institutions || 0)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 py-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Income Collected</p>
                  <p className="text-2xl font-bold">{formatCurrency(totals?.totalIncome || 0)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 py-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
                  <GraduationCap className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Students</p>
                  <p className="text-2xl font-bold">{formatNumber(totals?.totalStudents || 0)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 py-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Staff</p>
                  <p className="text-2xl font-bold">{formatNumber(totals?.totalStaff || 0)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 py-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-500/10">
                  <Target className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Placements</p>
                  <p className="text-2xl font-bold">{formatNumber(totals?.totalPlacements || 0)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 py-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-500/10">
                  <Trophy className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Highest Package (Overall)</p>
                  <p className="text-2xl font-bold">{formatCurrency(totals?.highestPackageOverall || 0)}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Ranked institutions table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Institution Growth Ranking
            </CardTitle>
            <CardDescription>
              Every institution ranked by their growth and performance metrics.
            </CardDescription>
            <div className="flex flex-wrap gap-2 pt-2">
              {[
                { key: "income" as const, label: "Income" },
                { key: "students" as const, label: "Students" },
                { key: "placements" as const, label: "Placements" },
                { key: "package" as const, label: "Highest Package" },
              ].map((opt) => (
                <Button
                  key={opt.key}
                  size="sm"
                  variant={sortBy === opt.key ? "default" : "outline"}
                  onClick={() => setSortBy(opt.key)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">#</th>
                  <th className="py-2 pr-4 font-medium">Institution</th>
                  <th className="py-2 pr-4 text-right font-medium">Students</th>
                  <th className="py-2 pr-4 text-right font-medium">Staff</th>
                  <th className="py-2 pr-4 text-right font-medium">Placements</th>
                  <th className="py-2 pr-4 text-right font-medium">Highest Pkg</th>
                  <th className="py-2 pr-4 text-right font-medium">Avg Pkg</th>
                  <th className="py-2 text-right font-medium">Income</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {sortedInstitutions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-muted-foreground">
                      No institutions found.
                    </td>
                  </tr>
                ) : (
                  sortedInstitutions.map((inst: InstitutionAnalyticsSummary, idx: number) => (
                    <tr key={inst.id} className="border-b last:border-0 hover:bg-accent/40">
                      <td className="py-3 pr-4">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                          {idx + 1}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex flex-col">
                          <span className="font-medium">{inst.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {inst.city}, {inst.state}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-right">{formatNumber(inst.students)}</td>
                      <td className="py-3 pr-4 text-right">{formatNumber(inst.staff)}</td>
                      <td className="py-3 pr-4 text-right">{formatNumber(inst.placements)}</td>
                      <td className="py-3 pr-4 text-right">{formatCurrency(inst.highestPackage)}</td>
                      <td className="py-3 pr-4 text-right">{formatCurrency(inst.averagePackage)}</td>
                      <td className="py-3 pr-4 text-right font-semibold text-green-600">
                        {formatCurrency(inst.totalIncome)}
                      </td>
                      <td className="py-3 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setSelectedInstitutionId(selectedInstitutionId === inst.id ? null : inst.id)
                          }
                        >
                          {selectedInstitutionId === inst.id ? (
                            <ArrowUpRight className="h-4 w-4" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4" />
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Institution deep-dive */}
        {selectedInstitutionId && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                {detail?.institution?.name || "Institution Details"}
              </CardTitle>
              <CardDescription>Deep-dive analytics for the selected institution.</CardDescription>
            </CardHeader>
            <CardContent>
              {detailLoading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-20" />
                  ))}
                </div>
              ) : detail ? (
                <div className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">Students</p>
                      <p className="text-2xl font-bold">{formatNumber(detail.summary.students)}</p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">Total Income</p>
                      <p className="text-2xl font-bold">{formatCurrency(detail.summary.totalIncome)}</p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">Highest Package</p>
                      <p className="text-2xl font-bold">{formatCurrency(detail.summary.highestPackage)}</p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">Pending Fees</p>
                      <p className="text-2xl font-bold">{formatNumber(detail.summary.pendingFees)}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-3 font-semibold">Yearly Income</h3>
                    {detail.incomeByYear.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No income data yet.</p>
                    ) : (
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {detail.incomeByYear.map((y) => (
                          <div
                            key={y.year}
                            className="flex items-center justify-between rounded-lg border px-4 py-3"
                          >
                            <div>
                              <p className="text-sm font-medium">{y.year}</p>
                              <p className="text-xs text-muted-foreground">{y.payments} payments</p>
                            </div>
                            <Badge variant="success">{formatCurrency(y.income)}</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="mb-3 font-semibold">Placements</h3>
                    {detail.placements.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No placements recorded.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b text-left text-muted-foreground">
                              <th className="py-2 pr-4 font-medium">Company</th>
                              <th className="py-2 pr-4 font-medium">Role</th>
                              <th className="py-2 pr-4 text-right font-medium">Package</th>
                              <th className="py-2 font-medium">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {detail.placements.map((p) => (
                              <tr key={p.id} className="border-b last:border-0">
                                <td className="py-2 pr-4 font-medium">{p.companyName}</td>
                                <td className="py-2 pr-4">{p.jobTitle || "-"}</td>
                                <td className="py-2 pr-4 text-right">{formatCurrency(p.package || 0)}</td>
                                <td className="py-2">
                                  <Badge variant="outline">{p.status}</Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
