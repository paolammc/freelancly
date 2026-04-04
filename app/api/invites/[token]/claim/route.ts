import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/invites/[token]/claim - Claim invitation after signup
export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth();
    const { token } = await params;

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    // Find the invite
    const invite = await db.inviteToken.findUnique({
      where: { token },
    });

    if (!invite) {
      return NextResponse.json(
        { error: "Invalid invitation" },
        { status: 404 }
      );
    }

    // Check if already used
    if (invite.usedAt) {
      return NextResponse.json(
        { error: "This invitation has already been claimed" },
        { status: 400 }
      );
    }

    // Check if expired
    if (new Date() > invite.expiresAt) {
      return NextResponse.json(
        { error: "This invitation has expired" },
        { status: 400 }
      );
    }

    // Get the project
    const project = await db.project.findUnique({
      where: { id: invite.projectId },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project no longer exists" },
        { status: 404 }
      );
    }

    // Check if project already has a client
    if (project.clientId) {
      return NextResponse.json(
        { error: "This project already has a client assigned" },
        { status: 400 }
      );
    }

    // Find or create the user
    let user = await db.user.findUnique({
      where: { clerkUserId },
    });

    if (!user) {
      // Create new user as client
      user = await db.user.create({
        data: {
          clerkUserId,
          email: invite.email,
          role: "client",
        },
      });
    } else if (user.role === "freelancer") {
      // User is already a freelancer - they can't be a client on this project
      return NextResponse.json(
        { error: "Freelancers cannot be invited as clients" },
        { status: 400 }
      );
    } else if (!user.role) {
      // User exists but has no role - set them as client
      user = await db.user.update({
        where: { id: user.id },
        data: { role: "client" },
      });
    }

    // Link user to project and update project type
    await db.project.update({
      where: { id: project.id },
      data: {
        clientId: user.id,
        projectType: "client",
      },
    });

    // Mark invite as used
    await db.inviteToken.update({
      where: { id: invite.id },
      data: { usedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      projectId: project.id,
      message: "Successfully linked to project",
    });
  } catch (error) {
    console.error("Error claiming invite:", error);
    return NextResponse.json(
      { error: "Failed to claim invitation" },
      { status: 500 }
    );
  }
}
