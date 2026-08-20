const fs = require('fs');
const path = require('path');

const baseDir = 'c:/Users/chjay/OneDrive/Desktop/student-management-system/erp-platform/frontend/src/app';

// Notifications page - complete valid content
const notificationsContent = `"use client";

import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { formatDate } from "@/lib/utils";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import type { ApiResponse } from "@/types";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  userId: string;
  createdAt: string;
}

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data: res } = await apiClient.get<ApiResponse<Notification[]>>("/notifications?page=1&limit=20");
      return res.data;
    },
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      await apiClient.post("/notifications/mark-all-read");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.patch(\`/notifications/\${id}/read\`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader title="Notifications" description="View and manage your notifications." />
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Notifications</CardTitle>
              <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending}>
                {markAllRead.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCheck className="mr-2 h-4 w-4" />}
                Mark All Read
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="py-12 text-center text-destructive">Failed to load notifications</div>
            ) : !data || (Array.isArray(data) && data.length === 0) ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Bell className="h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-lg font-medium">No notifications</p>
                <p className="text-sm text-muted-foreground">You are all caught up!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {(Array.isArray(data) ? data : (data as any)?.items || []).map((notification: Notification) => (
                  <div
                    key={notification.id}
                    className={\`flex items-start gap-4 rounded-lg border p-4 transition-colors \${notification.isRead ? "" : "bg-muted/50"}\`}
                    onClick={() => { if (!notification.isRead) markRead.mutate(notification.id); }}
                  >
                    <div className={\`mt-1 h-2 w-2 rounded-full \${notification.isRead ? "bg-transparent" : "bg-primary"}\`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{notification.title}</p>
                        <Badge variant="outline" className="text-xs">{formatDate(notification.createdAt)}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
`;

// Attendance page - complete valid content
const attendanceContent = `"use client";

import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { formatDate } from "@/lib/utils";
import { ClipboardCheck, CalendarDays } from "lucide-react";
import type { Attendance, ApiResponse } from "@/types";

interface AttendanceWithSummary {
  records: Attendance[];
  summary: { total: number; present: number; absent: number; late: number; percentage: number };
}

export default function AttendancePage() {
  const { user } = useAuth();
  const institutionId = user?.institutionId;

  const { data: myAttendance, isLoading, error } = useQuery({
    queryKey: ["my-attendance", institutionId],
    queryFn: async () => {
      if (!institutionId) return null;
      try {
        const { data: res } = await apiClient.get<ApiResponse<AttendanceWithSummary>>(
          \`/institutions/\${institutionId}/attendance/me\`
        );
        return res.data;
      } catch {
        if (user?.id) {
          const { data: res } = await apiClient.get<ApiResponse<Attendance[]>>(
            \`/institutions/\${institutionId}/attendance/student/\${user.id}\`
          );
          const records = Array.isArray(res.data) ? res.data : [];
          const total = records.length;
          const present = records.filter((r) => r.status === "Present").length;
          const absent = records.filter((r) => r.status === "Absent").length;
          const late = records.filter((r) => r.status === "Late").length;
          const percentage = total > 0 ? Number(((present / total) * 100).toFixed(2)) : 0;
          return { records, summary: { total, present, absent, late, percentage } };
        }
        return { records: [], summary: { total: 0, present: 0, absent: 0, late: 0, percentage: 0 } };
      }
    },
    enabled: !!institutionId && user?.role === "Student",
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader title="Attendance" description="View and manage attendance records." />

        {user?.role === "Student" && myAttendance && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Attendance Percentage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{myAttendance.summary.percentage}%</div>
                <p className="text-xs text-muted-foreground">
                  {myAttendance.summary.present} / {myAttendance.summary.total} days
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Present</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{myAttendance.summary.present}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Absent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">{myAttendance.summary.absent}</div>
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
                {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : myAttendance?.records && myAttendance.records.length > 0 ? (
              <div className="space-y-2">
                {myAttendance.records.map((record) => (
                  <div key={record.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <CalendarDays className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{formatDate(record.date)}</p>
                        {record.subject && (
                          <p className="text-sm text-muted-foreground">{record.subject}</p>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant={
                        record.status === "Present" ? "success" :
                        record.status === "Absent" ? "destructive" :
                        record.status === "Late" ? "warning" : "secondary"
                      }
                    >
                      {record.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ClipboardCheck className="h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-lg font-medium">Unable to load attendance</p>
                <p className="text-sm text-muted-foreground">Please try again later.</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ClipboardCheck className="h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-lg font-medium">No attendance records</p>
                <p className="text-sm text-muted-foreground">
                  {user?.role === "Student"
                    ? "Your attendance records will appear here."
                    : "Mark attendance to see records."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
`;
<content>
fs.writeFileSync(path.join(baseDir, 'notifications/page.tsx'), notificationsContent, 'utf8');
fs.writeFileSync(path.join(baseDir, 'attendance/page.tsx'), attendanceContent, 'utf8');
console.log('Both pages written successfully');
</content>

