import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency, formatDate, formatDuration } from "@/lib/utils";
import { ArrowLeft, Calendar, DollarSign, Video } from "lucide-react";
import { TaskList } from "@/components/projects/task-list";
import { GenerateTasksButton } from "@/components/projects/generate-tasks-button";
import { AddTaskForm } from "@/components/projects/add-task-form";
import { TaskBoard } from "@/components/tasks/task-board";
import { AIToolsPanel } from "@/components/projects/ai-tools-panel";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    redirect("/sign-in");
  }

  const currentUser = await db.user.findUnique({
    where: { clerkUserId },
  });

  if (!currentUser) {
    redirect("/onboarding");
  }

  const { id } = await params;

  const project = await db.project.findUnique({
    where: { id },
    include: {
      client: true,
      freelancer: {
        include: {
          freelancerProfile: true,
        },
      },
      tasks: {
        include: {
          timeEntries: {
            select: {
              durationSeconds: true,
              isActive: true,
              startTime: true,
              userId: true,
            },
          },
          subtasks: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
          comments: {
            include: {
              user: {
                select: {
                  email: true,
                  freelancerProfile: {
                    select: {
                      fullName: true,
                      avatarUrl: true,
                    },
                  },
                },
              },
            },
            orderBy: { createdAt: "asc" },
          },
        },
        where: {
          parentTaskId: null, // Only fetch top-level tasks
        },
        orderBy: { order: "asc" },
      },
      roadmaps: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      prds: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!project) {
    notFound();
  }

  // Check access
  if (project.clientId !== currentUser.id && project.freelancerId !== currentUser.id) {
    notFound();
  }

  const isClient = currentUser.role === "client";
  const isFreelancer = currentUser.role === "freelancer";

  const totalTasks = project.tasks.length;
  const completedTasks = project.tasks.filter((t) => t.status === "done").length;
  const inProgressTasks = project.tasks.filter((t) => t.status === "in_progress").length;
  const todoTasks = project.tasks.filter((t) => t.status === "todo").length;

  const totalTimeSeconds = project.tasks.reduce((acc, task) => {
    return (
      acc +
      task.timeEntries.reduce((taskAcc, entry) => taskAcc + entry.durationSeconds, 0)
    );
  }, 0);

  // Find active timer for current user
  const activeTimerTaskId = project.tasks.find((task) =>
    task.timeEntries.some(
      (entry) => entry.isActive && entry.userId === currentUser.id
    )
  )?.id;

  const backUrl = isClient ? "/client/dashboard" : "/freelancer/dashboard";

  return (
    <div className="space-y-8">
      <Link
        href={backUrl}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Link>

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">{project.title}</h1>
            <Badge
              variant={
                project.status === "active"
                  ? "default"
                  : project.status === "completed"
                  ? "success"
                  : "secondary"
              }
            >
              {project.status}
            </Badge>
          </div>
          <p className="text-muted-foreground max-w-2xl">{project.description}</p>
        </div>

        {project.meetingUrl && (
          <a
            href={project.meetingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            <Video className="h-4 w-4" />
            Join Meeting
          </a>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>
              {isClient ? "Freelancer" : "Client"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage
                  src={
                    isClient
                      ? project.freelancer.freelancerProfile?.avatarUrl || undefined
                      : undefined
                  }
                />
                <AvatarFallback>
                  {(isClient
                    ? project.freelancer.freelancerProfile?.fullName ||
                      project.freelancer.email
                    : project.client?.email || "S"
                  )
                    .charAt(0)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">
                  {isClient
                    ? project.freelancer.freelancerProfile?.fullName ||
                      project.freelancer.email
                    : project.client?.email || "Solo project"}
                </p>
                {isClient && project.freelancer.freelancerProfile?.title && (
                  <p className="text-xs text-muted-foreground">
                    {project.freelancer.freelancerProfile.title}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {project.budget && (
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                Budget
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold">
                {formatCurrency(Number(project.budget))}
              </p>
            </CardContent>
          </Card>
        )}

        {project.deadline && (
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Deadline
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold">{formatDate(project.deadline)}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Time Tracked</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{formatDuration(totalTimeSeconds)}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="board" className="space-y-6">
        <TabsList>
          <TabsTrigger value="board">Board</TabsTrigger>
          <TabsTrigger value="tasks">
            List ({totalTasks})
          </TabsTrigger>
          <TabsTrigger value="ai-tools">AI Tools</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="board" className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{todoTasks} Todo</span>
              <span>{inProgressTasks} In Progress</span>
              <span>{completedTasks} Done</span>
            </div>
            <div className="flex gap-2">
              <AddTaskForm projectId={project.id} />
              <GenerateTasksButton projectId={project.id} hasExistingTasks={totalTasks > 0} />
            </div>
          </div>

          <TaskBoard
            tasks={project.tasks.map((task) => ({
              ...task,
              dueDate: task.dueDate?.toISOString() || null,
              comments: task.comments.map((c) => ({
                ...c,
                createdAt: c.createdAt.toISOString(),
              })),
            }))}
            projectId={project.id}
            editable={isFreelancer}
          />
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{todoTasks} Todo</span>
              <span>{inProgressTasks} In Progress</span>
              <span>{completedTasks} Done</span>
            </div>
            <div className="flex gap-2">
              <AddTaskForm projectId={project.id} />
              <GenerateTasksButton projectId={project.id} hasExistingTasks={totalTasks > 0} />
            </div>
          </div>

          <TaskList
            tasks={project.tasks}
            isFreelancer={isFreelancer}
            currentUserId={currentUser.id}
            activeTimerTaskId={activeTimerTaskId}
          />
        </TabsContent>

        <TabsContent value="ai-tools" className="space-y-6">
          <AIToolsPanel
            projectId={project.id}
            initialRoadmap={
              project.roadmaps[0]
                ? {
                    id: project.roadmaps[0].id,
                    title: project.roadmaps[0].title,
                    description: project.roadmaps[0].description,
                    phases: project.roadmaps[0].phases as any,
                    createdAt: project.roadmaps[0].createdAt.toISOString(),
                  }
                : null
            }
            initialPRD={
              project.prds[0]
                ? {
                    id: project.prds[0].id,
                    title: project.prds[0].title,
                    problem: project.prds[0].problem,
                    goals: project.prds[0].goals,
                    features: project.prds[0].features as any,
                    userFlows: project.prds[0].userFlows as any,
                    metrics: project.prds[0].metrics as any,
                    content: project.prds[0].content,
                    createdAt: project.prds[0].createdAt.toISOString(),
                  }
                : null
            }
          />
        </TabsContent>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Project Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Overall Progress</span>
                  <span>
                    {totalTasks > 0
                      ? Math.round((completedTasks / totalTasks) * 100)
                      : 0}
                    %
                  </span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{
                      width: `${
                        totalTasks > 0
                          ? (completedTasks / totalTasks) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4">
                <div className="text-center p-4 bg-secondary/50 rounded-lg">
                  <p className="text-2xl font-bold">{todoTasks}</p>
                  <p className="text-sm text-muted-foreground">Todo</p>
                </div>
                <div className="text-center p-4 bg-secondary/50 rounded-lg">
                  <p className="text-2xl font-bold">{inProgressTasks}</p>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                </div>
                <div className="text-center p-4 bg-secondary/50 rounded-lg">
                  <p className="text-2xl font-bold">{completedTasks}</p>
                  <p className="text-sm text-muted-foreground">Done</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
