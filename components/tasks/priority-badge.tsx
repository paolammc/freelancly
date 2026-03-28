"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Flag } from "lucide-react";

type Priority = "low" | "medium" | "high" | "urgent";

interface PriorityBadgeProps {
  priority: Priority;
  showIcon?: boolean;
  size?: "sm" | "default";
}

const priorityConfig = {
  low: {
    label: "Low",
    className: "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-100",
    iconColor: "text-slate-500",
  },
  medium: {
    label: "Medium",
    className: "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100",
    iconColor: "text-blue-500",
  },
  high: {
    label: "High",
    className: "bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100",
    iconColor: "text-orange-500",
  },
  urgent: {
    label: "Urgent",
    className: "bg-red-100 text-red-700 border-red-200 hover:bg-red-100",
    iconColor: "text-red-500",
  },
};

export function PriorityBadge({ priority, showIcon = false, size = "default" }: PriorityBadgeProps) {
  const config = priorityConfig[priority];

  return (
    <Badge
      variant="outline"
      className={cn(
        config.className,
        size === "sm" && "text-xs px-1.5 py-0"
      )}
    >
      {showIcon && <Flag className={cn("h-3 w-3 mr-1", config.iconColor)} />}
      {config.label}
    </Badge>
  );
}

export function PriorityIndicator({ priority }: { priority: Priority }) {
  const colors = {
    low: "bg-slate-400",
    medium: "bg-blue-500",
    high: "bg-orange-500",
    urgent: "bg-red-500",
  };

  return (
    <span
      className={cn("inline-block w-2 h-2 rounded-full", colors[priority])}
      title={priorityConfig[priority].label}
    />
  );
}
