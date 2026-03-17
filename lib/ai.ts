import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface GeneratedTask {
  title: string;
  description: string;
}

export async function generateTasksFromDescription(
  projectTitle: string,
  projectDescription: string
): Promise<GeneratedTask[]> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are a project management expert. Given the following project details, generate a list of actionable tasks that would be needed to complete this project.

Project Title: ${projectTitle}

Project Description: ${projectDescription}

Generate 5-10 specific, actionable tasks. Each task should have a clear title and a brief description.

Respond ONLY with a valid JSON array of objects, each with "title" and "description" fields. No other text.

Example format:
[
  {"title": "Task title here", "description": "Brief description of what needs to be done"},
  {"title": "Another task", "description": "Description"}
]`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  try {
    const tasks = JSON.parse(content.text) as GeneratedTask[];
    return tasks;
  } catch {
    throw new Error("Failed to parse task list from Claude response");
  }
}
