"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, CheckCircle2, Building2, Save } from "lucide-react";
import apiClient from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import type { Institution } from "@/types";

export default function MyInstitutionPage() {
  const { user } = useAuth();
  const institutionId = user?.institutionId;
  const canEdit = user?.role === "CollegeAdmin" || user?.role === "SuperAdmin";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    type: "College",
    address: "",
    city: "",
    state: "",
    country: "",
    phone: "",
    email: "",
    website: "",
    principal: "",
    academicYear: "",
  });
  const [isActive, setIsActive] = useState(true);

  // Load the current user's institution
  useEffect(() => {
    const load = async () => {
      if (!institutionId) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      try {
        const { data: res } = await apiClient.get<{ success: boolean; data: Institution }>(
          `/institutions/${institutionId}`
        );
        const inst = res.data;
        setFormData({
          name: inst.name || "",
          type: inst.type || "College",
          address: inst.address || "",
          city: inst.city || "",
          state: inst.state || "",
          country: inst.country || "",
          phone: inst.phone || "",
          email: inst.email || "",
          website: inst.website || "",
          principal: inst.principal || "",
          academicYear: inst.academicYear || "",
        });
        setIsActive(inst.isActive);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [institutionId]);

  if (user?.role === "SuperAdmin") {
    return (
      <AppShell>
        <div className="flex h-[50vh] items-center justify-center">
          <p className="text-muted-foreground">
            Super Admin manages institutions from the Institutions page.
          </p>
        </div>
      </AppShell>
    );
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      if (!institutionId) throw new Error("No institution assigned to this account");
      await apiClient.put(`/institutions/${institutionId}`, formData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to update institution details");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  if (notFound) {
    return (
      <AppShell>
        <div className="flex h-[50vh] items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="py-12 text-center">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
              <h2 className="mt-4 text-2xl font-bold">No Institution</h2>
              <p className="mt-2 text-muted-foreground">
                Your account is not linked to any institution.
              </p>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Institution</h1>
            <p className="text-muted-foreground">
              View and update your institution&apos;s profile information.
            </p>
          </div>
          <Badge variant={isActive ? "success" : "secondary"}>
            {isActive ? "Active" : "Inactive"}
          </Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Institution Details
            </CardTitle>
            <CardDescription>
              {canEdit
                ? "Fill in your institution's details. These will be visible to the Super Admin."
                : "Your institution's details."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Institution Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Institution name is set by the platform administrator.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Input id="type" value={formData.type} disabled className="bg-muted" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" value={formData.address} onChange={(e) => handleChange("address", e.target.value)} />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" value={formData.city} onChange={(e) => handleChange("city", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input id="state" value={formData.state} onChange={(e) => handleChange("state", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input id="country" value={formData.country} onChange={(e) => handleChange("country", e.target.value)} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={formData.phone} onChange={(e) => handleChange("phone", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Institution Email</Label>
                  <Input id="email" type="email" value={formData.email} onChange={(e) => handleChange("email", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input id="website" value={formData.website} onChange={(e) => handleChange("website", e.target.value)} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="principal">Principal</Label>
                  <Input id="principal" value={formData.principal} onChange={(e) => handleChange("principal", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="academicYear">Academic Year</Label>
                  <Input id="academicYear" value={formData.academicYear} onChange={(e) => handleChange("academicYear", e.target.value)} />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2 rounded-md bg-green-500/10 p-3 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                  <span>Institution details updated successfully!</span>
                </div>
              )}

              <div className="flex gap-4">
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" /> Save Details
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

