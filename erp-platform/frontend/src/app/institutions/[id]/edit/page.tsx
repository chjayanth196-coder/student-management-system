"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, CheckCircle2, Power } from "lucide-react";
import apiClient from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import type { Institution, InstitutionType } from "@/types";

export default function EditInstitutionPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    type: "College" as InstitutionType,
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

  // Load the institution
  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const { data: res } = await apiClient.get<{ success: boolean; data: Institution }>(
          `/institutions/${id}`
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
  }, [id]);

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
    setSaving(true);
    setError("");
    try {
      await apiClient.put(`/institutions/${id}`, formData);
      setSuccess(true);
      setTimeout(() => router.push("/institutions"), 2000);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to update institution");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async () => {
    setToggling(true);
    setError("");
    try {
      await apiClient.patch(`/institutions/${id}/toggle`);
      setIsActive((prev) => !prev);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to toggle status");
    } finally {
      setToggling(false);
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
              <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
              <h2 className="mt-4 text-2xl font-bold">Institution Not Found</h2>
              <p className="mt-2 text-muted-foreground">
                The institution you are looking for does not exist.
              </p>
              <Button className="mt-6" onClick={() => router.push("/institutions")}>
                Back to Institutions
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  if (success) {
    return (
      <AppShell>
        <div className="flex h-[50vh] items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="py-12 text-center">
              <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
              <h2 className="mt-4 text-2xl font-bold">Institution Updated!</h2>
              <p className="mt-2 text-muted-foreground">Redirecting to institutions list...</p>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Institution</h1>
            <p className="text-muted-foreground">Update institution details.</p>
          </div>
          <Badge variant={isActive ? "success" : "secondary"}>
            {isActive ? "Active" : "Inactive"}
          </Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Institution Details</CardTitle>
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

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" value={formData.address} onChange={(e) => handleChange("address", e.target.value)} />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input id="city" value={formData.city} onChange={(e) => handleChange("city", e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Input id="state" value={formData.state} onChange={(e) => handleChange("state", e.target.value)} required />
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
                  <Label htmlFor="email">Email</Label>
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

              <div className="flex gap-4">
                <Button type="button" variant="outline" onClick={() => router.push("/institutions")}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {isActive ? "Institution is Active" : "Institution is Inactive"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isActive
                    ? "Users can access this institution."
                    : "Users cannot access this institution until activated."}
                </p>
              </div>
              <Button
                variant={isActive ? "destructive" : "default"}
                onClick={handleToggle}
                disabled={toggling}
              >
                {toggling ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Power className="mr-2 h-4 w-4" />
                )}
                {isActive ? "Deactivate" : "Activate"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
