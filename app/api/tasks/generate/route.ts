import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateTasksFromDescription } from "@/lib/ai";

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
    const { projectId } = body;

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

    // Generate tasks using AI
    const generatedTasks = await generateTasksFromDescription(
      project.title,
      project.description
    );

    // Save generated tasks to database
    const tasks = await Promise.all(
      generatedTasks.map((task) =>
        db.task.create({
          data: {
            projectId,
            title: task.title,
            description: task.description,
            source: "ai",
            assigneeUserId: project.freelancerId,
          },
        })
      )
    );

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Error generating tasks:", error);
    return NextResponse.json(
      { error: "Failed to generate tasks. Please try again." },
      { status: 500 }
    );
  }
}
