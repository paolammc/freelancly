import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { randomBytes } from "crypto";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const estimate = await db.estimate.findUnique({
      where: { approvalToken: token },
      include: {
        project: {
          select: {
            id: true,
            title: true,
          },
        },
        freelancer: {
          select: {
            email: true,
            freelancerProfile: {
              select: {
                fullName: true,
                title: true,
              },
            },
          },
        },
        client: {
          select: {
            email: true,
          },
        },
        items: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!estimate) {
      return NextResponse.json({ error: "Estimate not found" }, { status: 404 });
    }

    return NextResponse.json(estimate);
  } catch (error) {
    console.error("Error fetching estimate for approval:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await req.json();
    const { action } = body; // "approve" or "reject"

    const estimate = await db.estimate.findUnique({
      where: { approvalToken: token },
    });

    if (!estimate) {
      return NextResponse.json({ error: "Estimate not found" }, { status: 404 });
    }

    if (estimate.status !== "sent") {
      return NextResponse.json(
        { error: "This estimate has already been processed" },
        { status: 400 }
      );
    }

    // Check if expired
    if (estimate.validUntil && new Date(estimate.validUntil) < new Date()) {
      await db.estimate.update({
        where: { id: estimate.id },
        data: { status: "expired" },
      });
      return NextResponse.json(
        { error: "This estimate has expired" },
        { status: 400 }
      );
    }

    if (action === "reject") {
      const updatedEstimate = await db.estimate.update({
        where: { id: estimate.id },
        data: { status: "rejected" },
      });
      return NextResponse.json(updatedEstimate);
    }

    if (action === "approve") {
      // Update estimate status
      const updatedEstimate = await db.estimate.update({
        where: { id: estimate.id },
        data: {
          status: "approved",
          approvedAt: new Date(),
        },
      });

      // Generate receipt number
      const receiptNumber = `RCP-${Date.now()}-${randomBytes(4).toString("hex").toUpperCase()}`;

      // Create payment record
      const payment = await db.payment.create({
        data: {
          estimateId: estimate.id,
          userId: estimate.clientId,
          amount: estimate.totalAmount,
          status: "pending",
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        },
      });

      return NextResponse.json({
        estimate: updatedEstimate,
        payment,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error processing estimate approval:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
