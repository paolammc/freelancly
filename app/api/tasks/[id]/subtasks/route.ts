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
        subtasks: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (task.project.clientId !== user.id && task.project.freelancerId !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json(task.subtasks);
  } catch (error) {
    console.error("Error fetching subtasks:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
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

    const parentTask = await db.task.findUnique({
      where: { id },
      include: {
        project: true,
        subtasks: true,
      },
    });

    if (!parentTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (
      parentTask.project.clientId !== user.id &&
      parentTask.project.freelancerId !== user.id
    ) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await req.json();
    const { title, description } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const maxOrder = parentTask.subtasks.reduce(
      (max, s) => Math.max(max, s.order),
      0
    );

    const subtask = await db.task.create({
      data: {
        projectId: parentTask.projectId,
        parentTaskId: id,
        title,
        description: description || null,
        order: maxOrder + 1,
        assigneeUserId: parentTask.assigneeUserId,
      },
    });

    return NextResponse.json(subtask);
  } catch (error) {
    console.error("Error creating subtask:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
