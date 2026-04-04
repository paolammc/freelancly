import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/invites/[token] - Validate invite token and get details
export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    const invite = await db.inviteToken.findUnique({
      where: { token },
    });

    if (!invite) {
      return NextResponse.json(
        {
          valid: false,
          error: "Invalid invitation link",
          code: "INVALID_TOKEN"
        },
        { status: 404 }
      );
    }

    // Check if already used
    if (invite.usedAt) {
      return NextResponse.json(
        {
          valid: false,
          error: "This invitation has already been used",
          code: "ALREADY_USED"
        },
        { status: 400 }
      );
    }

    // Check if expired
    if (new Date() > invite.expiresAt) {
      return NextResponse.json(
        {
          valid: false,
          error: "This invitation has expired",
          code: "EXPIRED"
        },
        { status: 400 }
      );
    }

    // Get project and freelancer details
    const project = await db.project.findUnique({
      where: { id: invite.projectId },
      include: {
        freelancer: {
          include: {
            freelancerProfile: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        {
          valid: false,
          error: "Project no longer exists",
          code: "PROJECT_NOT_FOUND"
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      valid: true,
      invite: {
        id: invite.id,
        email: invite.email,
        expiresAt: invite.expiresAt,
      },
      project: {
        id: project.id,
        title: project.title,
        description: project.description,
      },
      freelancer: {
        name: project.freelancer.freelancerProfile?.fullName || project.freelancer.email,
        title: project.freelancer.freelancerProfile?.title,
        avatarUrl: project.freelancer.freelancerProfile?.avatarUrl,
      },
    });
  } catch (error) {
    console.error("Error validating invite:", error);
    return NextResponse.json(
      { error: "Failed to validate invitation" },
      { status: 500 }
    );
  }
}
