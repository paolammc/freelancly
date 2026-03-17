"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { formatDuration } from "@/lib/utils";
import { Play, Square, MoreVertical, Trash2, Sparkles, Clock } from "lucide-react";

interface TimeEntry {
  durationSeconds: number;
  isActive: boolean;
  startTime: Date;
  userId: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "done";
  source: "ai" | "manual";
  timeEntries: TimeEntry[];
}

interface TaskListProps {
  tasks: Task[];
  isFreelancer: boolean;
  currentUserId: string;
  activeTimerTaskId?: string;
}

export function TaskList({
  tasks,
  isFreelancer,
  currentUserId,
  activeTimerTaskId,
}: TaskListProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loadingTaskId, setLoadingTaskId] = useState<string | null>(null);
  const [timerLoadingTaskId, setTimerLoadingTaskId] = useState<string | null>(null);

  async function handleStatusChange(taskId: string, newStatus: string) {
    setLoadingTaskId(taskId);
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update task");
      }

      router.refresh();
    } catch (error) {
      console.error("Error updating task:", error);
      toast({
        title: "Error",
        description: "Failed to update task status.",
        variant: "destructive",
      });
    } finally {
      setLoadingTaskId(null);
    }
  }

  async function handleDeleteTask(taskId: string) {
    if (!confirm("Are you sure you want to delete this task?")) return;

    setLoadingTaskId(taskId);
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete task");
      }

      toast({
        title: "Task deleted",
        description: "The task has been removed.",
      });

      router.refresh();
    } catch (error) {
      console.error("Error deleting task:", error);
      toast({
        title: "Error",
        description: "Failed to delete task.",
        variant: "destructive",
      });
    } finally {
      setLoadingTaskId(null);
    }
  }

  async function handleTimerAction(taskId: string, action: "start" | "stop") {
    setTimerLoadingTaskId(taskId);
    try {
      const response = await fetch("/api/time-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, action }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to manage timer");
      }

      toast({
        title: action === "start" ? "Timer started" : "Timer stopped",
        description:
          action === "start"
            ? "Time tracking has begun for this task."
            : "Time tracking has been stopped.",
      });

      router.refresh();
    } catch (error) {
      console.error("Error managing timer:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to manage timer.",
        variant: "destructive",
      });
    } finally {
      setTimerLoadingTaskId(null);
    }
  }

  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-10">
          <p className="text-muted-foreground">No tasks yet</p>
          <p className="text-sm text-muted-foreground">
            Add tasks manually or generate them with AI
          </p>
        </CardContent>
      </Card>
    );
  }

  const statusOrder = { todo: 0, in_progress: 1, done: 2 };
  const sortedTasks = [...tasks].sort(
    (a, b) => statusOrder[a.status] - statusOrder[b.status]
  );

  return (
    <div className="space-y-3">
      {sortedTasks.map((task) => {
        const totalTime = task.timeEntries.reduce(
          (acc, entry) => acc + entry.durationSeconds,
          0
        );
        const isActive = task.id === activeTimerTaskId;
        const hasActiveTimer = task.timeEntries.some(
          (entry) => entry.isActive && entry.userId === currentUserId
        );

        return (
          <Card
            key={task.id}
            className={isActive ? "border-primary" : undefined}
          >
            <CardContent className="py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium truncate">{task.title}</h4>
                    {task.source === "ai" && (
                      <Sparkles className="h-3 w-3 text-primary flex-shrink-0" />
                    )}
                  </div>
                  {task.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {task.description}
                    </p>
                  )}
                  {totalTime > 0 && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDuration(totalTime)}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {isFreelancer && (
                    <>
                      {hasActiveTimer ? (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleTimerAction(task.id, "stop")}
                          disabled={timerLoadingTaskId === task.id}
                        >
                          <Square className="h-3 w-3 mr-1" />
                          Stop
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTimerAction(task.id, "start")}
                          disabled={
                            timerLoadingTaskId === task.id ||
                            (activeTimerTaskId !== undefined && !hasActiveTimer)
                          }
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Start
                        </Button>
                      )}
                    </>
                  )}

                  <Select
                    value={task.status}
                    onValueChange={(value) => handleStatusChange(task.id, value)}
                    disabled={loadingTaskId === task.id}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">Todo</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                    </SelectContent>
                  </Select>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
