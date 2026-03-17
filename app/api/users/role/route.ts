import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role } = await req.json();

    if (role !== "client" && role !== "freelancer") {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // First try to find existing user
    let user = await db.user.findUnique({
      where: { clerkUserId },
    });

    // If user doesn't exist (webhook hasn't fired yet), create them
    if (!user) {
      user = await db.user.create({
        data: {
          clerkUserId,
          email: "", // Will be updated by webhook
          role,
        },
      });
    } else {
      // Update existing user's role
      user = await db.user.update({
        where: { clerkUserId },
        data: { role },
      });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error updating role:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
