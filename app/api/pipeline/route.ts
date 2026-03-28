import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/pipeline - Fetch all pipeline cards for the current freelancer
export async function GET() {
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

    const cards = await db.pipelineCard.findMany({
      where: { freelancerId: user.id },
      include: {
        listing: {
          select: {
            id: true,
            status: true,
            category: true,
          },
        },
      },
      orderBy: [{ stage: "asc" }, { order: "asc" }],
    });

    return NextResponse.json(cards);
  } catch (error) {
    console.error("Error fetching pipeline:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/pipeline - Add a listing to the pipeline
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
      return NextResponse.json({ error: "Only freelancers can add to pipeline" }, { status: 403 });
    }

    const body = await req.json();
    const { listingId } = body;

    // Check if listing exists
    const listing = await db.clientListing.findUnique({
      where: { id: listingId },
      include: {
        client: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    // Check if already in pipeline
    const existingCard = await db.pipelineCard.findFirst({
      where: {
        freelancerId: user.id,
        listingId,
      },
    });

    if (existingCard) {
      return NextResponse.json({ error: "Already in pipeline" }, { status: 400 });
    }

    // Create pipeline card
    const card = await db.pipelineCard.create({
      data: {
        freelancerId: user.id,
        listingId,
        title: listing.title,
        clientName: listing.client.email.split("@")[0],
        budget: listing.budgetMax || listing.budgetMin,
        stage: "prospecting",
      },
      include: {
        listing: {
          select: {
            id: true,
            status: true,
            category: true,
          },
        },
      },
    });

    return NextResponse.json(card);
  } catch (error) {
    console.error("Error adding to pipeline:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
