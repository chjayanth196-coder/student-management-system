const fs = require('fs');
const path = require('path');

const filePath = path.join('c:/Users/chjay/OneDrive/Desktop/student-management-system/erp-platform/frontend/src/app', 'notifications/page.tsx');

const content = `"use client";

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

fs.writeFileSync(filePath, content, 'utf8');
console.log('Notifications page written OK');

