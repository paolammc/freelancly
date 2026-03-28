"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/dashboard/progress";
import { formatDuration } from "@/lib/utils";
import { Clock, AlertTriangle, CheckCircle, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimeComparisonCardProps {
  taskTitle: string;
  estimatedSeconds: number | null;
  actualSeconds: number;
  status: "todo" | "in_progress" | "done";
}

export function TimeComparisonCard({
  taskTitle,
  estimatedSeconds,
  actualSeconds,
  status,
}: TimeComparisonCardProps) {
  if (!estimatedSeconds) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Time Tracking
          </CardTitle>
          <CardDescription>{taskTitle}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Time tracked</span>
            <span className="font-medium">{formatDuration(actualSeconds)}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            No time estimate set for this task
          </p>
        </CardContent>
      </Card>
    );
  }

  const percentage = Math.round((actualSeconds / estimatedSeconds) * 100);
  const isOverBudget = actualSeconds > estimatedSeconds;
  const overUnderTime = actualSeconds - estimatedSeconds;

  return (
    <Card className={cn(isOverBudget && "border-amber-500/50")}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Time Tracking
            </CardTitle>
            <CardDescription>{taskTitle}</CardDescription>
          </div>
          {status === "done" && (
            <Badge variant={isOverBudget ? "destructive" : "success"}>
              {isOverBudget ? (
                <>
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Over budget
                </>
              ) : (
                <>
                  <TrendingDown className="h-3 w-3 mr-1" />
                  Under budget
                </>
              )}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Estimated</p>
            <p className="text-lg font-medium">{formatDuration(estimatedSeconds)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Actual</p>
            <p
              className={cn(
                "text-lg font-medium",
                isOverBudget && "text-amber-600"
              )}
            >
              {formatDuration(actualSeconds)}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className={cn(isOverBudget && "text-amber-600")}>
              {percentage}%
            </span>
          </div>
          <Progress
            value={Math.min(percentage, 100)}
            className={cn("h-2", isOverBudget && "[&>div]:bg-amber-500")}
          />
          {percentage > 100 && (
            <div
              className="h-2 rounded-full bg-red-500/30 -mt-2"
              style={{ width: `${Math.min(percentage - 100, 100)}%` }}
            />
          )}
        </div>

        {isOverBudget && (
          <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 rounded-lg p-3">
            <AlertTriangle className="h-4 w-4" />
            <span>
              Over estimate by{" "}
              <strong>{formatDuration(Math.abs(overUnderTime))}</strong>
            </span>
          </div>
        )}

        {!isOverBudget && status === "done" && (
          <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 rounded-lg p-3">
            <CheckCircle className="h-4 w-4" />
            <span>
              Completed{" "}
              <strong>{formatDuration(Math.abs(overUnderTime))}</strong> under
              estimate
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface TimeComparisonSummaryProps {
  tasks: {
    id: string;
    title: string;
    estimatedSeconds: number | null;
    actualSeconds: number;
    status: "todo" | "in_progress" | "done";
  }[];
}

export function TimeComparisonSummary({ tasks }: TimeComparisonSummaryProps) {
  const tasksWithEstimates = tasks.filter((t) => t.estimatedSeconds !== null);

  if (tasksWithEstimates.length === 0) {
    return null;
  }

  const totalEstimated = tasksWithEstimates.reduce(
    (sum, t) => sum + (t.estimatedSeconds || 0),
    0
  );
  const totalActual = tasksWithEstimates.reduce((sum, t) => sum + t.actualSeconds, 0);
  const overBudgetCount = tasksWithEstimates.filter(
    (t) => t.actualSeconds > (t.estimatedSeconds || 0) && t.status === "done"
  ).length;
  const underBudgetCount = tasksWithEstimates.filter(
    (t) => t.actualSeconds <= (t.estimatedSeconds || 0) && t.status === "done"
  ).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Time Summary
        </CardTitle>
        <CardDescription>
          Estimated vs actual time across all tasks
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">Total Estimated</p>
            <p className="text-xl font-bold">{formatDuration(totalEstimated)}</p>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">Total Tracked</p>
            <p
              className={cn(
                "text-xl font-bold",
                totalActual > totalEstimated && "text-amber-600"
              )}
            >
              {formatDuration(totalActual)}
            </p>
          </div>
        </div>

        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>
              <strong>{underBudgetCount}</strong> under budget
            </span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span>
              <strong>{overBudgetCount}</strong> over budget
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
