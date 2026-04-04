import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/messages - Get messages for a project
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

    // Verify user has access to this project
    const project = await db.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const isParticipant =
      project.clientId === user.id || project.freelancerId === user.id;

    if (!isParticipant) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const messages = await db.message.findMany({
      where: { projectId },
      orderBy: { createdAt: "asc" },
    });

    // Get sender info for each message
    const senderIds = [...new Set(messages.map((m) => m.senderId))];
    const senders = await db.user.findMany({
      where: { id: { in: senderIds } },
      include: {
        freelancerProfile: {
          select: {
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });

    const senderMap = new Map(senders.map((s) => [s.id, s]));

    const messagesWithSenders = messages.map((message) => {
      const sender = senderMap.get(message.senderId);
      return {
        ...message,
        sender: {
          id: sender?.id,
          email: sender?.email,
          name: sender?.freelancerProfile?.fullName || sender?.email,
          avatarUrl: sender?.freelancerProfile?.avatarUrl,
          role: sender?.role,
        },
      };
    });

    // Mark messages as read for the current user
    await db.message.updateMany({
      where: {
        projectId,
        senderId: { not: user.id },
        isRead: false,
      },
      data: { isRead: true },
    });

    return NextResponse.json(messagesWithSenders);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

// POST /api/messages - Send a message
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
    const { projectId, content } = body;

    if (!projectId || !content?.trim()) {
      return NextResponse.json(
        { error: "Project ID and message content are required" },
        { status: 400 }
      );
    }

    // Verify user has access to this project
    const project = await db.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const isParticipant =
      project.clientId === user.id || project.freelancerId === user.id;

    if (!isParticipant) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const message = await db.message.create({
      data: {
        projectId,
        senderId: user.id,
        content: content.trim(),
      },
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
