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
    console.log("POST /api/projects - Received body:", JSON.stringify(body));
    console.log("POST /api/projects - User:", { id: user.id, role: user.role });

    const { freelancerId, title, description, projectType, budget, startDate, deadline, meetingUrl } = body;

    // Validate required fields
    if (!title || typeof title !== "string" || title.trim() === "") {
      console.log("POST /api/projects - Validation failed: title missing or invalid");
      return NextResponse.json({ error: "Project title is required" }, { status: 400 });
    }
    if (!description || typeof description !== "string" || description.trim() === "") {
      console.log("POST /api/projects - Validation failed: description missing or invalid");
      return NextResponse.json({ error: "Project description is required" }, { status: 400 });
    }

    // Validate project type
    const validProjectTypes = ["client", "solo", "solo_invested"];
    const finalProjectType = validProjectTypes.includes(projectType) ? projectType : "solo";

    // Freelancers can create their own projects (self-assigned)
    if (user.role === "freelancer") {
      const project = await db.project.create({
        data: {
          // For client projects, freelancer is both client and freelancer for now
          // For solo projects, clientId is undefined (optional)
          clientId: finalProjectType === "client" ? user.id : undefined,
          freelancerId: user.id,
          title,
          description,
          projectType: finalProjectType,
          budget: budget || null,
          startDate: startDate ? new Date(startDate) : null,
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
      console.log("POST /api/projects - User role is not client:", user.role);
      return NextResponse.json({
        error: "Only clients can create projects with freelancers. Please use the freelancer project form instead."
      }, { status: 403 });
    }

    if (!freelancerId) {
      console.log("POST /api/projects - No freelancerId provided for client");
      return NextResponse.json({ error: "Please select a freelancer for your project" }, { status: 400 });
    }

    const freelancer = await db.user.findUnique({
      where: { id: freelancerId },
    });

    if (!freelancer) {
      console.log("POST /api/projects - Freelancer not found:", freelancerId);
      return NextResponse.json({ error: "Freelancer not found. Please select a valid freelancer." }, { status: 400 });
    }

    if (freelancer.role !== "freelancer") {
      console.log("POST /api/projects - Selected user is not a freelancer:", freelancer.role);
      return NextResponse.json({ error: "Selected user is not a freelancer" }, { status: 400 });
    }

    const project = await db.project.create({
      data: {
        clientId: user.id,
        freelancerId,
        title,
        description,
        projectType: "client", // Client-created projects are always client type
        budget: budget || null,
        startDate: startDate ? new Date(startDate) : null,
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
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Internal server error: ${errorMessage}` }, { status: 500 });
  }
}
