import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface EnrichmentResult {
  subtasks: string[];
  estimatedSeconds: number;
  priority: "low" | "medium" | "high" | "urgent";
  tags: string[];
  suggestedProject?: string;
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

    const body = await req.json();
    const { title, projectId } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Get user's projects and recent tasks for context
    const projects = await db.project.findMany({
      where: {
        OR: [{ clientId: user.id }, { freelancerId: user.id }],
        status: "active",
      },
      select: {
        id: true,
        title: true,
        description: true,
      },
    });

    const recentTasks = await db.task.findMany({
      where: {
        project: {
          OR: [{ clientId: user.id }, { freelancerId: user.id }],
        },
      },
      take: 20,
      orderBy: { createdAt: "desc" },
      select: {
        title: true,
        tags: true,
        projectId: true,
      },
    });

    // Build context for AI
    const projectContext = projects
      .map((p) => `- ${p.title}: ${p.description}`)
      .join("\n");

    const recentTaskTitles = recentTasks.map((t) => t.title).join(", ");

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are an expert project manager and task analysis assistant. Analyze the following task and provide enrichment suggestions.

Task title: "${title}"

${projectId ? "" : `Available projects:\n${projectContext}\n`}

Recent tasks for context: ${recentTaskTitles}

Provide your analysis in the following JSON format only, no other text:
{
  "subtasks": ["array of 2-5 specific, actionable subtasks that break down this task"],
  "estimatedSeconds": <estimated time to complete in seconds, be realistic based on task complexity>,
  "priority": "<one of: low, medium, high, urgent - based on implied urgency/importance>",
  "tags": ["2-4 relevant tags for categorization"]${!projectId ? ',\n  "suggestedProject": "<project ID that best matches this task, or null if unclear>"' : ""}
}

Consider:
- Break down complex tasks into clear subtasks
- Estimate time realistically (most tasks take 30min-4hrs)
- Assign priority based on keywords like "urgent", "ASAP", "bug", "fix", etc.
- Suggest relevant tags based on the task nature (e.g., "frontend", "design", "bug", "feature")`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Claude");
    }

    try {
      const enrichment = JSON.parse(content.text) as EnrichmentResult;

      // Validate the enrichment data
      if (!Array.isArray(enrichment.subtasks)) {
        enrichment.subtasks = [];
      }
      if (typeof enrichment.estimatedSeconds !== "number") {
        enrichment.estimatedSeconds = 3600; // Default 1 hour
      }
      if (!["low", "medium", "high", "urgent"].includes(enrichment.priority)) {
        enrichment.priority = "medium";
      }
      if (!Array.isArray(enrichment.tags)) {
        enrichment.tags = [];
      }

      return NextResponse.json(enrichment);
    } catch {
      throw new Error("Failed to parse AI response");
    }
  } catch (error) {
    console.error("Error enriching task:", error);
    return NextResponse.json(
      { error: "Failed to enrich task" },
      { status: 500 }
    );
  }
}
