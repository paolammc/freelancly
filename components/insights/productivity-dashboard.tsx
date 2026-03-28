"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDuration, formatCurrency } from "@/lib/utils";
import {
  Clock,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Calendar,
  Target,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductivityStats {
  totalTrackedSeconds: number;
  totalEstimatedSeconds: number;
  completedTasks: number;
  overBudgetTasks: number;
  underBudgetTasks: number;
  averageAccuracy: number; // percentage
  totalBillableAmount: number;
  hourlyRate: number;
  weeklyStats: {
    week: string;
    trackedSeconds: number;
    completedTasks: number;
  }[];
  projectStats: {
    projectId: string;
    projectTitle: string;
    trackedSeconds: number;
    estimatedSeconds: number;
    taskCount: number;
  }[];
}

interface ProductivityDashboardProps {
  stats: ProductivityStats;
}

export function ProductivityDashboard({ stats }: ProductivityDashboardProps) {
  const estimationAccuracy =
    stats.totalEstimatedSeconds > 0
      ? Math.round(
          (1 -
            Math.abs(stats.totalTrackedSeconds - stats.totalEstimatedSeconds) /
              stats.totalEstimatedSeconds) *
            100
        )
      : 0;

  const billableHours = stats.totalTrackedSeconds / 3600;
  const potentialEarnings = billableHours * stats.hourlyRate;

  return (
    <div className="space-y-6">
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Total Time Tracked
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatDuration(stats.totalTrackedSeconds)}
            </p>
            <p className="text-xs text-muted-foreground">
              {Math.round(billableHours * 10) / 10} hours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Tasks Completed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.completedTasks}</p>
            <p className="text-xs text-muted-foreground">
              {stats.underBudgetTasks} under budget, {stats.overBudgetTasks}{" "}
              over
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              Estimation Accuracy
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p
              className={cn(
                "text-2xl font-bold",
                estimationAccuracy >= 80
                  ? "text-green-600"
                  : estimationAccuracy >= 60
                  ? "text-amber-600"
                  : "text-red-600"
              )}
            >
              {estimationAccuracy}%
            </p>
            <p className="text-xs text-muted-foreground">
              {estimationAccuracy >= 80
                ? "Excellent"
                : estimationAccuracy >= 60
                ? "Good"
                : "Needs improvement"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              Potential Earnings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(potentialEarnings)}
            </p>
            <p className="text-xs text-muted-foreground">
              at {formatCurrency(stats.hourlyRate)}/hr
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Estimation Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Estimation Insights
          </CardTitle>
          <CardDescription>
            How well your estimates match reality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Total Estimated</span>
              </div>
              <p className="text-xl font-bold">
                {formatDuration(stats.totalEstimatedSeconds)}
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Total Tracked</span>
              </div>
              <p className="text-xl font-bold">
                {formatDuration(stats.totalTrackedSeconds)}
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Difference</span>
              </div>
              <p
                className={cn(
                  "text-xl font-bold",
                  stats.totalTrackedSeconds > stats.totalEstimatedSeconds
                    ? "text-amber-600"
                    : "text-green-600"
                )}
              >
                {stats.totalTrackedSeconds > stats.totalEstimatedSeconds
                  ? "+"
                  : "-"}
                {formatDuration(
                  Math.abs(
                    stats.totalTrackedSeconds - stats.totalEstimatedSeconds
                  )
                )}
              </p>
            </div>
          </div>

          <div className="flex gap-4 text-sm">
            <Badge variant="outline" className="gap-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              {stats.underBudgetTasks} tasks under budget
            </Badge>
            <Badge variant="outline" className="gap-1">
              <AlertTriangle className="h-3 w-3 text-amber-500" />
              {stats.overBudgetTasks} tasks over budget
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Project Breakdown */}
      {stats.projectStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Time by Project
            </CardTitle>
            <CardDescription>Distribution of tracked time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.projectStats.map((project) => {
                const percentage =
                  stats.totalTrackedSeconds > 0
                    ? Math.round(
                        (project.trackedSeconds / stats.totalTrackedSeconds) *
                          100
                      )
                    : 0;

                return (
                  <div key={project.projectId} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm">
                        {project.projectTitle}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {formatDuration(project.trackedSeconds)} ({percentage}
                        %)
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{project.taskCount} tasks</span>
                      {project.estimatedSeconds > 0 && (
                        <span>
                          Est: {formatDuration(project.estimatedSeconds)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
