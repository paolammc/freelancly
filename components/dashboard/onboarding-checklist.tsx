"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, X, User, FolderPlus, ListPlus, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface OnboardingChecklistProps {
  hasCompletedProfile: boolean;
  hasCreatedProject: boolean;
  hasCreatedTask: boolean;
}

export function OnboardingChecklist({
  hasCompletedProfile,
  hasCreatedProject,
  hasCreatedTask,
}: OnboardingChecklistProps) {
  const [dismissed, setDismissed] = useState(false);

  // Check localStorage for dismissal
  useEffect(() => {
    const isDismissed = localStorage.getItem("onboarding-checklist-dismissed");
    if (isDismissed === "true") {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("onboarding-checklist-dismissed", "true");
    setDismissed(true);
  };

  if (dismissed) return null;

  const completedCount = [hasCompletedProfile, hasCreatedProject, hasCreatedTask].filter(Boolean).length;
  const totalSteps = 3;

  const steps = [
    {
      id: "profile",
      label: "Complete your profile",
      description: "Add skills and bio to attract clients",
      completed: hasCompletedProfile,
      href: "/freelancer/profile",
      icon: User,
    },
    {
      id: "project",
      label: "Create your first project",
      description: "Organize your work with projects",
      completed: hasCreatedProject,
      href: "/freelancer/projects/new",
      icon: FolderPlus,
    },
    {
      id: "task",
      label: "Add a task",
      description: "Break down work into tasks (⌘K)",
      completed: hasCreatedTask,
      href: "/freelancer/tasks",
      icon: ListPlus,
    },
  ];

  return (
    <Card className="relative border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      {/* Dismiss Button */}
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        aria-label="Dismiss checklist"
      >
        <X className="h-4 w-4" />
      </button>

      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <span>Getting Started</span>
          <span className="text-xs font-normal text-muted-foreground">
            {completedCount}/{totalSteps} complete
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {steps.map((step) => (
            <Link
              key={step.id}
              href={step.href}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg transition-colors group",
                step.completed
                  ? "bg-emerald-500/5"
                  : "bg-muted/50 hover:bg-muted"
              )}
            >
              {/* Status Icon */}
              <div className="shrink-0">
                {step.completed ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-sm font-medium",
                    step.completed && "text-muted-foreground line-through"
                  )}
                >
                  {step.label}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {step.description}
                </p>
              </div>

              {/* Arrow */}
              {!step.completed && (
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              )}
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
