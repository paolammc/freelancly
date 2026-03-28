import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { clerkUserId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { id } = await params;

    const task = await db.task.findUnique({
      where: { id },
      include: {
        project: true,
        timeEntries: {
          select: {
            id: true,
            durationSeconds: true,
            startTime: true,
            endTime: true,
            isActive: true,
          },
          orderBy: { startTime: "desc" },
        },
        subtasks: {
          include: {
            timeEntries: {
              select: {
                durationSeconds: true,
              },
            },
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (task.project.clientId !== user.id && task.project.freelancerId !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Calculate totals
    const totalTrackedSeconds = task.timeEntries.reduce(
      (sum, entry) => sum + entry.durationSeconds,
      0
    );

    const subtasksTotalSeconds = task.subtasks.reduce(
      (sum, subtask) =>
        sum +
        subtask.timeEntries.reduce((s, entry) => s + entry.durationSeconds, 0),
      0
    );

    // Calculate billable amount if we have an hourly rate
    const hourlyRate = await db.freelancerProfile.findUnique({
      where: { userId: task.project.freelancerId },
      select: { hourlyRate: true },
    });

    const billableHours = (totalTrackedSeconds + subtasksTotalSeconds) / 3600;
    const billableAmount = hourlyRate
      ? billableHours * Number(hourlyRate.hourlyRate)
      : null;

    const summary = {
      taskId: task.id,
      taskTitle: task.title,
      status: task.status,
      estimatedSeconds: task.estimatedSeconds,
      totalTrackedSeconds,
      subtasksTotalSeconds,
      grandTotalSeconds: totalTrackedSeconds + subtasksTotalSeconds,
      timeEntries: task.timeEntries,
      isOverBudget:
        task.estimatedSeconds !== null &&
        totalTrackedSeconds > task.estimatedSeconds,
      budgetVariance: task.estimatedSeconds
        ? totalTrackedSeconds - task.estimatedSeconds
        : null,
      percentageUsed: task.estimatedSeconds
        ? Math.round((totalTrackedSeconds / task.estimatedSeconds) * 100)
        : null,
      billableAmount,
      billableHours,
      hourlyRate: hourlyRate ? Number(hourlyRate.hourlyRate) : null,
    };

    return NextResponse.json(summary);
  } catch (error) {
    console.error("Error fetching time summary:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
