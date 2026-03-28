import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generatePRD } from "@/lib/ai";

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
        prds: {
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

    const prd = project.prds[0] || null;

    return NextResponse.json(prd);
  } catch (error) {
    console.error("Error fetching PRD:", error);
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

    // Generate PRD using AI
    const generatedPRD = await generatePRD(project.title, project.description);

    // Save to database
    const prd = await db.pRD.create({
      data: {
        projectId: id,
        title: generatedPRD.title,
        problem: generatedPRD.problem,
        goals: generatedPRD.goals.join("\n"),
        features: generatedPRD.features as unknown as object,
        userFlows: generatedPRD.userFlows as unknown as object,
        metrics: generatedPRD.metrics as unknown as object,
        content: generatedPRD.content,
      },
    });

    return NextResponse.json(prd);
  } catch (error) {
    console.error("Error creating PRD:", error);
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
    const { prdId, title, problem, goals, features, userFlows, metrics, content } = body;

    const prd = await db.pRD.findUnique({
      where: { id: prdId },
      include: { project: true },
    });

    if (!prd) {
      return NextResponse.json({ error: "PRD not found" }, { status: 404 });
    }

    if (prd.project.clientId !== user.id && prd.project.freelancerId !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const updatedPRD = await db.pRD.update({
      where: { id: prdId },
      data: {
        ...(title && { title }),
        ...(problem !== undefined && { problem }),
        ...(goals !== undefined && { goals }),
        ...(features !== undefined && { features }),
        ...(userFlows !== undefined && { userFlows }),
        ...(metrics !== undefined && { metrics }),
        ...(content !== undefined && { content }),
      },
    });

    return NextResponse.json(updatedPRD);
  } catch (error) {
    console.error("Error updating PRD:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
