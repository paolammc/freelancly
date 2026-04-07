import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/proposals - List proposals for current user
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
    const status = searchParams.get("status");

    const whereClause: any = {};

    // Filter by role
    if (user.role === "client") {
      whereClause.clientId = user.id;
    } else if (user.role === "freelancer") {
      whereClause.freelancerId = user.id;
    } else {
      return NextResponse.json({ error: "Invalid role" }, { status: 403 });
    }

    // Filter by status if provided
    if (status && ["PENDING", "ACCEPTED", "DECLINED", "WITHDRAWN"].includes(status)) {
      whereClause.status = status;
    }

    const proposals = await db.projectProposal.findMany({
      where: whereClause,
      include: {
        client: {
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
        freelancer: {
          select: {
            id: true,
            email: true,
            freelancerProfile: {
              select: {
                fullName: true,
                avatarUrl: true,
                title: true,
              },
            },
          },
        },
        project: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(proposals);
  } catch (error) {
    console.error("Error fetching proposals:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/proposals - Client sends a proposal
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

    if (user.role !== "client") {
      return NextResponse.json(
        { error: "Only clients can send proposals" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { freelancerId, title, description, budgetMin, budgetMax, timeline, scopeNotes } = body;

    // Validate required fields
    if (!freelancerId) {
      return NextResponse.json({ error: "Freelancer is required" }, { status: 400 });
    }
    if (!title || typeof title !== "string" || title.trim() === "") {
      return NextResponse.json({ error: "Project title is required" }, { status: 400 });
    }
    if (!description || typeof description !== "string" || description.trim() === "") {
      return NextResponse.json({ error: "Project description is required" }, { status: 400 });
    }

    // Validate freelancer exists and is a freelancer
    const freelancer = await db.user.findUnique({
      where: { id: freelancerId },
      include: {
        freelancerProfile: true,
      },
    });

    if (!freelancer) {
      return NextResponse.json({ error: "Freelancer not found" }, { status: 404 });
    }

    if (freelancer.role !== "freelancer") {
      return NextResponse.json({ error: "Selected user is not a freelancer" }, { status: 400 });
    }

    // Check for existing pending proposal to the same freelancer
    const existingPendingProposal = await db.projectProposal.findFirst({
      where: {
        clientId: user.id,
        freelancerId,
        status: "PENDING",
      },
    });

    if (existingPendingProposal) {
      return NextResponse.json(
        { error: "You already have a pending proposal with this freelancer. Please withdraw it first to send a new one." },
        { status: 400 }
      );
    }

    // Create the proposal
    const proposal = await db.projectProposal.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        budgetMin: budgetMin || null,
        budgetMax: budgetMax || null,
        timeline: timeline || null,
        scopeNotes: scopeNotes || null,
        clientId: user.id,
        freelancerId,
        status: "PENDING",
      },
      include: {
        client: {
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
        freelancer: {
          select: {
            id: true,
            email: true,
            freelancerProfile: {
              select: {
                fullName: true,
                avatarUrl: true,
                title: true,
              },
            },
          },
        },
      },
    });

    // Create notification for the freelancer
    const clientName = user.email.split("@")[0];
    await db.notification.create({
      data: {
        userId: freelancerId,
        type: "PROPOSAL_RECEIVED",
        message: `New project proposal from ${clientName}: "${title}"`,
        linkTo: `/inbox/proposals`,
      },
    });

    return NextResponse.json(proposal, { status: 201 });
  } catch (error) {
    console.error("Error creating proposal:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
