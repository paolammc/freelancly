"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Zap, Calendar, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";

type EstimateStatus = "draft" | "sent" | "approved" | "rejected" | "expired";

interface EstimateItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

interface EstimatePreviewProps {
  estimate: {
    title: string;
    description?: string | null;
    status: EstimateStatus;
    totalAmount: number;
    validUntil?: Date | string | null;
    sentAt?: Date | string | null;
    approvedAt?: Date | string | null;
    items: EstimateItem[];
  };
  freelancer?: {
    name: string;
    email: string;
    title?: string;
  };
  client?: {
    email: string;
  };
  project?: {
    title: string;
  };
  showActions?: boolean;
}

const statusConfig: Record<
  EstimateStatus,
  { label: string; variant: "default" | "secondary" | "success" | "destructive" | "outline"; icon: typeof Clock }
> = {
  draft: { label: "Draft", variant: "secondary", icon: Clock },
  sent: { label: "Sent", variant: "default", icon: AlertCircle },
  approved: { label: "Approved", variant: "success", icon: CheckCircle },
  rejected: { label: "Rejected", variant: "destructive", icon: XCircle },
  expired: { label: "Expired", variant: "outline", icon: AlertCircle },
};

export function EstimatePreview({
  estimate,
  freelancer,
  client,
  project,
}: EstimatePreviewProps) {
  const status = statusConfig[estimate.status];
  const StatusIcon = status.icon;

  const isExpired =
    estimate.validUntil &&
    new Date(estimate.validUntil) < new Date() &&
    estimate.status === "sent";

  return (
    <Card className="print:shadow-none print:border-0">
      <CardHeader className="pb-4">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Freelancly</h2>
              {freelancer && (
                <p className="text-sm text-muted-foreground">{freelancer.name}</p>
              )}
            </div>
          </div>
          <Badge variant={status.variant} className="gap-1">
            <StatusIcon className="h-3 w-3" />
            {isExpired ? "Expired" : status.label}
          </Badge>
        </div>

        <div className="pt-4">
          <h1 className="text-2xl font-bold">{estimate.title}</h1>
          {project && (
            <p className="text-muted-foreground">Project: {project.title}</p>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-6">
          {freelancer && (
            <div>
              <p className="text-xs text-muted-foreground uppercase font-medium mb-1">
                From
              </p>
              <p className="font-medium">{freelancer.name}</p>
              {freelancer.title && (
                <p className="text-sm text-muted-foreground">{freelancer.title}</p>
              )}
              <p className="text-sm text-muted-foreground">{freelancer.email}</p>
            </div>
          )}
          {client && (
            <div>
              <p className="text-xs text-muted-foreground uppercase font-medium mb-1">
                To
              </p>
              <p className="font-medium">{client.email}</p>
            </div>
          )}
        </div>

        {/* Dates */}
        <div className="flex gap-6 text-sm">
          {estimate.sentAt && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Sent: {formatDate(new Date(estimate.sentAt))}
            </div>
          )}
          {estimate.validUntil && (
            <div
              className={`flex items-center gap-1 ${
                isExpired ? "text-destructive" : "text-muted-foreground"
              }`}
            >
              <Calendar className="h-4 w-4" />
              Valid until: {formatDate(new Date(estimate.validUntil))}
            </div>
          )}
          {estimate.approvedAt && (
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle className="h-4 w-4" />
              Approved: {formatDate(new Date(estimate.approvedAt))}
            </div>
          )}
        </div>

        {estimate.description && (
          <div>
            <p className="text-xs text-muted-foreground uppercase font-medium mb-1">
              Description
            </p>
            <p className="text-sm">{estimate.description}</p>
          </div>
        )}

        <Separator />

        {/* Line Items */}
        <div>
          <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground border-b pb-2 mb-2">
            <div className="col-span-6">Description</div>
            <div className="col-span-2 text-right">Qty</div>
            <div className="col-span-2 text-right">Unit Price</div>
            <div className="col-span-2 text-right">Amount</div>
          </div>

          {estimate.items.map((item, index) => (
            <div
              key={index}
              className="grid grid-cols-12 gap-2 py-2 border-b last:border-0"
            >
              <div className="col-span-6 text-sm">{item.description}</div>
              <div className="col-span-2 text-sm text-right">
                {item.quantity}
              </div>
              <div className="col-span-2 text-sm text-right">
                {formatCurrency(Number(item.unitPrice))}
              </div>
              <div className="col-span-2 text-sm text-right font-medium">
                {formatCurrency(Number(item.amount))}
              </div>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="flex justify-end pt-4">
          <div className="w-64 space-y-2">
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>{formatCurrency(Number(estimate.totalAmount))}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
