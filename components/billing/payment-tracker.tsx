"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Receipt,
  Loader2,
} from "lucide-react";

type PaymentStatus = "pending" | "paid" | "overdue" | "refunded" | "cancelled";

interface Payment {
  id: string;
  amount: number;
  status: PaymentStatus;
  method: string | null;
  paidAt: string | null;
  dueDate: string | null;
  notes: string | null;
  createdAt: string;
  estimate: {
    title: string;
    project: {
      title: string;
    };
  };
  receipt?: {
    id: string;
    receiptNumber: string;
  } | null;
}

interface PaymentTrackerProps {
  payments: Payment[];
}

const statusConfig: Record<
  PaymentStatus,
  { label: string; variant: "default" | "secondary" | "success" | "destructive" | "outline"; icon: typeof Clock }
> = {
  pending: { label: "Pending", variant: "secondary", icon: Clock },
  paid: { label: "Paid", variant: "success", icon: CheckCircle },
  overdue: { label: "Overdue", variant: "destructive", icon: AlertCircle },
  refunded: { label: "Refunded", variant: "outline", icon: XCircle },
  cancelled: { label: "Cancelled", variant: "outline", icon: XCircle },
};

export function PaymentTracker({ payments }: PaymentTrackerProps) {
  const router = useRouter();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleStatusChange = async (paymentId: string, newStatus: PaymentStatus) => {
    setUpdatingId(paymentId);
    try {
      const response = await fetch(`/api/payments/${paymentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to update payment:", error);
    } finally {
      setUpdatingId(null);
    }
  };

  const totalPending = payments
    .filter((p) => p.status === "pending" || p.status === "overdue")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const totalReceived = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Pending
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalPending)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Received
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(totalReceived)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              Total
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(totalPending + totalReceived)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payments List */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>Track and manage all payments</CardDescription>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No payments yet</p>
              <p className="text-sm">
                Payments will appear here when estimates are approved
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {payments.map((payment) => {
                const status = statusConfig[payment.status];
                const StatusIcon = status.icon;
                const isOverdue =
                  payment.dueDate &&
                  new Date(payment.dueDate) < new Date() &&
                  payment.status === "pending";

                return (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{payment.estimate.title}</h4>
                        <Badge
                          variant={isOverdue ? "destructive" : status.variant}
                          className="gap-1"
                        >
                          <StatusIcon className="h-3 w-3" />
                          {isOverdue ? "Overdue" : status.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {payment.estimate.project.title}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {payment.dueDate && (
                          <span>Due: {formatDate(new Date(payment.dueDate))}</span>
                        )}
                        {payment.paidAt && (
                          <span className="text-green-600">
                            Paid: {formatDate(new Date(payment.paidAt))}
                          </span>
                        )}
                        {payment.receipt && (
                          <span className="flex items-center gap-1">
                            <Receipt className="h-3 w-3" />
                            {payment.receipt.receiptNumber}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-lg font-bold">
                          {formatCurrency(Number(payment.amount))}
                        </p>
                      </div>

                      {(payment.status === "pending" || isOverdue) && (
                        <Select
                          value={payment.status}
                          onValueChange={(value) =>
                            handleStatusChange(payment.id, value as PaymentStatus)
                          }
                          disabled={updatingId === payment.id}
                        >
                          <SelectTrigger className="w-[130px]">
                            {updatingId === payment.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <SelectValue />
                            )}
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="paid">Mark as Paid</SelectItem>
                            <SelectItem value="cancelled">Cancel</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
