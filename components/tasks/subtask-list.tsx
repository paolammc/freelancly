"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Subtask {
  id: string;
  title: string;
  status: "todo" | "in_progress" | "done";
}

interface SubtaskListProps {
  parentTaskId: string;
  projectId: string;
  subtasks: Subtask[];
  editable?: boolean;
}

export function SubtaskList({
  parentTaskId,
  projectId,
  subtasks,
  editable = true,
}: SubtaskListProps) {
  const router = useRouter();
  const [newSubtask, setNewSubtask] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());

  const handleAddSubtask = async () => {
    if (!newSubtask.trim()) return;

    setIsAdding(true);
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          title: newSubtask.trim(),
          parentTaskId,
        }),
      });

      if (response.ok) {
        setNewSubtask("");
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to add subtask:", error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleSubtask = async (subtask: Subtask) => {
    const newStatus = subtask.status === "done" ? "todo" : "done";

    setUpdatingIds((prev) => new Set(prev).add(subtask.id));
    try {
      const response = await fetch(`/api/tasks/${subtask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to update subtask:", error);
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(subtask.id);
        return next;
      });
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    setUpdatingIds((prev) => new Set(prev).add(subtaskId));
    try {
      const response = await fetch(`/api/tasks/${subtaskId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to delete subtask:", error);
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(subtaskId);
        return next;
      });
    }
  };

  const completedCount = subtasks.filter((s) => s.status === "done").length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">
          Subtasks
          {subtasks.length > 0 && (
            <span className="ml-2 text-muted-foreground">
              ({completedCount}/{subtasks.length})
            </span>
          )}
        </h4>
      </div>

      {subtasks.length > 0 && (
        <div className="space-y-1">
          {subtasks.map((subtask) => (
            <div
              key={subtask.id}
              className={cn(
                "flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 group",
                updatingIds.has(subtask.id) && "opacity-50"
              )}
            >
              <Checkbox
                checked={subtask.status === "done"}
                onCheckedChange={() => handleToggleSubtask(subtask)}
                disabled={updatingIds.has(subtask.id) || !editable}
              />
              <span
                className={cn(
                  "flex-1 text-sm",
                  subtask.status === "done" && "line-through text-muted-foreground"
                )}
              >
                {subtask.title}
              </span>
              {editable && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDeleteSubtask(subtask.id)}
                  disabled={updatingIds.has(subtask.id)}
                >
                  <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {editable && (
        <div className="flex gap-2">
          <Input
            placeholder="Add a subtask..."
            value={newSubtask}
            onChange={(e) => setNewSubtask(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddSubtask();
              }
            }}
            disabled={isAdding}
            className="text-sm"
          />
          <Button
            size="sm"
            onClick={handleAddSubtask}
            disabled={!newSubtask.trim() || isAdding}
          >
            {isAdding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
