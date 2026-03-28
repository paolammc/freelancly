import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/listings - Fetch all open client listings
export async function GET(req: Request) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const duration = searchParams.get("duration");
    const budgetMin = searchParams.get("budgetMin");
    const budgetMax = searchParams.get("budgetMax");
    const sortBy = searchParams.get("sortBy") || "newest";

    // Build where clause
    const where: Record<string, unknown> = {
      status: "open",
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (duration) {
      where.duration = duration;
    }

    if (budgetMin || budgetMax) {
      where.AND = [];
      if (budgetMin) {
        (where.AND as unknown[]).push({ budgetMax: { gte: parseFloat(budgetMin) } });
      }
      if (budgetMax) {
        (where.AND as unknown[]).push({ budgetMin: { lte: parseFloat(budgetMax) } });
      }
    }

    // Build orderBy
    let orderBy: Record<string, string> = { createdAt: "desc" };
    if (sortBy === "budget_high") {
      orderBy = { budgetMax: "desc" };
    } else if (sortBy === "budget_low") {
      orderBy = { budgetMin: "asc" };
    }

    const listings = await db.clientListing.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            email: true,
          },
        },
        _count: {
          select: {
            pipelineCards: true,
          },
        },
      },
      orderBy,
    });

    return NextResponse.json(listings);
  } catch (error) {
    console.error("Error fetching listings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/listings - Create a new client listing
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

    if (user.role !== "client") {
      return NextResponse.json({ error: "Only clients can create listings" }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, category, budgetMin, budgetMax, duration, requiredSkills, timeline } = body;

    const listing = await db.clientListing.create({
      data: {
        clientId: user.id,
        title,
        description,
        category,
        budgetMin: budgetMin || null,
        budgetMax: budgetMax || null,
        duration: duration || "medium_term",
        requiredSkills: requiredSkills || [],
        timeline: timeline || null,
      },
      include: {
        client: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(listing);
  } catch (error) {
    console.error("Error creating listing:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
