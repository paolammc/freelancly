import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { randomBytes } from "crypto";

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

    const estimates = await db.estimate.findMany({
      where: {
        OR: [{ freelancerId: user.id }, { clientId: user.id }],
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
          },
        },
        client: {
          select: {
            email: true,
          },
        },
        freelancer: {
          select: {
            email: true,
            freelancerProfile: {
              select: {
                fullName: true,
              },
            },
          },
        },
        items: {
          orderBy: { order: "asc" },
        },
        payments: {
          select: {
            id: true,
            status: true,
            amount: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(estimates);
  } catch (error) {
    console.error("Error fetching estimates:", error);
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

    if (user.role !== "freelancer") {
      return NextResponse.json(
        { error: "Only freelancers can create estimates" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { projectId, title, description, validUntil, items, sendToClient } = body;

    const project = await db.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.freelancerId !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Calculate total
    const totalAmount = items.reduce(
      (sum: number, item: { amount: number }) => sum + item.amount,
      0
    );

    // Generate approval token if sending
    const approvalToken = sendToClient
      ? randomBytes(32).toString("hex")
      : null;

    // Create estimate with items
    const estimate = await db.estimate.create({
      data: {
        projectId,
        freelancerId: user.id,
        clientId: project.clientId ?? user.id, // Use freelancer as client if no client
        title,
        description,
        status: sendToClient ? "sent" : "draft",
        validUntil: validUntil ? new Date(validUntil) : null,
        totalAmount,
        approvalToken,
        sentAt: sendToClient ? new Date() : null,
        items: {
          create: items.map(
            (
              item: { description: string; quantity: number; unitPrice: number; amount: number },
              index: number
            ) => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              amount: item.amount,
              order: index,
            })
          ),
        },
      },
      include: {
        items: true,
        project: true,
        client: true,
      },
    });

    // TODO: Send email to client with approval link if sendToClient is true

    return NextResponse.json({
      ...estimate,
      approvalLink: approvalToken
        ? `${process.env.NEXT_PUBLIC_APP_URL || ""}/estimate/${approvalToken}`
        : null,
    });
  } catch (error) {
    console.error("Error creating estimate:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
