import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/dashboard/progress";
import { formatDuration, formatDate } from "@/lib/utils";
import {
  FolderOpen,
  Clock,
  CheckCircle,
  ListTodo,
  ArrowRight,
  Sparkles,
  Plus,
  TrendingUp,
  Calendar,
  User,
  Timer,
  Bell,
  CheckCircle2,
  Circle,
  X,
} from "lucide-react";
import { OnboardingChecklist } from "@/components/dashboard/onboarding-checklist";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentActivity } from "@/components/dashboard/recent-activity";

export default async function FreelancerDashboardPage() {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    redirect("/sign-in");
  }

  const user = await db.user.findUnique({
    where: { clerkUserId },
    include: {
      freelancerProfile: true,
    },
  });

  if (!user) {
    redirect("/onboarding");
  }

  if (user.role !== "freelancer") {
    redirect("/client/dashboard");
  }

  if (!user.freelancerProfile) {
    redirect("/freelancer/profile");
  }

  // Fetch projects with more details
  const projects = await db.project.findMany({
    where: { freelancerId: user.id },
    include: {
      client: {
        select: {
          id: true,
          email: true,
          freelancerProfile: {
            select: {
              fullName: true,
              avatarUrl: true,
            },
          },
        },
      },
      tasks: {
        select: {
          id: true,
          status: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Fetch time entries
  const timeEntries = await db.timeEntry.findMany({
    where: { userId: user.id },
    select: {
      durationSeconds: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Calculate stats
  const totalTimeSeconds = timeEntries.reduce((acc, entry) => acc + entry.durationSeconds, 0);
  const activeProjects = projects.filter((p) => p.status === "active").length;
  const totalTasks = projects.reduce((acc, p) => acc + p.tasks.length, 0);
  const completedTasks = projects.reduce(
    (acc, p) => acc + p.tasks.filter((t) => t.status === "done").length,
    0
  );

  // Check onboarding status
  const hasCompletedProfile = Boolean(
    user.freelancerProfile.fullName &&
    user.freelancerProfile.title &&
    user.freelancerProfile.bio &&
    user.freelancerProfile.skills.length > 0
  );
  const hasCreatedProject = projects.length > 0;
  const hasCreatedTask = totalTasks > 0;

  // Get first name for mobile-friendly greeting
  const firstName = user.freelancerProfile.fullName.split(" ")[0];

  return (
    <div className="space-y-6">
      {/* ========================================
          WELCOME BANNER
          Mobile: Compact with first name only
          Desktop: Full name with title
          ======================================== */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/90 via-primary to-primary/80 p-4 md:p-6 text-primary-foreground">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnY0em0wLTZoLTJ2LTRoMnY0em0tNiA2aC0ydi00aDJ2NHptMC02aC0ydi00aDJ2NHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
        <div className="relative flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span className="text-xs md:text-sm font-medium opacity-90">Welcome back</span>
            </div>
            {/* Mobile: First name only | Desktop: Full name */}
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">
              <span className="md:hidden">{firstName}</span>
              <span className="hidden md:inline">{user.freelancerProfile.fullName}</span>
            </h1>
            <p className="text-primary-foreground/80 text-sm hidden md:block">
              {user.freelancerProfile.title}
            </p>
          </div>
          <Link href="/freelancer/profile" className="hidden md:block">
            <Button variant="secondary" size="sm" className="shadow-lg">
              Edit Profile
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* ========================================
          QUICK ACTIONS BAR
          Reduces reliance on the FAB
          ======================================== */}
      <QuickActions hasProjects={hasCreatedProject} />

      {/* ========================================
          ONBOARDING CHECKLIST
          Dismissible card for new users
          ======================================== */}
      {(!hasCompletedProfile || !hasCreatedProject || !hasCreatedTask) && (
        <OnboardingChecklist
          hasCompletedProfile={hasCompletedProfile}
          hasCreatedProject={hasCreatedProject}
          hasCreatedTask={hasCreatedTask}
        />
      )}

      {/* ========================================
          STATS GRID
          - Fixed 0s time format
          - Non-wrapping labels
          - Empty state messages
          - Sparkline placeholder for trends
          ======================================== */}
      <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
        {/* Active Projects Card */}
        <Card className="relative overflow-hidden border-0 shadow-md bg-gradient-to-br from-violet-500/10 to-purple-500/5">
          <div className="absolute top-0 right-0 w-16 h-16 md:w-20 md:h-20 bg-violet-500/10 rounded-full -mr-8 -mt-8 md:-mr-10 md:-mt-10" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground whitespace-nowrap">
              Projects
            </CardTitle>
            <div className="h-8 w-8 md:h-9 md:w-9 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
              <FolderOpen className="h-4 w-4 md:h-5 md:w-5 text-violet-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {activeProjects === 0 ? (
              <div className="space-y-1">
                <div className="text-2xl md:text-3xl font-bold text-muted-foreground">—</div>
                <Link href="/freelancer/projects/new" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                  Create first <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="text-2xl md:text-3xl font-bold">{activeProjects}</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                  <span>Active</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Total Tasks Card */}
        <Card className="relative overflow-hidden border-0 shadow-md bg-gradient-to-br from-blue-500/10 to-cyan-500/5">
          <div className="absolute top-0 right-0 w-16 h-16 md:w-20 md:h-20 bg-blue-500/10 rounded-full -mr-8 -mt-8 md:-mr-10 md:-mt-10" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground whitespace-nowrap">
              Tasks
            </CardTitle>
            <div className="h-8 w-8 md:h-9 md:w-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
              <ListTodo className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {totalTasks === 0 ? (
              <div className="space-y-1">
                <div className="text-2xl md:text-3xl font-bold text-muted-foreground">—</div>
                <p className="text-xs text-muted-foreground">Add via ⌘K</p>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="text-2xl md:text-3xl font-bold">{totalTasks}</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span>All projects</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Completed Tasks Card */}
        <Card className="relative overflow-hidden border-0 shadow-md bg-gradient-to-br from-emerald-500/10 to-green-500/5">
          <div className="absolute top-0 right-0 w-16 h-16 md:w-20 md:h-20 bg-emerald-500/10 rounded-full -mr-8 -mt-8 md:-mr-10 md:-mt-10" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground whitespace-nowrap">
              Done
            </CardTitle>
            <div className="h-8 w-8 md:h-9 md:w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
              <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {completedTasks === 0 ? (
              <div className="space-y-1">
                <div className="text-2xl md:text-3xl font-bold text-muted-foreground">—</div>
                <p className="text-xs text-muted-foreground">No tasks done</p>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="text-2xl md:text-3xl font-bold">{completedTasks}</div>
                <div className="flex items-center gap-1 text-xs text-emerald-600">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Finished</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Time Tracked Card */}
        <Card className="relative overflow-hidden border-0 shadow-md bg-gradient-to-br from-amber-500/10 to-orange-500/5">
          <div className="absolute top-0 right-0 w-16 h-16 md:w-20 md:h-20 bg-amber-500/10 rounded-full -mr-8 -mt-8 md:-mr-10 md:-mt-10" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground whitespace-nowrap">
              Time
            </CardTitle>
            <div className="h-8 w-8 md:h-9 md:w-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
              <Clock className="h-4 w-4 md:h-5 md:w-5 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {totalTimeSeconds === 0 ? (
              <div className="space-y-1">
                <div className="text-2xl md:text-3xl font-bold text-muted-foreground">—</div>
                <Link href="/freelancer/time" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                  Start tracking <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="text-2xl md:text-3xl font-bold">{formatDuration(totalTimeSeconds)}</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Timer className="h-3 w-3" />
                  <span>Logged</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ========================================
          PROJECTS SECTION
          - Taller progress bars
          - Full width on desktop
          - Due date and avatar placeholders
          ======================================== */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg md:text-xl font-semibold">Your Projects</h2>
            <p className="text-xs md:text-sm text-muted-foreground">Manage and track your work</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/freelancer/projects/new">
              <Button size="sm" className="gap-2 hidden md:flex">
                <Plus className="h-4 w-4" />
                New Project
              </Button>
              <Button size="sm" className="md:hidden h-8 w-8 p-0">
                <Plus className="h-4 w-4" />
              </Button>
            </Link>
            {projects.length > 0 && (
              <Link href="/freelancer/projects">
                <Button variant="ghost" size="sm" className="text-primary hidden md:flex">
                  View all
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>

        {projects.length === 0 ? (
          <Card className="border-dashed border-2 bg-muted/30">
            <CardContent className="flex flex-col items-center justify-center py-10 md:py-12">
              <div className="h-14 w-14 md:h-16 md:w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <FolderOpen className="h-7 w-7 md:h-8 md:w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-base md:text-lg mb-1">No projects yet</h3>
              <p className="text-muted-foreground text-center text-sm max-w-sm mb-6">
                Create your first project to start organizing your work.
              </p>
              <Link href="/freelancer/projects/new">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Project
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          /* Project Cards - Full width grid */
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {projects.slice(0, 6).map((project) => {
              const projectTotalTasks = project.tasks.length;
              const projectCompletedTasks = project.tasks.filter(
                (t) => t.status === "done"
              ).length;
              const progress =
                projectTotalTasks > 0 ? (projectCompletedTasks / projectTotalTasks) * 100 : 0;

              return (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <Card className="group hover:shadow-lg hover:border-primary/50 transition-all duration-200 cursor-pointer h-full">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base md:text-lg line-clamp-1 group-hover:text-primary transition-colors">
                          {project.title}
                        </CardTitle>
                        <Badge
                          variant={
                            project.status === "active"
                              ? "default"
                              : project.status === "completed"
                              ? "success"
                              : "secondary"
                          }
                          className="shrink-0 text-xs"
                        >
                          {project.status}
                        </Badge>
                      </div>
                      <CardDescription className="line-clamp-1 text-xs md:text-sm">
                        {project.client?.email || "Solo project"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Progress Section - Taller bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs md:text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-2.5 md:h-3" />
                        <p className="text-xs text-muted-foreground">
                          {projectCompletedTasks} of {projectTotalTasks} tasks
                        </p>
                      </div>

                      {/* Project Meta - Due date & Client avatar */}
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {project.deadline
                              ? formatDate(project.deadline)
                              : "No deadline"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {/* Client Avatar Placeholder */}
                          <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                            {project.client?.email?.charAt(0)?.toUpperCase() || "S"}
                          </div>
                          <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================
          RECENT ACTIVITY SECTION
          Shows latest actions and notifications
          ======================================== */}
      <RecentActivity
        recentTimeEntries={timeEntries.slice(0, 5)}
        completedTasks={completedTasks}
        totalTasks={totalTasks}
      />
    </div>
  );
}
