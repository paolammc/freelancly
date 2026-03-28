import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role !== "freelancer") {
      return NextResponse.json(
        { error: "Only freelancers can access productivity insights" },
        { status: 403 }
      );
    }

    const hourlyRate = user.freelancerProfile
      ? Number(user.freelancerProfile.hourlyRate)
      : 0;

    // Get all tasks with time entries
    const tasks = await db.task.findMany({
      where: {
        project: {
          freelancerId: user.id,
        },
        parentTaskId: null, // Only top-level tasks
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
            startTime: true,
          },
        },
      },
    });

    // Calculate stats
    let totalTrackedSeconds = 0;
    let totalEstimatedSeconds = 0;
    let completedTasks = 0;
    let overBudgetTasks = 0;
    let underBudgetTasks = 0;

    const projectMap = new Map<
      string,
      {
        projectId: string;
        projectTitle: string;
        trackedSeconds: number;
        estimatedSeconds: number;
        taskCount: number;
      }
    >();

    for (const task of tasks) {
      const taskTrackedSeconds = task.timeEntries.reduce(
        (sum, entry) => sum + entry.durationSeconds,
        0
      );

      totalTrackedSeconds += taskTrackedSeconds;

      if (task.estimatedSeconds) {
        totalEstimatedSeconds += task.estimatedSeconds;
      }

      if (task.status === "done") {
        completedTasks++;
        if (task.estimatedSeconds) {
          if (taskTrackedSeconds > task.estimatedSeconds) {
            overBudgetTasks++;
          } else {
            underBudgetTasks++;
          }
        }
      }

      // Update project stats
      const projectId = task.project.id;
      const existing = projectMap.get(projectId);
      if (existing) {
        existing.trackedSeconds += taskTrackedSeconds;
        existing.estimatedSeconds += task.estimatedSeconds || 0;
        existing.taskCount++;
      } else {
        projectMap.set(projectId, {
          projectId,
          projectTitle: task.project.title,
          trackedSeconds: taskTrackedSeconds,
          estimatedSeconds: task.estimatedSeconds || 0,
          taskCount: 1,
        });
      }
    }

    // Calculate weekly stats (last 4 weeks)
    const weeklyStats: {
      week: string;
      trackedSeconds: number;
      completedTasks: number;
    }[] = [];

    const now = new Date();
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i + 1) * 7);
      const weekEnd = new Date(now);
      weekEnd.setDate(now.getDate() - i * 7);

      let weekTrackedSeconds = 0;
      let weekCompletedTasks = 0;

      for (const task of tasks) {
        for (const entry of task.timeEntries) {
          const entryDate = new Date(entry.startTime);
          if (entryDate >= weekStart && entryDate < weekEnd) {
            weekTrackedSeconds += entry.durationSeconds;
          }
        }
      }

      weeklyStats.push({
        week: weekStart.toISOString().split("T")[0],
        trackedSeconds: weekTrackedSeconds,
        completedTasks: weekCompletedTasks,
      });
    }

    // Calculate average accuracy
    const tasksWithEstimates = tasks.filter(
      (t) => t.estimatedSeconds && t.status === "done"
    );
    let averageAccuracy = 0;
    if (tasksWithEstimates.length > 0) {
      const accuracies = tasksWithEstimates.map((task) => {
        const tracked = task.timeEntries.reduce(
          (sum, e) => sum + e.durationSeconds,
          0
        );
        const estimated = task.estimatedSeconds!;
        return 1 - Math.abs(tracked - estimated) / estimated;
      });
      averageAccuracy = Math.round(
        (accuracies.reduce((sum, a) => sum + a, 0) / accuracies.length) * 100
      );
    }

    const totalBillableAmount = (totalTrackedSeconds / 3600) * hourlyRate;

    const stats = {
      totalTrackedSeconds,
      totalEstimatedSeconds,
      completedTasks,
      overBudgetTasks,
      underBudgetTasks,
      averageAccuracy,
      totalBillableAmount,
      hourlyRate,
      weeklyStats: weeklyStats.reverse(),
      projectStats: Array.from(projectMap.values()).sort(
        (a, b) => b.trackedSeconds - a.trackedSeconds
      ),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching productivity insights:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
