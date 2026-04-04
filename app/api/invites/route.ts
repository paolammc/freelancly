import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { randomBytes } from "crypto";

// POST /api/invites - Create a new client invitation
export async function POST(req: Request) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { clerkUserId },
    });

    if (!user || user.role !== "freelancer") {
      return NextResponse.json(
        { error: "Only freelancers can invite clients" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { email, projectId } = body;

    // Validate required fields
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    // Verify project exists and belongs to this freelancer
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        freelancer: {
          include: {
            freelancerProfile: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.freelancerId !== user.id) {
      return NextResponse.json(
        { error: "You can only invite clients to your own projects" },
        { status: 403 }
      );
    }

    // Check if project already has a client
    if (project.clientId) {
      return NextResponse.json(
        { error: "This project already has a client assigned" },
        { status: 400 }
      );
    }

    // Check for existing pending invite for this email/project
    const existingInvite = await db.inviteToken.findFirst({
      where: {
        email: email.toLowerCase(),
        projectId,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvite) {
      return NextResponse.json(
        { error: "An active invitation already exists for this email" },
        { status: 400 }
      );
    }

    // Generate unique token
    const token = randomBytes(32).toString("hex");

    // Set expiration to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create invite token
    const invite = await db.inviteToken.create({
      data: {
        email: email.toLowerCase(),
        projectId,
        token,
        expiresAt,
      },
    });

    // Generate invite link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const inviteLink = `${baseUrl}/invite/${token}`;

    // TODO: Send email with invite link using a service like Resend/SendGrid
    // For now, we'll return the link in the response
    console.log(`Invite link for ${email}: ${inviteLink}`);

    return NextResponse.json({
      success: true,
      inviteId: invite.id,
      inviteLink,
      expiresAt: invite.expiresAt,
      message: `Invitation created for ${email}`,
    });
  } catch (error) {
    console.error("Error creating invite:", error);
    return NextResponse.json(
      { error: "Failed to create invitation" },
      { status: 500 }
    );
  }
}

// GET /api/invites - List pending invites for a project
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
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    // Verify project belongs to this user (as freelancer)
    const project = await db.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.freelancerId !== user.id) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const invites = await db.inviteToken.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(invites);
  } catch (error) {
    console.error("Error fetching invites:", error);
    return NextResponse.json(
      { error: "Failed to fetch invitations" },
      { status: 500 }
    );
  }
}
