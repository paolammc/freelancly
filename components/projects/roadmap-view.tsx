"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Milestone } from "lucide-react";
import { cn } from "@/lib/utils";

interface RoadmapMilestone {
  title: string;
  description: string;
  tasks: string[];
}

interface RoadmapPhase {
  name: string;
  description: string;
  duration: string;
  milestones: RoadmapMilestone[];
}

interface Roadmap {
  id: string;
  title: string;
  description: string | null;
  phases: RoadmapPhase[];
  createdAt: string;
}

interface RoadmapViewProps {
  roadmap: Roadmap;
}

const phaseColors = [
  "border-blue-500 bg-blue-500/10",
  "border-emerald-500 bg-emerald-500/10",
  "border-amber-500 bg-amber-500/10",
  "border-purple-500 bg-purple-500/10",
  "border-rose-500 bg-rose-500/10",
];

export function RoadmapView({ roadmap }: RoadmapViewProps) {
  return (
    <div className="space-y-6">
      {/* Timeline view */}
      <div className="relative">
        {roadmap.phases.map((phase, phaseIndex) => (
          <div key={phaseIndex} className="relative pl-8 pb-8 last:pb-0">
            {/* Timeline line */}
            {phaseIndex < roadmap.phases.length - 1 && (
              <div className="absolute left-3 top-6 bottom-0 w-0.5 bg-border" />
            )}

            {/* Phase marker */}
            <div
              className={cn(
                "absolute left-0 top-1 w-6 h-6 rounded-full border-2 flex items-center justify-center bg-background",
                phaseColors[phaseIndex % phaseColors.length]
              )}
            >
              <span className="text-xs font-bold">{phaseIndex + 1}</span>
            </div>

            {/* Phase content */}
            <Card className={cn("border-l-4", phaseColors[phaseIndex % phaseColors.length])}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{phase.name}</CardTitle>
                    <CardDescription className="mt-1">{phase.description}</CardDescription>
                  </div>
                  <Badge variant="outline" className="shrink-0">
                    <Clock className="h-3 w-3 mr-1" />
                    {phase.duration}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {phase.milestones.map((milestone, milestoneIndex) => (
                    <div
                      key={milestoneIndex}
                      className="rounded-lg bg-muted/50 p-4 space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <Milestone className="h-4 w-4 text-primary" />
                        <h4 className="font-medium text-sm">{milestone.title}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {milestone.description}
                      </p>
                      {milestone.tasks.length > 0 && (
                        <ul className="space-y-1 pt-2">
                          {milestone.tasks.map((task, taskIndex) => (
                            <li
                              key={taskIndex}
                              className="flex items-center gap-2 text-sm text-muted-foreground"
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              {task}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
