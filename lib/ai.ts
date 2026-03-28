import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface GeneratedTask {
  title: string;
  description: string;
}

export interface RoadmapPhase {
  name: string;
  description: string;
  duration: string;
  milestones: {
    title: string;
    description: string;
    tasks: string[];
  }[];
}

export interface Roadmap {
  title: string;
  description: string;
  phases: RoadmapPhase[];
}

export interface PRDFeature {
  name: string;
  description: string;
  priority: "must-have" | "should-have" | "nice-to-have";
  userStory: string;
}

export interface PRDUserFlow {
  name: string;
  steps: string[];
}

export interface PRDContent {
  title: string;
  problem: string;
  goals: string[];
  features: PRDFeature[];
  userFlows: PRDUserFlow[];
  metrics: string[];
  content: string; // Full markdown
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

export async function generateRoadmap(
  projectTitle: string,
  projectDescription: string,
  deadline?: string
): Promise<Roadmap> {
  const deadlineContext = deadline
    ? `The project deadline is ${deadline}. Plan accordingly.`
    : "No specific deadline has been set.";

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `You are an expert project manager. Generate a detailed project roadmap for the following project.

Project Title: ${projectTitle}

Project Description: ${projectDescription}

${deadlineContext}

Generate a comprehensive roadmap with 3-5 phases. Each phase should have:
- A clear name
- A description of what will be accomplished
- Estimated duration
- 2-4 milestones with specific tasks

Respond ONLY with valid JSON in this exact format:
{
  "title": "Roadmap title",
  "description": "Brief roadmap overview",
  "phases": [
    {
      "name": "Phase name",
      "description": "Phase description",
      "duration": "e.g., 2 weeks",
      "milestones": [
        {
          "title": "Milestone title",
          "description": "What this milestone achieves",
          "tasks": ["Task 1", "Task 2"]
        }
      ]
    }
  ]
}`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  try {
    return JSON.parse(content.text) as Roadmap;
  } catch {
    throw new Error("Failed to parse roadmap from Claude response");
  }
}

export async function generatePRD(
  projectTitle: string,
  projectDescription: string
): Promise<PRDContent> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `You are an expert product manager. Generate a comprehensive Product Requirements Document (PRD) for the following project.

Project Title: ${projectTitle}

Project Description: ${projectDescription}

Generate a detailed PRD that includes:
1. Problem statement
2. Goals (3-5 measurable goals)
3. Features (5-10 features with priorities)
4. User flows (2-4 key user flows)
5. Success metrics

Respond ONLY with valid JSON in this exact format:
{
  "title": "PRD: ${projectTitle}",
  "problem": "Clear problem statement",
  "goals": ["Goal 1", "Goal 2"],
  "features": [
    {
      "name": "Feature name",
      "description": "Feature description",
      "priority": "must-have",
      "userStory": "As a [user], I want [goal] so that [benefit]"
    }
  ],
  "userFlows": [
    {
      "name": "Flow name",
      "steps": ["Step 1", "Step 2"]
    }
  ],
  "metrics": ["Metric 1", "Metric 2"],
  "content": "# PRD: ${projectTitle}\\n\\n## Problem\\n...full markdown document..."
}

The "content" field should be a complete, well-formatted markdown document that could be exported and shared.`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  try {
    return JSON.parse(content.text) as PRDContent;
  } catch {
    throw new Error("Failed to parse PRD from Claude response");
  }
}

export async function generateTasksFromRoadmap(
  roadmap: Roadmap
): Promise<GeneratedTask[]> {
  const tasks: GeneratedTask[] = [];

  for (const phase of roadmap.phases) {
    for (const milestone of phase.milestones) {
      // Add the milestone itself as a parent task
      tasks.push({
        title: `[${phase.name}] ${milestone.title}`,
        description: milestone.description,
      });

      // Add individual tasks from the milestone
      for (const taskTitle of milestone.tasks) {
        tasks.push({
          title: taskTitle,
          description: `Part of milestone: ${milestone.title}`,
        });
      }
    }
  }

  return tasks;
}
