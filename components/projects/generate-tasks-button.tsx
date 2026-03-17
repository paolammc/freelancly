"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Sparkles, Loader2 } from "lucide-react";

interface GenerateTasksButtonProps {
  projectId: string;
  hasExistingTasks: boolean;
}

export function GenerateTasksButton({
  projectId,
  hasExistingTasks,
}: GenerateTasksButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  async function handleGenerate() {
    if (
      hasExistingTasks &&
      !confirm(
        "This will add new AI-generated tasks. Existing tasks will not be affected. Continue?"
      )
    ) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/tasks/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate tasks");
      }

      const tasks = await response.json();

      toast({
        title: "Tasks generated",
        description: `${tasks.length} tasks have been created using AI.`,
      });

      router.refresh();
    } catch (error) {
      console.error("Error generating tasks:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to generate tasks. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button onClick={handleGenerate} disabled={isLoading} variant="outline">
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Sparkles className="mr-2 h-4 w-4" />
      )}
      {isLoading ? "Generating..." : "Generate with AI"}
    </Button>
  );
}
