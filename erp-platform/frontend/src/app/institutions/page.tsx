"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth-context";
import { useApiList } from "@/lib/hooks";
import { Plus, Search, Building2, Pencil } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { Institution } from "@/types";

export default function InstitutionsPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("");

  const { data, isLoading, error } = useApiList<Institution>(
    "/institutions",
    { q: search, status }
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

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Institutions</h1>
            <p className="text-muted-foreground">
              Manage all registered institutions.
            </p>
          </div>
          <Button asChild>
            <Link href="/institutions/create">
              <Plus className="mr-2 h-4 w-4" />
              Add Institution
            </Link>
          </Button>
        </div>

        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search institutions..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="rounded-md border bg-background px-3 py-2 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-3/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-1/3 mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        ) : data?.items?.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-lg font-medium">No institutions found</p>
              <p className="text-sm text-muted-foreground">
                Get started by creating a new institution.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data?.items?.map((institution) => (
              <Card key={institution.id} className="transition-colors hover:bg-accent/50">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">{institution.name}</CardTitle>
                    <Button asChild variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                      <Link href={`/institutions/${institution.id}/edit`} aria-label={`Edit ${institution.name}`}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant={institution.isActive ? "success" : "secondary"}>
                        {institution.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Badge variant="outline">{institution.type}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {institution.city}, {institution.state}
                    </p>
                    {institution._count && (
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>{institution._count.users} Users</span>
                        <span>{institution._count.departments} Depts</span>
                        <span>{institution._count.staff} Staff</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
