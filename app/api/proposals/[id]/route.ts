import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/proposals/[id] - Get single proposal
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

    const proposal = await db.projectProposal.findUnique({
      where: { id },
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
    });

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    // Check access - must be client or freelancer on the proposal
    if (proposal.clientId !== user.id && proposal.freelancerId !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json(proposal);
  } catch (error) {
    console.error("Error fetching proposal:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
