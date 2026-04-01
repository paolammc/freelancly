import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/dashboard/progress";
import { FolderKanban, Plus } from "lucide-react";
import Link from "next/link";

export default async function ProjectsPage() {
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

  const projects = await db.project.findMany({
    where: { freelancerId: user.id },
    include: {
      client: true,
      tasks: {
        select: {
          id: true,
          status: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Manage your active and completed projects
          </p>
        </div>
        <Link href="/freelancer/projects/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </Link>
      </div>

      {projects.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <FolderKanban className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-1">No projects yet</h3>
            <p className="text-muted-foreground text-center max-w-sm mb-6">
              Create your first project to start organizing your work and tracking tasks.
            </p>
            <Link href="/freelancer/projects/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Your First Project
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const totalTasks = project.tasks.length;
            const completedTasks = project.tasks.filter((t) => t.status === "done").length;
            const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

            return (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="hover:border-primary transition-colors cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{project.title}</CardTitle>
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
                    <CardDescription>{project.client ? `Client: ${project.client.email}` : "Solo project"}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} />
                      <p className="text-sm text-muted-foreground">
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
  );
}
