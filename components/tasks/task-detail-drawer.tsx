"use client";

import { useState, useEffect } from "react";
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
  Check,
  X,
  Pencil,
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [tags, setTags] = useState<string[]>(task?.tags || []);
  const [estimatedHours, setEstimatedHours] = useState(
    task?.estimatedSeconds ? (task.estimatedSeconds / 3600).toString() : ""
  );
  const [dueDate, setDueDate] = useState(
    task?.dueDate ? task.dueDate.split("T")[0] : ""
  );

  // Reset form when task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setTags(task.tags);
      setEstimatedHours(
        task.estimatedSeconds ? (task.estimatedSeconds / 3600).toString() : ""
      );
      setDueDate(task.dueDate ? task.dueDate.split("T")[0] : "");
      setEditingField(null);
    }
  }, [task]);

  // Quick update for single field
  const updateField = async (field: string, value: unknown) => {
    if (!task) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error(`Failed to update ${field}:`, error);
    } finally {
      setIsSaving(false);
      setEditingField(null);
    }
  };

  const handleSaveTitle = () => {
    if (title.trim() && title !== task?.title) {
      updateField("title", title.trim());
    } else {
      setTitle(task?.title || "");
      setEditingField(null);
    }
  };

  const handleSaveDescription = () => {
    if (description !== task?.description) {
      updateField("description", description || null);
    }
    setEditingField(null);
  };

  const handleSaveEstimatedTime = () => {
    const seconds = estimatedHours
      ? Math.round(parseFloat(estimatedHours) * 3600)
      : null;
    if (seconds !== task?.estimatedSeconds) {
      updateField("estimatedSeconds", seconds);
    }
    setEditingField(null);
  };

  const handleSaveDueDate = () => {
    if (dueDate !== (task?.dueDate?.split("T")[0] || "")) {
      updateField("dueDate", dueDate || null);
    }
    setEditingField(null);
  };

  const handleSaveTags = (newTags: string[]) => {
    setTags(newTags);
    if (JSON.stringify(newTags) !== JSON.stringify(task?.tags)) {
      updateField("tags", newTags);
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
          <div className="pr-8">
            {editingField === "title" ? (
              <div className="flex items-center gap-2">
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-lg font-semibold"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveTitle();
                    if (e.key === "Escape") {
                      setTitle(task.title);
                      setEditingField(null);
                    }
                  }}
                />
                <Button size="icon" variant="ghost" onClick={handleSaveTitle}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    setTitle(task.title);
                    setEditingField(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <SheetTitle
                className="text-xl cursor-pointer hover:text-primary transition-colors group flex items-center gap-2"
                onClick={() => editable && setEditingField("title")}
              >
                {task.title}
                {editable && (
                  <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-50" />
                )}
              </SheetTitle>
            )}
            <SheetDescription>Task Details</SheetDescription>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Status and Priority - Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Status</Label>
              {editable ? (
                <Select
                  value={task.status}
                  onValueChange={(v) => updateField("status", v)}
                  disabled={isSaving}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge
                  variant={
                    task.status === "done"
                      ? "success"
                      : task.status === "in_progress"
                      ? "default"
                      : "secondary"
                  }
                >
                  {task.status.replace("_", " ")}
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Priority</Label>
              {editable ? (
                <Select
                  value={task.priority}
                  onValueChange={(v) => updateField("priority", v)}
                  disabled={isSaving}
                >
                  <SelectTrigger className="w-full">
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
                <PriorityBadge priority={task.priority} showIcon />
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Description</Label>
            {editingField === "description" ? (
              <div className="space-y-2">
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a description..."
                  className="min-h-[100px]"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveDescription}>
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setDescription(task.description || "");
                      setEditingField(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p
                className={`text-sm cursor-pointer hover:bg-muted/50 rounded p-2 -mx-2 transition-colors ${
                  task.description ? "" : "text-muted-foreground italic"
                }`}
                onClick={() => editable && setEditingField("description")}
              >
                {task.description || "Click to add description..."}
              </p>
            )}
          </div>

          {/* Estimated Time and Due Date - Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Estimated Time
              </Label>
              {editingField === "estimatedTime" ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(e.target.value)}
                    className="w-20"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveEstimatedTime();
                      if (e.key === "Escape") {
                        setEstimatedHours(
                          task.estimatedSeconds
                            ? (task.estimatedSeconds / 3600).toString()
                            : ""
                        );
                        setEditingField(null);
                      }
                    }}
                  />
                  <span className="text-sm text-muted-foreground">hrs</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleSaveEstimatedTime}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setEstimatedHours(
                        task.estimatedSeconds
                          ? (task.estimatedSeconds / 3600).toString()
                          : ""
                      );
                      setEditingField(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <p
                  className={`text-sm cursor-pointer hover:bg-muted/50 rounded p-2 -mx-2 transition-colors ${
                    task.estimatedSeconds ? "" : "text-muted-foreground italic"
                  }`}
                  onClick={() => editable && setEditingField("estimatedTime")}
                >
                  {task.estimatedSeconds
                    ? formatDuration(task.estimatedSeconds)
                    : "Click to set..."}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Due Date
              </Label>
              {editingField === "dueDate" ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveDueDate();
                      if (e.key === "Escape") {
                        setDueDate(task.dueDate ? task.dueDate.split("T")[0] : "");
                        setEditingField(null);
                      }
                    }}
                  />
                  <Button size="icon" variant="ghost" onClick={handleSaveDueDate}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setDueDate(task.dueDate ? task.dueDate.split("T")[0] : "");
                      setEditingField(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <p
                  className={`text-sm cursor-pointer hover:bg-muted/50 rounded p-2 -mx-2 transition-colors ${
                    task.dueDate ? "" : "text-muted-foreground italic"
                  }`}
                  onClick={() => editable && setEditingField("dueDate")}
                >
                  {task.dueDate
                    ? new Date(task.dueDate).toLocaleDateString()
                    : "Click to set..."}
                </p>
              )}
            </div>
          </div>

          {/* Time Tracking Summary */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Time Tracked</Label>
            <div className="flex items-center gap-2 flex-wrap">
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
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Tags</Label>
            {editable ? (
              <TagInput tags={tags} onTagsChange={handleSaveTags} />
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

          {/* Delete Action */}
          {editable && (
            <div className="pt-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="w-full sm:w-auto"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Delete Task
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
