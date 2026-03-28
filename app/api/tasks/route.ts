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
    const {
      projectId,
      title,
      description,
      source = "manual",
      priority,
      tags,
      estimatedSeconds,
      dueDate,
      parentTaskId,
    } = body;

    const project = await db.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check if user has access to this project
    if (project.clientId !== user.id && project.freelancerId !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const task = await db.task.create({
      data: {
        projectId,
        title,
        description: description || null,
        source,
        assigneeUserId: project.freelancerId,
        priority: priority || "medium",
        tags: tags || [],
        estimatedSeconds: estimatedSeconds || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        parentTaskId: parentTaskId || null,
      },
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
