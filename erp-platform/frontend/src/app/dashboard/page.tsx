
"use client";

import React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth-context";
import { useApiGet } from "@/lib/hooks";
import {
  Building2,
  GraduationCap,
  Users,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
} from "lucide-react";
import type {
  SuperAdminDashboard,
  AdminDashboard,
  StudentDashboard,
  FacultyDashboard,
} from "@/types";

const StatCard = React.memo(function StatCard({
  title,
  value,
  icon,
  description,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-8 w-8 rounded-lg bg-primary/10 p-1.5 text-primary">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
        </Card>
  );
});

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-10 w-72" />
        <Skeleton className="mt-2 h-4 w-96" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

const DashboardContent = React.memo(function DashboardContent() {
  const { user } = useAuth();

  if (user?.role === "SuperAdmin") {
    return <SuperAdminDashboardView />;
  }
  if (user?.role === "Student") {
    return <StudentDashboardView />;
  }
  if (user?.role === "Faculty") {
    return <FacultyDashboardView />;
  }
  return <AdminDashboardView />;
});

function SuperAdminDashboardView() {
  const { data, isLoading } = useApiGet<SuperAdminDashboard>("/admin/dashboard");

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Super Admin Dashboard</h1>
        <p className="text-muted-foreground">Overview of all institutions and users across the platform.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Institutions" value={data?.stats?.totalInstitutions ?? 0} icon={<Building2 className="h-4 w-4" />} />
        <StatCard title="Total Users" value={data?.stats?.totalUsers ?? 0} icon={<Users className="h-4 w-4" />} />
        <StatCard title="Total Students" value={data?.stats?.totalStudents ?? 0} icon={<GraduationCap className="h-4 w-4" />} />
        <StatCard title="Total Staff" value={data?.stats?.totalStaff ?? 0} icon={<Users className="h-4 w-4" />} />
      </div>
      {data?.recentInstitutions && data.recentInstitutions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Institutions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.recentInstitutions.slice(0, 5).map((inst) => (
                <div key={inst.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium">{inst.name}</p>
                    <p className="text-sm text-muted-foreground">{inst.city}, {inst.state}</p>
                  </div>
                  <Badge variant={inst.isActive ? "success" : "secondary"}>
                    {inst.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function AdminDashboardView() {
  const { user } = useAuth();
  const institutionId = user?.institutionId;
  const { data, isLoading } = useApiGet<AdminDashboard>(
    institutionId ? `/institutions/${institutionId}/dashboard` : null
  );

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {data?.institution?.name || "Institution"} Dashboard
        </h1>
        <p className="text-muted-foreground">Welcome back, {user?.name}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Students" value={data?.stats?.totalStudents || 0} icon={<GraduationCap className="h-4 w-4" />} />
        <StatCard title="Total Staff" value={data?.stats?.totalStaff || 0} icon={<Users className="h-4 w-4" />} />
        <StatCard title="Total Classes" value={data?.stats?.totalClasses || 0} icon={<BookOpen className="h-4 w-4" />} />
        <StatCard title="Departments" value={data?.stats?.totalDepartments || 0} icon={<Building2 className="h-4 w-4" />} />
      </div>
      {data?.stats?.todayAttendance ? (
        <Card>
          <CardHeader>
<CardTitle>Today&apos;s Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{data.stats.todayAttendance}</p>
                <p className="text-xs text-muted-foreground">Marked Today</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{data.stats.pendingFees}</p>
                <p className="text-xs text-muted-foreground">Pending Fees</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">${Number(data.stats.totalFeeCollected).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Fees Collected</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function StudentDashboardView() {
  const { user } = useAuth();
  const institutionId = user?.institutionId;
  const { data, isLoading } = useApiGet<StudentDashboard>(
    institutionId ? `/institutions/${institutionId}/dashboard/student` : ""
  );

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Student Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {data?.student?.name || user?.name}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.attendance?.percentage || 0}%</div>
            <p className="text-xs text-muted-foreground">
              {data?.attendance?.present || 0} / {data?.attendance?.totalClasses || 0} days
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Fee Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${data?.fees?.totalPaid || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Paid: ${data?.fees?.totalPaid || 0} | Due: ${data?.fees?.pendingAmount || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.results?.totalSubjects || 0}</div>
            <p className="text-xs text-muted-foreground">Avg: {data?.results?.averagePercentage || 0}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Pending Fees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.fees?.pendingCount || 0}</div>
            <p className="text-xs text-muted-foreground">Overdue payments</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function FacultyDashboardView() {
  const { user } = useAuth();
  const institutionId = user?.institutionId;
  const { data, isLoading } = useApiGet<FacultyDashboard>(
    institutionId ? `/institutions/${institutionId}/dashboard/faculty` : null
  );

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Faculty Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.name}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Students" value={data?.stats?.totalStudents || 0} icon={<GraduationCap className="h-4 w-4" />} />
        <StatCard title="Classes Assigned" value={data?.stats?.classesAssigned || 0} icon={<BookOpen className="h-4 w-4" />} />
        <StatCard title="Today Marked" value={data?.stats?.todayMarked || 0} icon={<ClipboardCheck className="h-4 w-4" />} />
        <StatCard title="Recent" value={data?.recentAttendance?.length || 0} icon={<CalendarDays className="h-4 w-4" />} />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AppShell>
      <DashboardContent />
    </AppShell>
  );
}

