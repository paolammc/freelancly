import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckSquare, Clock, Calendar, ArrowRight } from "lucide-react";
import { PriorityBadge } from "@/components/tasks/priority-badge";
import { TagList } from "@/components/tasks/tag-input";
import { formatDuration } from "@/lib/utils";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; priority?: string; project?: string }>;
}) {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    redirect("/sign-in");
  }

  const user = await db.user.findUnique({
    where: { clerkUserId },
  });

  if (!user) {
    redirect("/onboarding");
  }

  const params = await searchParams;
  const statusFilter = params.status;
  const priorityFilter = params.priority;
  const projectFilter = params.project;

  const tasks = await db.task.findMany({
    where: {
      project: {
        freelancerId: user.id,
      },
      parentTaskId: null, // Only top-level tasks
      ...(statusFilter && { status: statusFilter as "todo" | "in_progress" | "done" }),
      ...(priorityFilter && { priority: priorityFilter as "low" | "medium" | "high" | "urgent" }),
      ...(projectFilter && { projectId: projectFilter }),
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
      subtasks: {
        select: {
          id: true,
          status: true,
        },
      },
    },
    orderBy: [
      { priority: "desc" },
      { dueDate: "asc" },
      { createdAt: "desc" },
    ],
  });

  // Get unique projects for filter
  const projects = await db.project.findMany({
    where: { freelancerId: user.id },
    select: { id: true, title: true },
    orderBy: { title: "asc" },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "done":
        return "success";
      case "in_progress":
        return "default";
      case "todo":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const todoCount = tasks.filter((t) => t.status === "todo").length;
  const inProgressCount = tasks.filter((t) => t.status === "in_progress").length;
  const doneCount = tasks.filter((t) => t.status === "done").length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
        <p className="text-muted-foreground">
          View and manage all your tasks across projects
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Link
          href={statusFilter === "todo" ? "/freelancer/tasks" : "/freelancer/tasks?status=todo"}
          className={`p-4 rounded-lg border transition-colors ${
            statusFilter === "todo" ? "bg-primary/10 border-primary" : "hover:bg-muted"
          }`}
        >
          <p className="text-2xl font-bold">{todoCount}</p>
          <p className="text-sm text-muted-foreground">Todo</p>
        </Link>
        <Link
          href={
            statusFilter === "in_progress"
              ? "/freelancer/tasks"
              : "/freelancer/tasks?status=in_progress"
          }
          className={`p-4 rounded-lg border transition-colors ${
            statusFilter === "in_progress" ? "bg-primary/10 border-primary" : "hover:bg-muted"
          }`}
        >
          <p className="text-2xl font-bold">{inProgressCount}</p>
          <p className="text-sm text-muted-foreground">In Progress</p>
        </Link>
        <Link
          href={statusFilter === "done" ? "/freelancer/tasks" : "/freelancer/tasks?status=done"}
          className={`p-4 rounded-lg border transition-colors ${
            statusFilter === "done" ? "bg-primary/10 border-primary" : "hover:bg-muted"
          }`}
        >
          <p className="text-2xl font-bold">{doneCount}</p>
          <p className="text-sm text-muted-foreground">Done</p>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-muted-foreground py-1">Filter by:</span>
        {projects.map((project) => (
          <Link
            key={project.id}
            href={
              projectFilter === project.id
                ? "/freelancer/tasks"
                : `/freelancer/tasks?project=${project.id}`
            }
          >
            <Badge
              variant={projectFilter === project.id ? "default" : "outline"}
              className="cursor-pointer"
            >
              {project.title}
            </Badge>
          </Link>
        ))}
      </div>

      {tasks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <CheckSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No tasks found</p>
            <p className="text-sm text-muted-foreground">
              {statusFilter || priorityFilter || projectFilter
                ? "Try adjusting your filters"
                : "Tasks will appear here once you have active projects"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => {
            const totalTime = task.timeEntries.reduce(
              (acc, entry) => acc + entry.durationSeconds,
              0
            );
            const subtasksDone = task.subtasks.filter(
              (s) => s.status === "done"
            ).length;
            const isOverdue =
              task.dueDate &&
              new Date(task.dueDate) < new Date() &&
              task.status !== "done";

            return (
              <Link key={task.id} href={`/projects/${task.project.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-base group-hover:text-primary transition-colors">
                            {task.title}
                          </CardTitle>
                          <PriorityBadge priority={task.priority} size="sm" />
                        </div>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <span>{task.project.title}</span>
                          {task.subtasks.length > 0 && (
                            <span className="text-xs">
                              ({subtasksDone}/{task.subtasks.length} subtasks)
                            </span>
                          )}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant={getStatusColor(task.status) as "default" | "secondary" | "success"}>
                          {task.status.replace("_", " ")}
                        </Badge>
                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                      {totalTime > 0 && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDuration(totalTime)}
                          {task.estimatedSeconds && (
                            <span className="text-xs">
                              / {formatDuration(task.estimatedSeconds)}
                            </span>
                          )}
                        </span>
                      )}
                      {task.dueDate && (
                        <span
                          className={`flex items-center gap-1 ${
                            isOverdue ? "text-destructive" : ""
                          }`}
                        >
                          <Calendar className="h-3 w-3" />
                          {new Date(task.dueDate).toLocaleDateString()}
                          {isOverdue && " (overdue)"}
                        </span>
                      )}
                      {task.tags.length > 0 && (
                        <div className="flex-1">
                          <TagList tags={task.tags} />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
