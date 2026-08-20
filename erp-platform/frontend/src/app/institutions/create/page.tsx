"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, AlertCircle, CheckCircle2, KeyRound, Info } from "lucide-react";
import apiClient from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { InstitutionType } from "@/types";

interface CreatedAdmin {
  id: string;
  email: string;
  name: string;
  role: string;
  institutionId: string;
}

export default function CreateInstitutionPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    type: "College" as InstitutionType,
    adminName: "",
    adminEmail: "",
    adminPassword: "Admin@123",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [createdAdmin, setCreatedAdmin] = useState<CreatedAdmin | null>(null);

  if (user?.role !== "SuperAdmin") {
    return (
      <AppShell>
        <div className="flex h-[50vh] items-center justify-center">
          <p className="text-muted-foreground">Access restricted to Super Admin.</p>
        </div>
      </AppShell>
    );
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const { data } = await apiClient.post("/institutions", formData);
      setCreatedAdmin(data?.data?.admin || null);
      setSuccess(true);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to create institution");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <AppShell>
        <div className="flex min-h-[60vh] items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="py-10 text-center">
              <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
              <h2 className="mt-4 text-2xl font-bold">Institution Registered!</h2>
              <p className="mt-2 text-muted-foreground">
                {formData.name} has been registered successfully.
              </p>

              {createdAdmin && (
                <div className="mt-6 rounded-lg border p-4 text-left">
                  <div className="flex items-center gap-2 text-primary">
                    <KeyRound className="h-4 w-4" />
                    <p className="text-sm font-semibold">Admin Login Credentials</p>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Share these with the institution admin. They will use them to log in and
                    complete their institution&apos;s profile.
                  </p>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex items-center justify-between rounded-md bg-muted px-3 py-2">
                      <span className="text-muted-foreground">Email</span>
                      <span className="font-mono font-semibold">{createdAdmin.email}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-md bg-muted px-3 py-2">
                      <span className="text-muted-foreground">Password</span>
                      <span className="font-mono font-semibold">{formData.adminPassword}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 flex gap-4">
                <Button type="button" variant="outline" onClick={() => router.push("/institutions")}>
                  View Institutions
                </Button>
                <Button type="button" onClick={() => router.push("/superadmin/colleges")}>
                  Manage Credentials
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Register Institution</h1>
          <p className="text-muted-foreground">
            Register a new institution and provide its admin login credentials.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              Registration Details
            </CardTitle>
            <CardDescription>
              The institution admin will log in with the credentials below and fill in their own
              institution&apos;s full details (address, city, contact, etc.) from their account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Institution Name *</Label>
                <Input id="name" value={formData.name} onChange={(e) => handleChange("name", e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <Select value={formData.type} onValueChange={(v) => handleChange("type", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="School">School</SelectItem>
                    <SelectItem value="College">College</SelectItem>
                    <SelectItem value="University">University</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-lg border bg-muted/30 p-4">
                <CardDescription className="mb-3 font-semibold text-foreground">
                  Administrator Account
                </CardDescription>
                <p className="mb-4 text-xs text-muted-foreground">
                  Create the login credentials for the institution admin. They will use these to
                  sign in and manage their own institution.
                </p>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="adminName">Admin Name</Label>
                    <Input id="adminName" placeholder="e.g. College Admin" value={formData.adminName} onChange={(e) => handleChange("adminName", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="adminEmail">Admin Email (Login ID)</Label>
                    <Input id="adminEmail" type="email" placeholder="admin@institution.edu" value={formData.adminEmail} onChange={(e) => handleChange("adminEmail", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="adminPassword">Admin Password</Label>
                    <Input id="adminPassword" value={formData.adminPassword} onChange={(e) => handleChange("adminPassword", e.target.value)} />
                  </div>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex gap-4">
                <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Registering...</> : "Register Institution"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
