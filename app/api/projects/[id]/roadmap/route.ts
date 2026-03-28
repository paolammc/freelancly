import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateRoadmap } from "@/lib/ai";

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

    const roadmap = project.roadmaps[0] || null;

    return NextResponse.json(roadmap);
  } catch (error) {
    console.error("Error fetching roadmap:", error);
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

    const project = await db.project.findUnique({
      where: { id },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.clientId !== user.id && project.freelancerId !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Generate roadmap using AI
    const generatedRoadmap = await generateRoadmap(
      project.title,
      project.description,
      project.deadline?.toISOString()
    );

    // Save to database
    const roadmap = await db.roadmap.create({
      data: {
        projectId: id,
        title: generatedRoadmap.title,
        description: generatedRoadmap.description,
        phases: generatedRoadmap.phases as unknown as object,
      },
    });

    return NextResponse.json(roadmap);
  } catch (error) {
    console.error("Error creating roadmap:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
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
    const body = await req.json();
    const { roadmapId, title, description, phases } = body;

    const roadmap = await db.roadmap.findUnique({
      where: { id: roadmapId },
      include: { project: true },
    });

    if (!roadmap) {
      return NextResponse.json({ error: "Roadmap not found" }, { status: 404 });
    }

    if (
      roadmap.project.clientId !== user.id &&
      roadmap.project.freelancerId !== user.id
    ) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const updatedRoadmap = await db.roadmap.update({
      where: { id: roadmapId },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(phases && { phases }),
      },
    });

    return NextResponse.json(updatedRoadmap);
  } catch (error) {
    console.error("Error updating roadmap:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
