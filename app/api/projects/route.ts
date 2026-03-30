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
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const projects = await db.project.findMany({
      where: {
        OR: [{ clientId: user.id }, { freelancerId: user.id }],
      },
      include: {
        client: {
          select: {
            id: true,
            email: true,
          },
        },
        freelancer: {
          select: {
            id: true,
            email: true,
            freelancerProfile: {
              select: {
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },
        tasks: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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
    const { freelancerId, title, description, budget, deadline, meetingUrl } = body;

    // Validate required fields
    if (!title || typeof title !== "string" || title.trim() === "") {
      return NextResponse.json({ error: "Project title is required" }, { status: 400 });
    }
    if (!description || typeof description !== "string" || description.trim() === "") {
      return NextResponse.json({ error: "Project description is required" }, { status: 400 });
    }

    // Freelancers can create their own projects (self-assigned)
    if (user.role === "freelancer") {
      const project = await db.project.create({
        data: {
          clientId: user.id, // Freelancer is also the "client" for self-projects
          freelancerId: user.id,
          title,
          description,
          budget: budget || null,
          deadline: deadline ? new Date(deadline) : null,
          meetingUrl: meetingUrl || null,
        },
        include: {
          client: true,
          freelancer: {
            include: {
              freelancerProfile: true,
            },
          },
        },
      });

      return NextResponse.json(project);
    }

    // Clients create projects with freelancers
    if (user.role !== "client") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const freelancer = await db.user.findUnique({
      where: { id: freelancerId },
    });

    if (!freelancer || freelancer.role !== "freelancer") {
      return NextResponse.json({ error: "Invalid freelancer" }, { status: 400 });
    }

    const project = await db.project.create({
      data: {
        clientId: user.id,
        freelancerId,
        title,
        description,
        budget: budget || null,
        deadline: deadline ? new Date(deadline) : null,
        meetingUrl: meetingUrl || null,
      },
      include: {
        client: true,
        freelancer: {
          include: {
            freelancerProfile: true,
          },
        },
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
