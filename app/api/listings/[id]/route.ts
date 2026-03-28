import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/listings/[id] - Get a specific listing
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const listing = await db.clientListing.findUnique({
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

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    return NextResponse.json(listing);
  } catch (error) {
    console.error("Error fetching listing:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/listings/[id] - Update a listing
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
    const body = await req.json();

    const listing = await db.clientListing.findUnique({
      where: { id },
    });

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (listing.clientId !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const updatedListing = await db.clientListing.update({
      where: { id },
      data: body,
      include: {
        client: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    // If listing is closed, mark pipeline cards as listing closed
    if (body.status === "closed" || body.status === "filled") {
      await db.pipelineCard.updateMany({
        where: { listingId: id },
        data: { listingClosed: true },
      });
    }

    return NextResponse.json(updatedListing);
  } catch (error) {
    console.error("Error updating listing:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/listings/[id] - Delete a listing
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

    const listing = await db.clientListing.findUnique({
      where: { id },
    });

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (listing.clientId !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Mark pipeline cards as listing closed before deleting
    await db.pipelineCard.updateMany({
      where: { listingId: id },
      data: { listingClosed: true, listingId: null },
    });

    await db.clientListing.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting listing:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
