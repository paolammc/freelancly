import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { randomBytes } from "crypto";

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

    const { id } = await params;

    const payment = await db.payment.findUnique({
      where: { id },
      include: {
        estimate: true,
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Only freelancer or client can update payment
    if (
      payment.estimate.freelancerId !== user.id &&
      payment.userId !== user.id
    ) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await req.json();
    const { status, method, notes } = body;

    const updateData: Record<string, unknown> = {};

    if (status) updateData.status = status;
    if (method !== undefined) updateData.method = method;
    if (notes !== undefined) updateData.notes = notes;

    // If marking as paid, set paidAt and generate receipt
    if (status === "paid" && payment.status !== "paid") {
      updateData.paidAt = new Date();

      // Generate receipt
      const receiptNumber = `RCP-${Date.now()}-${randomBytes(4).toString("hex").toUpperCase()}`;

      await db.receipt.create({
        data: {
          paymentId: id,
          receiptNumber,
          issuedAt: new Date(),
        },
      });
    }

    const updatedPayment = await db.payment.update({
      where: { id },
      data: updateData,
      include: {
        receipt: true,
      },
    });

    return NextResponse.json(updatedPayment);
  } catch (error) {
    console.error("Error updating payment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
