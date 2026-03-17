import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const freelancer = await db.user.findUnique({
      where: { id },
      include: {
        freelancerProfile: true,
      },
    });

    if (!freelancer || !freelancer.freelancerProfile) {
      return NextResponse.json({ error: "Freelancer not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: freelancer.id,
      email: freelancer.email,
      fullName: freelancer.freelancerProfile.fullName,
      title: freelancer.freelancerProfile.title,
      bio: freelancer.freelancerProfile.bio,
      skills: freelancer.freelancerProfile.skills,
      hourlyRate: freelancer.freelancerProfile.hourlyRate,
      portfolioUrl: freelancer.freelancerProfile.portfolioUrl,
      avatarUrl: freelancer.freelancerProfile.avatarUrl,
    });
  } catch (error) {
    console.error("Error fetching freelancer:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
