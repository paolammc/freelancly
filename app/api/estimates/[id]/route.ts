import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
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
        project: true,
        client: true,
        freelancer: {
          include: {
            freelancerProfile: true,
          },
        },
        items: {
          orderBy: { order: "asc" },
        },
        payments: {
          include: {
            receipt: true,
          },
        },
      },
    });

    if (!estimate) {
      return NextResponse.json({ error: "Estimate not found" }, { status: 404 });
    }

    if (estimate.freelancerId !== user.id && estimate.clientId !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json(estimate);
  } catch (error) {
    console.error("Error fetching estimate:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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

    const estimate = await db.estimate.findUnique({
      where: { id },
    });

    if (!estimate) {
      return NextResponse.json({ error: "Estimate not found" }, { status: 404 });
    }

    if (estimate.freelancerId !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (estimate.status !== "draft") {
      return NextResponse.json(
        { error: "Can only edit draft estimates" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { title, description, validUntil, items } = body;

    // Calculate new total if items provided
    let totalAmount = estimate.totalAmount;
    if (items) {
      totalAmount = items.reduce(
        (sum: number, item: { amount: number }) => sum + item.amount,
        0
      );

      // Delete existing items and create new ones
      await db.estimateItem.deleteMany({
        where: { estimateId: id },
      });

      await db.estimateItem.createMany({
        data: items.map(
          (
            item: { description: string; quantity: number; unitPrice: number; amount: number },
            index: number
          ) => ({
            estimateId: id,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.amount,
            order: index,
          })
        ),
      });
    }

    const updatedEstimate = await db.estimate.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(validUntil && { validUntil: new Date(validUntil) }),
        ...(items && { totalAmount }),
      },
      include: {
        items: {
          orderBy: { order: "asc" },
        },
      },
    });

    return NextResponse.json(updatedEstimate);
  } catch (error) {
    console.error("Error updating estimate:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
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
    });

    if (!estimate) {
      return NextResponse.json({ error: "Estimate not found" }, { status: 404 });
    }

    if (estimate.freelancerId !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    await db.estimate.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting estimate:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
