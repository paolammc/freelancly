import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/dashboard/progress";
import { ClientOnboardingChecklist } from "@/components/client/onboarding-checklist";
import {
  FolderOpen,
  Clock,
  CheckCircle,
  Users,
  ArrowRight,
  FileText,
  MessageSquare,
  Sparkles,
} from "lucide-react";

export default async function ClientDashboardPage() {
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

  if (user.role !== "client") {
    redirect("/freelancer/dashboard");
  }

  const projects = await db.project.findMany({
    where: { clientId: user.id },
    include: {
      freelancer: {
        include: {
          freelancerProfile: true,
        },
      },
      tasks: {
        select: {
          id: true,
          status: true,
        },
      },
      estimates: {
        where: {
          status: { in: ["sent", "approved"] },
        },
        select: {
          id: true,
          status: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Get unread message count
  const unreadMessages = await db.message.count({
    where: {
      projectId: { in: projects.map((p) => p.id) },
      senderId: { not: user.id },
      isRead: false,
    },
  });

  // Get pending estimates
  const pendingEstimates = projects.reduce((acc, project) => {
    return acc + project.estimates.filter((e) => e.status === "sent").length;
  }, 0);

  const totalProjects = projects.length;
  const activeProjects = projects.filter((p) => p.status === "active").length;
  const completedProjects = projects.filter((p) => p.status === "completed").length;

  // Get the primary project and freelancer for the welcome banner
  const primaryProject = projects[0];
  const primaryFreelancer = primaryProject?.freelancer;

  // Onboarding progress
  const hasViewedEstimate = projects.some((p) =>
    p.estimates.some((e) => e.status === "approved")
  );

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      {primaryProject && (
        <Card className="bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 border-violet-200/50 dark:border-violet-800/50">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold">
                    Welcome, {user.email.split("@")[0]}!
                  </h1>
                  <p className="text-muted-foreground">
                    You&apos;re working with{" "}
                    <span className="font-medium text-foreground">
                      {primaryFreelancer?.freelancerProfile?.fullName ||
                        primaryFreelancer?.email}
                    </span>{" "}
                    on {totalProjects} project{totalProjects !== 1 ? "s" : ""}.
                  </p>
                </div>
              </div>
              <Link href={`/projects/${primaryProject.id}`}>
                <Button className="gap-2">
                  View Project
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Onboarding Checklist */}
      <ClientOnboardingChecklist
        hasProject={totalProjects > 0}
        hasViewedEstimate={hasViewedEstimate}
        hasSentMessage={false} // Will be tracked via localStorage
      />

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProjects}</div>
            <p className="text-xs text-muted-foreground">
              {completedProjects} completed
            </p>
          </CardContent>
        </Card>

        <Link href="/client/estimates" className="block">
          <Card className={`h-full transition-colors cursor-pointer ${pendingEstimates > 0 ? "border-amber-200 bg-amber-50/50 hover:border-amber-300 dark:bg-amber-900/10 dark:border-amber-800" : "hover:border-primary"}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Estimates</CardTitle>
              <FileText className={`h-4 w-4 ${pendingEstimates > 0 ? "text-amber-500" : "text-muted-foreground"}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingEstimates}</div>
              <p className="text-xs text-muted-foreground">
                {pendingEstimates > 0 ? "Awaiting your review" : "All reviewed"}
              </p>
            </CardContent>
          </Card>
        </Link>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unreadMessages}</div>
            <p className="text-xs text-muted-foreground">
              {unreadMessages > 0 ? "Unread messages" : "All caught up"}
            </p>
          </CardContent>
        </Card>

        <Link href="/client/inbox" className="block">
          <Card className="h-full hover:border-primary transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inbox</CardTitle>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Message your freelancer
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Projects List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Your Projects</h2>
          <Link href="/marketplace">
            <Button variant="outline" size="sm">
              <Users className="mr-2 h-4 w-4" />
              Find Freelancers
            </Button>
          </Link>
        </div>

        {projects.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <FolderOpen className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-1">No projects yet</h3>
              <p className="text-muted-foreground text-center mb-6 max-w-sm">
                You&apos;ll see your projects here once a freelancer invites you
                to collaborate.
              </p>
              <Link href="/marketplace">
                <Button>Browse Freelancers</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => {
              const totalTasks = project.tasks.length;
              const completedTasks = project.tasks.filter(
                (t) => t.status === "done"
              ).length;
              const progress =
                totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
              const hasPendingEstimate = project.estimates.some(
                (e) => e.status === "sent"
              );

              return (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg line-clamp-1">
                            {project.title}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <Avatar className="h-5 w-5">
                              <AvatarImage
                                src={
                                  project.freelancer.freelancerProfile?.avatarUrl ||
                                  undefined
                                }
                              />
                              <AvatarFallback className="text-xs">
                                {(
                                  project.freelancer.freelancerProfile?.fullName ||
                                  project.freelancer.email
                                )
                                  .charAt(0)
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate">
                              {project.freelancer.freelancerProfile?.fullName ||
                                project.freelancer.email}
                            </span>
                          </CardDescription>
                        </div>
                        <div className="flex flex-col items-end gap-1">
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
                          {hasPendingEstimate && (
                            <Badge
                              variant="outline"
                              className="text-amber-600 border-amber-300"
                            >
                              Estimate pending
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">
                            {Math.round(progress)}%
                          </span>
                        </div>
                        <Progress value={progress} />
                        <p className="text-xs text-muted-foreground">
                          {completedTasks} of {totalTasks} tasks completed
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
