import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { formatDuration } from "@/lib/utils";

export default async function TimePage() {
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

  const timeEntries = await db.timeEntry.findMany({
    where: { userId: user.id },
    include: {
      task: {
        select: {
          id: true,
          title: true,
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
    take: 20,
  });

  const totalTimeSeconds = timeEntries.reduce((acc, entry) => acc + entry.durationSeconds, 0);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Time Tracking</h1>
          <p className="text-muted-foreground">
            Track and manage your time across all projects
          </p>
        </div>
        <Card className="px-6 py-3">
          <div className="text-sm text-muted-foreground">Total Tracked</div>
          <div className="text-2xl font-bold">{formatDuration(totalTimeSeconds)}</div>
        </Card>
      </div>

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
        <div className="space-y-4">
          {timeEntries.map((entry) => (
            <Card key={entry.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">
                      {entry.task?.title || "Untitled Task"}
                    </CardTitle>
                    <CardDescription>
                      {entry.task?.project?.title || "No Project"}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatDuration(entry.durationSeconds)}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(entry.startTime).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </CardHeader>
              {entry.description && (
                <CardContent>
                  <p className="text-sm text-muted-foreground">{entry.description}</p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
