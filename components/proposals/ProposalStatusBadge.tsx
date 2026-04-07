"use client";

import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, XCircle, MinusCircle } from "lucide-react";
import type { ProposalStatus } from "@/types/proposal";

interface ProposalStatusBadgeProps {
  status: ProposalStatus;
}

const statusConfig: Record<
  ProposalStatus,
  {
    label: string;
    variant: "default" | "secondary" | "success" | "destructive" | "outline";
    icon: typeof Clock;
  }
> = {
  PENDING: { label: "Pending", variant: "default", icon: Clock },
  ACCEPTED: { label: "Accepted", variant: "success", icon: CheckCircle },
  DECLINED: { label: "Declined", variant: "destructive", icon: XCircle },
  WITHDRAWN: { label: "Withdrawn", variant: "secondary", icon: MinusCircle },
};

export function ProposalStatusBadge({ status }: ProposalStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
