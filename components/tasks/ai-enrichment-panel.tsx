"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Clock, Flag, Tag, ListTodo, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface AIEnrichment {
  subtasks: string[];
  estimatedSeconds: number;
  priority: "low" | "medium" | "high" | "urgent";
  tags: string[];
  suggestedProject?: string;
}

interface AIEnrichmentPanelProps {
  enrichment: AIEnrichment;
  useEnrichment: boolean;
  onToggle: () => void;
}

const priorityColors = {
  low: "bg-slate-100 text-slate-700 border-slate-200",
  medium: "bg-blue-100 text-blue-700 border-blue-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  urgent: "bg-red-100 text-red-700 border-red-200",
};

function formatEstimatedTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export function AIEnrichmentPanel({
  enrichment,
  useEnrichment,
  onToggle,
}: AIEnrichmentPanelProps) {
  return (
    <Card className={cn(
      "border-2 transition-colors",
      useEnrichment ? "border-primary bg-primary/5" : "border-dashed"
    )}>
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <Checkbox
            id="use-enrichment"
            checked={useEnrichment}
            onCheckedChange={onToggle}
            className="mt-1"
          />
          <div className="flex-1 space-y-3">
            <label
              htmlFor="use-enrichment"
              className="text-sm font-medium cursor-pointer flex items-center gap-2"
            >
              <span>Use AI suggestions</span>
              {useEnrichment && <Check className="h-4 w-4 text-primary" />}
            </label>

            <div className="grid grid-cols-2 gap-4 text-sm">
              {/* Priority */}
              <div className="flex items-center gap-2">
                <Flag className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Priority:</span>
                <Badge
                  variant="outline"
                  className={cn("capitalize", priorityColors[enrichment.priority])}
                >
                  {enrichment.priority}
                </Badge>
              </div>

              {/* Estimated Time */}
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Estimate:</span>
                <span className="font-medium">
                  {formatEstimatedTime(enrichment.estimatedSeconds)}
                </span>
              </div>
            </div>

            {/* Tags */}
            {enrichment.tags.length > 0 && (
              <div className="flex items-start gap-2">
                <Tag className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex flex-wrap gap-1">
                  {enrichment.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Subtasks */}
            {enrichment.subtasks.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <ListTodo className="h-4 w-4" />
                  <span className="text-sm">Suggested subtasks:</span>
                </div>
                <ul className="space-y-1 pl-6">
                  {enrichment.subtasks.map((subtask, index) => (
                    <li
                      key={index}
                      className="text-sm text-muted-foreground flex items-center gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                      {subtask}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
