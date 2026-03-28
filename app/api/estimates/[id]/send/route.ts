import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { randomBytes } from "crypto";

export async function POST(
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

    const estimate = await db.estimate.findUnique({
      where: { id },
      include: {
        client: true,
      },
    });

    if (!estimate) {
      return NextResponse.json({ error: "Estimate not found" }, { status: 404 });
    }

    if (estimate.freelancerId !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (estimate.status !== "draft") {
      return NextResponse.json(
        { error: "Estimate has already been sent" },
        { status: 400 }
      );
    }

    // Generate approval token
    const approvalToken = randomBytes(32).toString("hex");

    const updatedEstimate = await db.estimate.update({
      where: { id },
      data: {
        status: "sent",
        sentAt: new Date(),
        approvalToken,
      },
    });

    const approvalLink = `${process.env.NEXT_PUBLIC_APP_URL || ""}/estimate/${approvalToken}`;

    // TODO: Send email to client with approval link

    return NextResponse.json({
      ...updatedEstimate,
      approvalLink,
    });
  } catch (error) {
    console.error("Error sending estimate:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
