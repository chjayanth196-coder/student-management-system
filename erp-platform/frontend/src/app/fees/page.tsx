"use client";

import { useState, useCallback } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { FormDialog, FormField } from "@/components/ui/form-dialog";
import { useToast } from "@/lib/hooks";
import { formatDate, formatCurrency } from "@/lib/utils";
import { DollarSign, AlertCircle, Plus } from "lucide-react";
import type { ApiResponse } from "@/types";

interface FeePayment {
  id: string;
  amount: number;
  paidAmount: number;
  dueDate: string;
  paidDate?: string;
  status: string;
  paymentMode?: string;
  fine?: number;
  discount?: number;
}

interface FeeStructure {
  id: string;
  name: string;
  category: string;
  amount: number;
  frequency: string;
  isActive: boolean;
}

interface FeeSummary {
  totalFees: number;
  totalPaid: number;
  totalDue: number;
  totalFine: number;
  payments: FeePayment[];
}

export default function FeesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const institutionId = user?.institutionId;
  const studentId = user?.id;

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"structure" | "payment">("structure");
  const [dialogLoading, setDialogLoading] = useState(false);
  const [dialogError, setDialogError] = useState("");

  const { data: feeSummary, isLoading: summaryLoading } = useQuery({
    queryKey: ["fee-summary", institutionId, studentId],
    queryFn: async () => {
      if (!institutionId || !studentId) return null;
      try {
        const { data: res } = await apiClient.get<ApiResponse<FeeSummary>>(
          `/institutions/${institutionId}/fees/student/${studentId}`
        );
        return res.data;
      } catch {
        return { totalFees: 0, totalPaid: 0, totalDue: 0, totalFine: 0, payments: [] };
      }
    },
    enabled: !!institutionId && !!studentId && user?.role === "Student",
  });

  const { data: feeStructures, isLoading: structuresLoading } = useQuery({
    queryKey: ["fee-structures", institutionId],
    queryFn: async () => {
      if (!institutionId) return [];
      try {
        const { data: res } = await apiClient.get<ApiResponse<FeeStructure[]>>(
          `/institutions/${institutionId}/fees/structures`
        );
        return res.data || [];
      } catch {
        return [];
      }
    },
    enabled: !!institutionId,
  });

  const handleSubmit = useCallback(async (values: Record<string, any>) => {
    if (!institutionId) return;
    setDialogLoading(true);
    setDialogError("");
    try {
      if (dialogMode === "structure") {
        await apiClient.post(`/institutions/${institutionId}/fees/structures`, values);
        toast({ title: "Fee structure created", variant: "success" });
      } else {
        await apiClient.post(`/institutions/${institutionId}/fees/payments`, values);
        toast({ title: "Payment recorded", variant: "success" });
      }
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["fee-structures"] });
      queryClient.invalidateQueries({ queryKey: ["fee-summary"] });
    } catch (err: unknown) {
      setDialogError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Operation failed");
    } finally {
      setDialogLoading(false);
    }
  }, [institutionId, dialogMode, queryClient, toast]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Paid": return "success";
      case "Pending": return "warning";
      case "Overdue": return "destructive";
      case "Partial": return "info";
      default: return "secondary";
    }
  };

  const structureFields: FormField[] = [
    { name: "name", label: "Fee Name", placeholder: "Tuition Fee", required: true },
    { name: "category", label: "Category", type: "select", required: true, options: [
      { label: "Tuition", value: "Tuition" },
      { label: "Hostel", value: "Hostel" },
      { label: "Transport", value: "Transport" },
      { label: "Library", value: "Library" },
      { label: "Lab", value: "Lab" },
      { label: "Other", value: "Other" },
    ]},
    { name: "amount", label: "Amount", type: "number", required: true, min: 1 },
    { name: "frequency", label: "Frequency", type: "select", required: true, options: [
      { label: "Monthly", value: "monthly" },
      { label: "Quarterly", value: "quarterly" },
      { label: "Half-Yearly", value: "half-yearly" },
      { label: "Yearly", value: "yearly" },
      { label: "One Time", value: "one-time" },
    ]},
    { name: "dueDay", label: "Due Day of Month", type: "number" },
    { name: "lateFee", label: "Late Fee", type: "number" },
    { name: "description", label: "Description" },
  ];

  const paymentFields: FormField[] = [
    { name: "studentId", label: "Student ID", required: true },
    { name: "feeStructureId", label: "Fee Structure ID", required: true },
    { name: "paidAmount", label: "Amount Paid", type: "number", required: true },
    { name: "paymentMode", label: "Payment Mode", type: "select", required: true, options: [
      { label: "Cash", value: "Cash" },
      { label: "Card", value: "Card" },
      { label: "Bank Transfer", value: "Bank Transfer" },
      { label: "Cheque", value: "Cheque" },
      { label: "Online", value: "Online" },
    ]},
    { name: "dueDate", label: "Due Date", type: "date", required: true },
    { name: "remarks", label: "Remarks" },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader title="Fees" description="Manage fees and payments." />

        {user?.role === "Student" && feeSummary && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Total Fees</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(feeSummary.totalFees || 0)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Paid</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(feeSummary.totalPaid || 0)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Due</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{formatCurrency(feeSummary.totalDue || 0)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Fine</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{formatCurrency(feeSummary.totalFine || 0)}</div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Payment History</CardTitle>
                <Button size="sm" onClick={() => { setDialogMode("payment"); setDialogOpen(true); }}>
                  <Plus className="mr-2 h-4 w-4" /> Record Payment
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {summaryLoading ? (
                <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : feeSummary?.payments && feeSummary.payments.length > 0 ? (
                <div className="space-y-2">
                  {feeSummary.payments.slice(0, 10).map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="font-medium">{formatCurrency(payment.paidAmount)}</p>
                        <p className="text-xs text-muted-foreground">{payment.paidDate ? formatDate(payment.paidDate) : formatDate(payment.dueDate)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {payment.paymentMode && <span className="text-xs text-muted-foreground">{payment.paymentMode}</span>}
                        <Badge variant={getStatusColor(payment.status) as any}>{payment.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <DollarSign className="h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-lg font-medium">No payments yet</p>
                  <p className="text-sm text-muted-foreground">Your payment history will appear here.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Fee Structures</CardTitle>
                <Button size="sm" onClick={() => { setDialogMode("structure"); setDialogOpen(true); }}>
                  <Plus className="mr-2 h-4 w-4" /> Add Structure
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {structuresLoading ? (
                <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : feeStructures && feeStructures.length > 0 ? (
                <div className="space-y-2">
                  {feeStructures.map((fee) => (
                    <div key={fee.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="font-medium">{fee.name}</p>
                        <p className="text-xs text-muted-foreground">{fee.category} - {fee.frequency}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(fee.amount)}</p>
                        <Badge variant={fee.isActive ? "success" : "secondary"}>{fee.isActive ? "Active" : "Inactive"}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-lg font-medium">No fee structures</p>
                  <p className="text-sm text-muted-foreground">Fee structures have not been configured yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <FormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          title={dialogMode === "structure" ? "Create Fee Structure" : "Record Payment"}
          description={dialogMode === "structure" ? "Define a new fee structure." : "Record a fee payment."}
          fields={dialogMode === "structure" ? structureFields : paymentFields}
          onSubmit={handleSubmit}
          isLoading={dialogLoading}
          error={dialogError}
        />
      </div>
    </AppShell>
  );
}

