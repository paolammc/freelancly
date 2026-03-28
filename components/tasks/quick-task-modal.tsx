"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Sparkles, Plus, Clock, Flag, Tag, ListTodo } from "lucide-react";
import { AIEnrichmentPanel } from "./ai-enrichment-panel";

interface Project {
  id: string;
  title: string;
}

interface QuickTaskModalProps {
  projects: Project[];
  defaultProjectId?: string;
}

interface AIEnrichment {
  subtasks: string[];
  estimatedSeconds: number;
  priority: "low" | "medium" | "high" | "urgent";
  tags: string[];
  suggestedProject?: string;
}

export function QuickTaskModal({ projects, defaultProjectId }: QuickTaskModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState(defaultProjectId || "");
  const [isCreating, setIsCreating] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichment, setEnrichment] = useState<AIEnrichment | null>(null);
  const [useEnrichment, setUseEnrichment] = useState(false);

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleEnrich = useCallback(async () => {
    if (!title.trim()) return;

    setIsEnriching(true);
    try {
      const response = await fetch("/api/tasks/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          projectId: projectId || undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setEnrichment(data);
        if (data.suggestedProject && !projectId) {
          setProjectId(data.suggestedProject);
        }
      }
    } catch (error) {
      console.error("Failed to enrich task:", error);
    } finally {
      setIsEnriching(false);
    }
  }, [title, projectId]);

  const handleCreate = async () => {
    if (!title.trim() || !projectId) return;

    setIsCreating(true);
    try {
      const taskData: Record<string, unknown> = {
        projectId,
        title: title.trim(),
      };

      if (useEnrichment && enrichment) {
        taskData.priority = enrichment.priority;
        taskData.tags = enrichment.tags;
        taskData.estimatedSeconds = enrichment.estimatedSeconds;
      }

      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      });

      if (response.ok) {
        const task = await response.json();

        // Create subtasks if using enrichment
        if (useEnrichment && enrichment?.subtasks?.length) {
          for (const subtaskTitle of enrichment.subtasks) {
            await fetch("/api/tasks", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                projectId,
                title: subtaskTitle,
                parentTaskId: task.id,
              }),
            });
          }
        }

        setOpen(false);
        setTitle("");
        setEnrichment(null);
        setUseEnrichment(false);
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to create task:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setTitle("");
    setEnrichment(null);
    setUseEnrichment(false);
  };

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <Button
          onClick={() => setOpen(true)}
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow"
        >
          <Plus className="h-6 w-6" />
          <span className="sr-only">Quick Task (⌘K)</span>
        </Button>
      </div>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Quick Task Capture
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="What needs to be done?"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setEnrichment(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (enrichment && projectId) {
                      handleCreate();
                    } else if (title.trim()) {
                      handleEnrich();
                    }
                  }
                }}
                autoFocus
                className="text-lg"
              />
            </div>

            <div className="flex items-center gap-2">
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={handleEnrich}
                disabled={!title.trim() || isEnriching}
                className="gap-2"
              >
                {isEnriching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                AI Suggest
              </Button>
            </div>

            {enrichment && (
              <AIEnrichmentPanel
                enrichment={enrichment}
                useEnrichment={useEnrichment}
                onToggle={() => setUseEnrichment(!useEnrichment)}
              />
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!title.trim() || !projectId || isCreating}
              >
                {isCreating ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Create Task
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
