"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PriorityIndicator } from "./priority-badge";
import { TagList } from "./tag-input";
import { TaskDetailDrawer } from "./task-detail-drawer";
import { cn } from "@/lib/utils";
import { Clock, GripVertical, MessageSquare, ListTodo } from "lucide-react";
import { formatDuration } from "@/lib/utils";

type Priority = "low" | "medium" | "high" | "urgent";
type TaskStatus = "todo" | "in_progress" | "done";

interface Subtask {
  id: string;
  title: string;
  status: TaskStatus;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    email: string;
    freelancerProfile?: {
      fullName: string;
      avatarUrl?: string | null;
    } | null;
  };
}

interface TimeEntry {
  durationSeconds: number;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  tags: string[];
  estimatedSeconds: number | null;
  dueDate: string | null;
  projectId: string;
  order: number;
  subtasks: Subtask[];
  comments: Comment[];
  timeEntries: TimeEntry[];
}

interface TaskBoardProps {
  tasks: Task[];
  projectId: string;
  editable?: boolean;
}

const columns: { id: TaskStatus; title: string; color: string }[] = [
  { id: "todo", title: "Backlog", color: "bg-slate-500" },
  { id: "in_progress", title: "In Progress", color: "bg-blue-500" },
  { id: "done", title: "Done", color: "bg-emerald-500" },
];

export function TaskBoard({ tasks, projectId, editable = true }: TaskBoardProps) {
  const router = useRouter();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [draggingTask, setDraggingTask] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggingTask(taskId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", taskId);
  };

  const handleDragOver = (e: React.DragEvent, columnId: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain");
    setDraggingTask(null);
    setDragOverColumn(null);

    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to update task status:", error);
    }
  };

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks
      .filter((task) => task.status === status && !task.subtasks.some(() => false))
      .filter((task) => !tasks.some((t) => t.subtasks.some((s) => s.id === task.id)))
      .sort((a, b) => a.order - b.order);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns.map((column) => {
          const columnTasks = getTasksByStatus(column.id);
          const isOver = dragOverColumn === column.id;

          return (
            <div
              key={column.id}
              className={cn(
                "flex flex-col min-h-[400px] rounded-lg bg-muted/30 p-3 transition-colors",
                isOver && "bg-muted/60 ring-2 ring-primary/50"
              )}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className={cn("w-2 h-2 rounded-full", column.color)} />
                <h3 className="font-medium text-sm">{column.title}</h3>
                <Badge variant="secondary" className="ml-auto text-xs">
                  {columnTasks.length}
                </Badge>
              </div>

              <div className="flex-1 space-y-2">
                {columnTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    isDragging={draggingTask === task.id}
                    editable={editable}
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onClick={() => setSelectedTask(task)}
                  />
                ))}

                {columnTasks.length === 0 && (
                  <div className="flex items-center justify-center h-24 border-2 border-dashed rounded-lg text-muted-foreground text-sm">
                    Drop tasks here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <TaskDetailDrawer
        task={selectedTask}
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        editable={editable}
      />
    </>
  );
}

interface TaskCardProps {
  task: Task;
  isDragging: boolean;
  editable: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onClick: () => void;
}

function TaskCard({
  task,
  isDragging,
  editable,
  onDragStart,
  onClick,
}: TaskCardProps) {
  const totalTime = task.timeEntries.reduce(
    (acc, entry) => acc + entry.durationSeconds,
    0
  );
  const subtaskCount = task.subtasks.length;
  const completedSubtasks = task.subtasks.filter((s) => s.status === "done").length;
  const commentCount = task.comments.length;

  return (
    <Card
      draggable={editable}
      onDragStart={onDragStart}
      onClick={onClick}
      className={cn(
        "cursor-pointer hover:shadow-md transition-all group",
        isDragging && "opacity-50 rotate-2 scale-105",
        editable && "cursor-grab active:cursor-grabbing"
      )}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start gap-2">
          {editable && (
            <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <PriorityIndicator priority={task.priority} />
              <h4 className="font-medium text-sm truncate">{task.title}</h4>
            </div>

            {task.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                {task.description}
              </p>
            )}

            {task.tags.length > 0 && (
              <div className="mb-2">
                <TagList tags={task.tags.slice(0, 3)} />
                {task.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs ml-1">
                    +{task.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {totalTime > 0 && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDuration(totalTime)}
                </span>
              )}

              {subtaskCount > 0 && (
                <span className="flex items-center gap-1">
                  <ListTodo className="h-3 w-3" />
                  {completedSubtasks}/{subtaskCount}
                </span>
              )}

              {commentCount > 0 && (
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  {commentCount}
                </span>
              )}

              {task.dueDate && (
                <span
                  className={cn(
                    "ml-auto",
                    new Date(task.dueDate) < new Date() &&
                      task.status !== "done" &&
                      "text-destructive"
                  )}
                >
                  {new Date(task.dueDate).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
