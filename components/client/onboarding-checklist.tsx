"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, X, FileText, MessageSquare, FolderOpen, UserCheck } from "lucide-react";
import Link from "next/link";

interface ClientOnboardingChecklistProps {
  hasProject: boolean;
  hasViewedEstimate: boolean;
  hasSentMessage: boolean;
}

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  href?: string;
  icon: React.ElementType;
}

export function ClientOnboardingChecklist({
  hasProject,
  hasViewedEstimate,
}: ClientOnboardingChecklistProps) {
  const [dismissed, setDismissed] = useState(false);
  const [hasSentMessage, setHasSentMessage] = useState(false);

  // Load dismissed state and message state from localStorage
  useEffect(() => {
    const isDismissed = localStorage.getItem("client-onboarding-dismissed");
    const messageSent = localStorage.getItem("client-first-message-sent");
    setDismissed(isDismissed === "true");
    setHasSentMessage(messageSent === "true");
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("client-onboarding-dismissed", "true");
    setDismissed(true);
  };

  const items: ChecklistItem[] = [
    {
      id: "account",
      label: "Account created",
      description: "Your account is set up",
      completed: true,
      icon: UserCheck,
    },
    {
      id: "project",
      label: "Project linked",
      description: "Connected to your freelancer's project",
      completed: hasProject,
      icon: FolderOpen,
    },
    {
      id: "estimate",
      label: "Review your estimate",
      description: "View and approve project costs",
      completed: hasViewedEstimate,
      href: hasProject ? "/client/inbox" : undefined,
      icon: FileText,
    },
    {
      id: "message",
      label: "Send your first message",
      description: "Start communicating with your freelancer",
      completed: hasSentMessage,
      href: hasProject ? "/client/inbox" : undefined,
      icon: MessageSquare,
    },
  ];

  const completedCount = items.filter((item) => item.completed).length;
  const allCompleted = completedCount === items.length;

  // Don't show if dismissed or all completed
  if (dismissed || allCompleted) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">Getting Started</CardTitle>
            <span className="text-sm text-muted-foreground">
              {completedCount}/{items.length} complete
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
              item.completed
                ? "bg-muted/30"
                : "bg-muted/50 hover:bg-muted/70"
            }`}
          >
            <div className="mt-0.5">
              {item.completed ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={`font-medium text-sm ${
                  item.completed ? "line-through text-muted-foreground" : ""
                }`}
              >
                {item.label}
              </p>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </div>
            {!item.completed && item.href && (
              <Link href={item.href}>
                <Button variant="ghost" size="sm">
                  Start
                </Button>
              </Link>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
