import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
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

    const body = await req.json();
    const { taskId, action } = body;

    const task = await db.task.findUnique({
      where: { id: taskId },
      include: {
        project: true,
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Only the freelancer assigned to the project can track time
    if (task.project.freelancerId !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (action === "start") {
      // Check if there's already an active timer for this user
      const activeTimer = await db.timeEntry.findFirst({
        where: {
          userId: user.id,
          isActive: true,
        },
      });

      if (activeTimer) {
        return NextResponse.json(
          { error: "You already have an active timer. Stop it before starting a new one." },
          { status: 400 }
        );
      }

      const timeEntry = await db.timeEntry.create({
        data: {
          taskId,
          userId: user.id,
          startTime: new Date(),
          isActive: true,
        },
      });

      return NextResponse.json(timeEntry);
    } else if (action === "stop") {
      const activeTimer = await db.timeEntry.findFirst({
        where: {
          taskId,
          userId: user.id,
          isActive: true,
        },
      });

      if (!activeTimer) {
        return NextResponse.json({ error: "No active timer found" }, { status: 400 });
      }

      const endTime = new Date();
      const durationSeconds = Math.floor(
        (endTime.getTime() - activeTimer.startTime.getTime()) / 1000
      );

      const timeEntry = await db.timeEntry.update({
        where: { id: activeTimer.id },
        data: {
          endTime,
          durationSeconds,
          isActive: false,
        },
      });

      return NextResponse.json(timeEntry);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error managing time entry:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
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

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    const whereClause: {
      userId: string;
      task?: { projectId: string };
    } = { userId: user.id };

    if (projectId) {
      whereClause.task = { projectId };
    }

    const timeEntries = await db.timeEntry.findMany({
      where: whereClause,
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
      orderBy: {
        startTime: "desc",
      },
    });

    // Get active timer
    const activeTimer = await db.timeEntry.findFirst({
      where: {
        userId: user.id,
        isActive: true,
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json({ timeEntries, activeTimer });
  } catch (error) {
    console.error("Error fetching time entries:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
