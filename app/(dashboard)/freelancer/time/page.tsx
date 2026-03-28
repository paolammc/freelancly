import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Clock, TrendingUp, CheckCircle, AlertTriangle, Target, DollarSign } from "lucide-react";
import { formatDuration, formatCurrency } from "@/lib/utils";
import { TimeComparisonSummary } from "@/components/time/time-comparison-card";
import { cn } from "@/lib/utils";

export default async function TimePage() {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    redirect("/sign-in");
  }

  const user = await db.user.findUnique({
    where: { clerkUserId },
    include: {
      freelancerProfile: {
        select: { hourlyRate: true },
      },
    },
  });

  if (!user) {
    redirect("/onboarding");
  }

  const hourlyRate = user.freelancerProfile
    ? Number(user.freelancerProfile.hourlyRate)
    : 0;

  const timeEntries = await db.timeEntry.findMany({
    where: { userId: user.id },
    include: {
      task: {
        select: {
          id: true,
          title: true,
          status: true,
          estimatedSeconds: true,
          project: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
    },
    orderBy: { startTime: "desc" },
  });

  // Get all tasks with time entries for insights
  const tasks = await db.task.findMany({
    where: {
      project: {
        freelancerId: user.id,
      },
      parentTaskId: null,
    },
    include: {
      project: {
        select: {
          id: true,
          title: true,
        },
      },
      timeEntries: {
        select: {
          durationSeconds: true,
        },
      },
    },
  });

  const totalTimeSeconds = timeEntries.reduce((acc, entry) => acc + entry.durationSeconds, 0);
  const billableHours = totalTimeSeconds / 3600;
  const potentialEarnings = billableHours * hourlyRate;

  // Calculate productivity metrics
  const tasksWithEstimates = tasks.filter((t) => t.estimatedSeconds !== null);
  const totalEstimatedSeconds = tasksWithEstimates.reduce(
    (sum, t) => sum + (t.estimatedSeconds || 0),
    0
  );

  const completedTasks = tasks.filter((t) => t.status === "done").length;
  const overBudgetTasks = tasksWithEstimates.filter((t) => {
    const tracked = t.timeEntries.reduce((sum, e) => sum + e.durationSeconds, 0);
    return tracked > (t.estimatedSeconds || 0) && t.status === "done";
  }).length;
  const underBudgetTasks = tasksWithEstimates.filter((t) => {
    const tracked = t.timeEntries.reduce((sum, e) => sum + e.durationSeconds, 0);
    return tracked <= (t.estimatedSeconds || 0) && t.status === "done";
  }).length;

  // Calculate estimation accuracy
  const completedWithEstimates = tasksWithEstimates.filter(
    (t) => t.status === "done"
  );
  let estimationAccuracy = 0;
  if (completedWithEstimates.length > 0) {
    const accuracies = completedWithEstimates.map((task) => {
      const tracked = task.timeEntries.reduce((sum, e) => sum + e.durationSeconds, 0);
      const estimated = task.estimatedSeconds!;
      return Math.max(0, 1 - Math.abs(tracked - estimated) / estimated);
    });
    estimationAccuracy = Math.round(
      (accuracies.reduce((sum, a) => sum + a, 0) / accuracies.length) * 100
    );
  }

  // Prepare tasks data for TimeComparisonSummary
  const tasksForComparison = tasks.map((task) => ({
    id: task.id,
    title: task.title,
    estimatedSeconds: task.estimatedSeconds,
    actualSeconds: task.timeEntries.reduce((sum, e) => sum + e.durationSeconds, 0),
    status: task.status as "todo" | "in_progress" | "done",
  }));

  // Group entries by project
  const projectTimeMap = new Map<string, { title: string; seconds: number }>();
  for (const entry of timeEntries) {
    if (entry.task?.project) {
      const existing = projectTimeMap.get(entry.task.project.id);
      if (existing) {
        existing.seconds += entry.durationSeconds;
      } else {
        projectTimeMap.set(entry.task.project.id, {
          title: entry.task.project.title,
          seconds: entry.durationSeconds,
        });
      }
    }
  }
  const projectBreakdown = Array.from(projectTimeMap.entries())
    .map(([id, data]) => ({
      id,
      ...data,
      percentage: Math.round((data.seconds / totalTimeSeconds) * 100),
    }))
    .sort((a, b) => b.seconds - a.seconds);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Time Tracking</h1>
          <p className="text-muted-foreground">
            Track and manage your time across all projects
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Total Tracked
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatDuration(totalTimeSeconds)}</p>
            <p className="text-xs text-muted-foreground">
              {Math.round(billableHours * 10) / 10} billable hours
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
              Based on {completedWithEstimates.length} completed tasks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Task Performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                {underBudgetTasks} under
              </Badge>
              <Badge variant="outline" className="text-amber-600">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {overBudgetTasks} over
              </Badge>
            </div>
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
              at {formatCurrency(hourlyRate)}/hr
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="entries" className="space-y-6">
        <TabsList>
          <TabsTrigger value="entries">Recent Entries</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="projects">By Project</TabsTrigger>
        </TabsList>

        <TabsContent value="entries">
          {timeEntries.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No time entries yet</p>
                <p className="text-sm text-muted-foreground">
                  Start tracking time on your tasks to see entries here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {timeEntries.slice(0, 20).map((entry) => {
                const task = entry.task;
                const isOverBudget =
                  task?.estimatedSeconds &&
                  entry.durationSeconds > task.estimatedSeconds / 2;

                return (
                  <Card key={entry.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-base">
                              {task?.title || "Untitled Task"}
                            </CardTitle>
                            {task?.estimatedSeconds && (
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-xs",
                                  isOverBudget && "text-amber-600 border-amber-300"
                                )}
                              >
                                Est: {formatDuration(task.estimatedSeconds)}
                              </Badge>
                            )}
                          </div>
                          <CardDescription>
                            {task?.project?.title || "No Project"}
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            {formatDuration(entry.durationSeconds)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(entry.startTime).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <TimeComparisonSummary tasks={tasksForComparison} />

          {/* Estimation vs Actual */}
          <Card>
            <CardHeader>
              <CardTitle>Estimation Analysis</CardTitle>
              <CardDescription>
                How your estimates compare to actual time spent
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">
                    Total Estimated
                  </p>
                  <p className="text-xl font-bold">
                    {formatDuration(totalEstimatedSeconds)}
                  </p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">
                    Total Tracked
                  </p>
                  <p className="text-xl font-bold">
                    {formatDuration(totalTimeSeconds)}
                  </p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Variance</p>
                  <p
                    className={cn(
                      "text-xl font-bold",
                      totalTimeSeconds > totalEstimatedSeconds
                        ? "text-amber-600"
                        : "text-green-600"
                    )}
                  >
                    {totalTimeSeconds > totalEstimatedSeconds ? "+" : "-"}
                    {formatDuration(
                      Math.abs(totalTimeSeconds - totalEstimatedSeconds)
                    )}
                  </p>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                {totalTimeSeconds > totalEstimatedSeconds ? (
                  <p className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    You're tracking more time than estimated. Consider adjusting
                    your estimates upward.
                  </p>
                ) : (
                  <p className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    You're completing tasks within your estimates. Great job!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects">
          {projectBreakdown.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No project data yet</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Time by Project</CardTitle>
                <CardDescription>
                  Distribution of your tracked time
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {projectBreakdown.map((project) => (
                  <div key={project.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{project.title}</span>
                      <span className="text-muted-foreground">
                        {formatDuration(project.seconds)} ({project.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${project.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
