import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const skill = searchParams.get("skill");

    const freelancers = await db.freelancerProfile.findMany({
      where: {
        AND: [
          search
            ? {
                OR: [
                  { fullName: { contains: search, mode: "insensitive" } },
                  { title: { contains: search, mode: "insensitive" } },
                  { bio: { contains: search, mode: "insensitive" } },
                ],
              }
            : {},
          skill
            ? {
                skills: { has: skill },
              }
            : {},
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(freelancers);
  } catch (error) {
    console.error("Error fetching freelancers:", error);
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
      return NextResponse.json({ error: "Only freelancers can create profiles" }, { status: 403 });
    }

    const body = await req.json();
    const { fullName, title, bio, skills, hourlyRate, portfolioUrl, avatarUrl } = body;

    const existingProfile = await db.freelancerProfile.findUnique({
      where: { userId: user.id },
    });

    let profile;
    if (existingProfile) {
      profile = await db.freelancerProfile.update({
        where: { userId: user.id },
        data: {
          fullName,
          title,
          bio,
          skills,
          hourlyRate,
          portfolioUrl,
          avatarUrl,
        },
      });
    } else {
      profile = await db.freelancerProfile.create({
        data: {
          userId: user.id,
          fullName,
          title,
          bio,
          skills,
          hourlyRate,
          portfolioUrl,
          avatarUrl,
        },
      });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error creating/updating profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
