"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PriorityBadge } from "./priority-badge";
import { TagInput } from "./tag-input";
import { SubtaskList } from "./subtask-list";
import { CommentSection } from "./comment-section";
import { formatDuration } from "@/lib/utils";
import {
  Clock,
  Calendar,
  Loader2,
  Trash2,
  Save,
  AlertCircle,
} from "lucide-react";

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
  subtasks: Subtask[];
  comments: Comment[];
  timeEntries: TimeEntry[];
}

interface TaskDetailDrawerProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  editable?: boolean;
}

export function TaskDetailDrawer({
  task,
  open,
  onClose,
  editable = true,
}: TaskDetailDrawerProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [status, setStatus] = useState<TaskStatus>(task?.status || "todo");
  const [priority, setPriority] = useState<Priority>(task?.priority || "medium");
  const [tags, setTags] = useState<string[]>(task?.tags || []);
  const [estimatedHours, setEstimatedHours] = useState(
    task?.estimatedSeconds ? (task.estimatedSeconds / 3600).toString() : ""
  );
  const [dueDate, setDueDate] = useState(
    task?.dueDate ? task.dueDate.split("T")[0] : ""
  );

  // Reset form when task changes
  const resetForm = () => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setStatus(task.status);
      setPriority(task.priority);
      setTags(task.tags);
      setEstimatedHours(
        task.estimatedSeconds ? (task.estimatedSeconds / 3600).toString() : ""
      );
      setDueDate(task.dueDate ? task.dueDate.split("T")[0] : "");
    }
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!task) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || null,
          status,
          priority,
          tags,
          estimatedSeconds: estimatedHours
            ? Math.round(parseFloat(estimatedHours) * 3600)
            : null,
          dueDate: dueDate || null,
        }),
      });

      if (response.ok) {
        setIsEditing(false);
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to update task:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!task || !confirm("Are you sure you want to delete this task?")) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        onClose();
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to delete task:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!task) return null;

  const totalTimeTracked = task.timeEntries.reduce(
    (acc, entry) => acc + entry.durationSeconds,
    0
  );

  const isOverEstimate =
    task.estimatedSeconds && totalTimeTracked > task.estimatedSeconds;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <div className="flex items-start justify-between pr-8">
            <div className="space-y-1">
              {isEditing ? (
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-lg font-semibold"
                />
              ) : (
                <SheetTitle className="text-xl">{task.title}</SheetTitle>
              )}
              <SheetDescription>Task Details</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Status and Priority Row */}
          <div className="flex flex-wrap gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Status</Label>
              {isEditing ? (
                <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">Todo</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge
                  variant={
                    status === "done"
                      ? "success"
                      : status === "in_progress"
                      ? "default"
                      : "secondary"
                  }
                >
                  {status.replace("_", " ")}
                </Badge>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Priority</Label>
              {isEditing ? (
                <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <PriorityBadge priority={priority} showIcon />
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Description</Label>
            {isEditing ? (
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description..."
                className="min-h-[100px]"
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                {task.description || "No description"}
              </p>
            )}
          </div>

          {/* Time and Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Estimated Time
              </Label>
              {isEditing ? (
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(e.target.value)}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">hours</span>
                </div>
              ) : (
                <p className="text-sm">
                  {task.estimatedSeconds
                    ? formatDuration(task.estimatedSeconds)
                    : "Not set"}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Due Date
              </Label>
              {isEditing ? (
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              ) : (
                <p className="text-sm">
                  {task.dueDate
                    ? new Date(task.dueDate).toLocaleDateString()
                    : "Not set"}
                </p>
              )}
            </div>
          </div>

          {/* Time Tracking Summary */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Time Tracked</Label>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">
                {formatDuration(totalTimeTracked)}
              </p>
              {task.estimatedSeconds && (
                <>
                  <span className="text-muted-foreground">/</span>
                  <p className="text-sm text-muted-foreground">
                    {formatDuration(task.estimatedSeconds)}
                  </p>
                </>
              )}
              {isOverEstimate && (
                <Badge variant="destructive" className="text-xs gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Over estimate
                </Badge>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Tags</Label>
            {isEditing ? (
              <TagInput tags={tags} onTagsChange={setTags} />
            ) : (
              <div className="flex flex-wrap gap-1">
                {task.tags.length > 0 ? (
                  task.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">No tags</span>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Subtasks */}
          <SubtaskList
            parentTaskId={task.id}
            projectId={task.projectId}
            subtasks={task.subtasks}
            editable={editable}
          />

          <Separator />

          {/* Comments */}
          <CommentSection taskId={task.id} comments={task.comments} />

          <Separator />

          {/* Actions */}
          {editable && (
            <div className="flex gap-2 pt-2">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    onClick={resetForm}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Changes
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                    Edit Task
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Delete
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
