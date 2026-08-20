"use client";

import { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-context";
import apiClient from "@/lib/api-client";
import {
  Building2,
  KeyRound,
  ShieldCheck,
  AlertCircle,
  Loader2,
  RefreshCw,
  Copy,
  CheckCircle2,
  Lock,
} from "lucide-react";
import type { CollegeCredentialRow } from "@/types";

export default function SuperAdminCollegesPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<CollegeCredentialRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reveal credentials flow
  const [revealTarget, setRevealTarget] = useState<CollegeCredentialRow | null>(null);
  const [verifyPassword, setVerifyPassword] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<{ loginId: string; password: string | null } | null>(null);
  const [copied, setCopied] = useState(false);

  // Reset password flow
  const [resetTarget, setResetTarget] = useState<CollegeCredentialRow | null>(null);
  const [adminPassword, setAdminPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);

  const fetchCredentials = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get<{ success: boolean; data: CollegeCredentialRow[] }>(
        "/superadmin/colleges/credentials"
      );
      setRows(data.data || []);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || "Failed to load college credentials");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchCredentials();
  }, [fetchCredentials]);

  if (user?.role !== "SuperAdmin") {
    return (
      <AppShell>
        <div className="flex h-[50vh] items-center justify-center">
          <p className="text-muted-foreground">Access restricted to Super Admin.</p>
        </div>
      </AppShell>
    );
  }

  const openReveal = (row: CollegeCredentialRow) => {
    setRevealed(null);
    setVerifyPassword("");
    setVerifyError(null);
    setCopied(false);
    setRevealTarget(row);
  };

  const handleVerify = async () => {
    setVerifyLoading(true);
    setVerifyError(null);
    try {
      const { data } = await apiClient.post("/superadmin/colleges/verify-password", {
        password: verifyPassword,
      });
      if (data.success) {
        setRevealed({
          loginId: revealTarget?.admin?.loginId || "",
          password: revealTarget?.admin?.password || null,
        });
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setVerifyError(msg || "Password verification failed");
    } finally {
      setVerifyLoading(false);
    }
  };

  const copyCredentials = () => {
    if (!revealed) return;
    const text = `Institution: ${revealTarget?.institutionName}\nLogin ID: ${revealed.loginId}\nPassword: ${revealed.password || "N/A"}`;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = async () => {
    setResetLoading(true);
    setResetError(null);
    try {
      await apiClient.put(
        `/superadmin/colleges/${resetTarget?.institutionId}/admin-password`,
        { newPassword: adminPassword }
      );
      setResetSuccess(true);
      setAdminPassword("");
      // Refresh the list to show the (still-hidden) new password
      fetchCredentials();
      setTimeout(() => {
        setResetTarget(null);
        setResetSuccess(false);
      }, 1500);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setResetError(msg || "Failed to reset admin password");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
<h1 className="text-3xl font-bold tracking-tight">College Credentials</h1>
            <p className="text-muted-foreground">
              View and reset each institution admin login credential, protected by your own password.
            </p>
          </div>
          <Button variant="outline" onClick={fetchCredentials} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Institution Admins
            </CardTitle>
<CardDescription>
              Click the View button on any institution to reveal its admin login ID and password
              after re-entering your own password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : error ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <AlertCircle className="h-10 w-10 text-destructive" />
                <p className="text-destructive">{error}</p>
              </div>
            ) : rows.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <Building2 className="h-10 w-10 text-muted-foreground" />
                <p className="text-muted-foreground">No institutions found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-2 pr-4 font-medium">Institution</th>
                      <th className="py-2 pr-4 font-medium">Type</th>
                      <th className="py-2 pr-4 font-medium">Status</th>
                      <th className="py-2 pr-4 font-medium">Admin Login</th>
                      <th className="py-2 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.institutionId} className="border-b last:border-0 hover:bg-accent/40">
                        <td className="py-3 pr-4">
                          <div className="flex flex-col">
                            <span className="font-medium">{row.institutionName}</span>
                            <span className="text-xs text-muted-foreground">{row.slug}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <Badge variant="outline">{row.type}</Badge>
                        </td>
                        <td className="py-3 pr-4">
                          <Badge variant={row.isActive ? "success" : "secondary"}>
                            {row.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4">
                          {row.admin ? (
                            <span className="font-mono text-xs">{row.admin.loginId}</span>
                          ) : (
                            <span className="text-muted-foreground">No admin account</span>
                          )}
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={!row.admin}
                              onClick={() => openReveal(row)}
                            >
                              <KeyRound className="mr-2 h-4 w-4" />
                              View Credentials
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              disabled={!row.admin}
                              onClick={() => {
                                setResetTarget(row);
                                setResetError(null);
                                setResetSuccess(false);
                                setAdminPassword("");
                              }}
                            >
                              <Lock className="mr-2 h-4 w-4" />
                              Reset Password
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reveal credentials dialog */}
      <Dialog open={!!revealTarget && !revealed} onOpenChange={(o) => !o && setRevealTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Verify Your Password
            </DialogTitle>
            <DialogDescription>
              To reveal the admin credentials for{" "}
              <span className="font-semibold text-foreground">{revealTarget?.institutionName}</span>,
              please re-enter your own Super Admin password.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="verify-password">Your Super Admin Password</Label>
            <Input
              id="verify-password"
              type="password"
              value={verifyPassword}
              onChange={(e) => setVerifyPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleVerify()}
              placeholder="Enter your password"
            />
            {verifyError && (
              <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{verifyError}</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevealTarget(null)}>
              Cancel
            </Button>
            <Button onClick={handleVerify} disabled={verifyLoading || !verifyPassword}>
              {verifyLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...
                </>
              ) : (
                "Verify & Reveal"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revealed credentials dialog */}
      <Dialog open={!!revealed} onOpenChange={(o) => !o && setRevealed(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Admin Credentials
            </DialogTitle>
            <DialogDescription>
              Admin login for {revealTarget?.institutionName}. Handle securely.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Login ID (Email)</Label>
              <div className="mt-1 flex items-center gap-2 rounded-md bg-muted px-3 py-2">
                <span className="font-mono text-sm">{revealed?.loginId}</span>
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Password</Label>
              <div className="mt-1 flex items-center gap-2 rounded-md bg-muted px-3 py-2">
                <span className="font-mono text-sm">
                  {revealed?.password || "Not stored (set manually)"}
                </span>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full" onClick={copyCredentials}>
              {copied ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" /> Copy Credentials
                </>
              )}
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={() => setRevealed(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset password dialog */}
      <Dialog
        open={!!resetTarget}
        onOpenChange={(o) => !o && !resetLoading && setResetTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              Reset Admin Password
            </DialogTitle>
            <DialogDescription>
              Set a new password for the admin of{" "}
              <span className="font-semibold text-foreground">{resetTarget?.institutionName}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="new-admin-password">New Admin Password</Label>
            <Input
              id="new-admin-password"
              type="text"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Enter new password"
            />
            {resetError && (
              <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{resetError}</span>
              </div>
            )}
            {resetSuccess && (
              <div className="flex items-center gap-2 rounded-md bg-green-500/10 p-3 text-sm text-green-600">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                <span>Password reset successfully!</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetTarget(null)} disabled={resetLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleReset}
              disabled={resetLoading || !adminPassword || adminPassword.length < 6}
            >
              {resetLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Resetting...
                </>
              ) : (
                "Reset Password"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
