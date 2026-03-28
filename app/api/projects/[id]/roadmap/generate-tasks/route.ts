import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateTasksFromRoadmap, Roadmap, RoadmapPhase } from "@/lib/ai";

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

    const project = await db.project.findUnique({
      where: { id },
      include: {
        roadmaps: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.clientId !== user.id && project.freelancerId !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const roadmapRecord = project.roadmaps[0];
    if (!roadmapRecord) {
      return NextResponse.json(
        { error: "No roadmap found for this project" },
        { status: 404 }
      );
    }

    // Convert database record to Roadmap type
    const roadmap: Roadmap = {
      title: roadmapRecord.title,
      description: roadmapRecord.description || "",
      phases: roadmapRecord.phases as unknown as RoadmapPhase[],
    };

    // Generate tasks from roadmap
    const generatedTasks = await generateTasksFromRoadmap(roadmap);

    // Create tasks in database
    const createdTasks = [];
    let order = 0;

    for (const task of generatedTasks) {
      const createdTask = await db.task.create({
        data: {
          projectId: id,
          title: task.title,
          description: task.description,
          source: "ai",
          assigneeUserId: project.freelancerId,
          order: order++,
        },
      });
      createdTasks.push(createdTask);
    }

    return NextResponse.json({
      message: `Created ${createdTasks.length} tasks from roadmap`,
      tasks: createdTasks,
    });
  } catch (error) {
    console.error("Error generating tasks from roadmap:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
