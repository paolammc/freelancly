import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// PATCH /api/proposals/[id]/withdraw - Client withdraws a pending proposal
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

    if (user.role !== "client") {
      return NextResponse.json(
        { error: "Only clients can withdraw proposals" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const proposal = await db.projectProposal.findUnique({
      where: { id },
    });

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    if (proposal.clientId !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (proposal.status !== "PENDING") {
      return NextResponse.json(
        { error: "Only pending proposals can be withdrawn" },
        { status: 400 }
      );
    }

    const updatedProposal = await db.projectProposal.update({
      where: { id },
      data: {
        status: "WITHDRAWN",
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
        userId: proposal.freelancerId,
        type: "PROPOSAL_WITHDRAWN",
        message: `${clientName} withdrew their proposal: "${proposal.title}"`,
        linkTo: `/inbox/proposals`,
      },
    });

    return NextResponse.json(updatedProposal);
  } catch (error) {
    console.error("Error withdrawing proposal:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
