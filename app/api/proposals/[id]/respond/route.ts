import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// PATCH /api/proposals/[id]/respond - Freelancer accepts or declines
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

    if (user.role !== "freelancer") {
      return NextResponse.json(
        { error: "Only freelancers can respond to proposals" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const { action, declineReason } = body;

    if (!action || !["ACCEPT", "DECLINE"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be ACCEPT or DECLINE" },
        { status: 400 }
      );
    }

    const proposal = await db.projectProposal.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    if (proposal.freelancerId !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (proposal.status !== "PENDING") {
      return NextResponse.json(
        { error: "This proposal has already been processed" },
        { status: 400 }
      );
    }

    if (action === "ACCEPT") {
      // Create a new project from the proposal
      const project = await db.project.create({
        data: {
          title: proposal.title,
          description: proposal.description,
          clientId: proposal.clientId,
          freelancerId: user.id,
          projectType: "client",
          budget: proposal.budgetMax || proposal.budgetMin || null,
          status: "active",
        },
      });

      // Update proposal with project link and status
      const updatedProposal = await db.projectProposal.update({
        where: { id },
        data: {
          status: "ACCEPTED",
          projectId: project.id,
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
          project: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
        },
      });

      // Create notification for the client
      const freelancerName = user.email.split("@")[0];
      await db.notification.create({
        data: {
          userId: proposal.clientId,
          type: "PROPOSAL_ACCEPTED",
          message: `${freelancerName} accepted your proposal: "${proposal.title}"`,
          linkTo: `/projects/${project.id}`,
        },
      });

      return NextResponse.json({
        proposal: updatedProposal,
        project,
      });
    }

    if (action === "DECLINE") {
      const updatedProposal = await db.projectProposal.update({
        where: { id },
        data: {
          status: "DECLINED",
          declineReason: declineReason || null,
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

      // Create notification for the client
      const freelancerName = user.email.split("@")[0];
      await db.notification.create({
        data: {
          userId: proposal.clientId,
          type: "PROPOSAL_DECLINED",
          message: `${freelancerName} declined your proposal: "${proposal.title}"`,
          linkTo: `/proposals/${id}`,
        },
      });

      return NextResponse.json({ proposal: updatedProposal });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error responding to proposal:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
