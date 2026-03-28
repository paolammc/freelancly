"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Map, FileText, Sparkles, ListPlus } from "lucide-react";
import { RoadmapView } from "./roadmap-view";
import { PRDView } from "./prd-view";

interface RoadmapPhase {
  name: string;
  description: string;
  duration: string;
  milestones: {
    title: string;
    description: string;
    tasks: string[];
  }[];
}

interface Roadmap {
  id: string;
  title: string;
  description: string | null;
  phases: RoadmapPhase[];
  createdAt: string;
}

interface PRDFeature {
  name: string;
  description: string;
  priority: string;
  userStory: string;
}

interface PRDUserFlow {
  name: string;
  steps: string[];
}

interface PRD {
  id: string;
  title: string;
  problem: string | null;
  goals: string | null;
  features: PRDFeature[] | null;
  userFlows: PRDUserFlow[] | null;
  metrics: string[] | null;
  content: string | null;
  createdAt: string;
}

interface AIToolsPanelProps {
  projectId: string;
  initialRoadmap?: Roadmap | null;
  initialPRD?: PRD | null;
}

export function AIToolsPanel({
  projectId,
  initialRoadmap,
  initialPRD,
}: AIToolsPanelProps) {
  const router = useRouter();
  const [roadmap, setRoadmap] = useState<Roadmap | null>(initialRoadmap || null);
  const [prd, setPRD] = useState<PRD | null>(initialPRD || null);
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);
  const [isGeneratingPRD, setIsGeneratingPRD] = useState(false);
  const [isGeneratingTasks, setIsGeneratingTasks] = useState(false);
  const [roadmapDialogOpen, setRoadmapDialogOpen] = useState(false);
  const [prdDialogOpen, setPRDDialogOpen] = useState(false);

  const handleGenerateRoadmap = async () => {
    setIsGeneratingRoadmap(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/roadmap`, {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        setRoadmap(data);
        setRoadmapDialogOpen(true);
      }
    } catch (error) {
      console.error("Failed to generate roadmap:", error);
    } finally {
      setIsGeneratingRoadmap(false);
    }
  };

  const handleGeneratePRD = async () => {
    setIsGeneratingPRD(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/prd`, {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        setPRD(data);
        setPRDDialogOpen(true);
      }
    } catch (error) {
      console.error("Failed to generate PRD:", error);
    } finally {
      setIsGeneratingPRD(false);
    }
  };

  const handleGenerateTasksFromRoadmap = async () => {
    if (!roadmap) return;

    setIsGeneratingTasks(true);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/roadmap/generate-tasks`,
        { method: "POST" }
      );

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to generate tasks:", error);
    } finally {
      setIsGeneratingTasks(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Project Tools
        </CardTitle>
        <CardDescription>
          Generate roadmaps, PRDs, and tasks with AI assistance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Roadmap Section */}
          <Card className="border-dashed">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Map className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium">Project Roadmap</h4>
                  <p className="text-xs text-muted-foreground">
                    {roadmap ? "View or regenerate" : "Generate phases & milestones"}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {roadmap ? (
                  <>
                    <Dialog open={roadmapDialogOpen} onOpenChange={setRoadmapDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          View Roadmap
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>{roadmap.title}</DialogTitle>
                          <DialogDescription>{roadmap.description}</DialogDescription>
                        </DialogHeader>
                        <RoadmapView roadmap={roadmap} />
                        <div className="flex justify-end mt-4">
                          <Button
                            onClick={handleGenerateTasksFromRoadmap}
                            disabled={isGeneratingTasks}
                          >
                            {isGeneratingTasks ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <ListPlus className="h-4 w-4 mr-2" />
                            )}
                            Create Tasks from Roadmap
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleGenerateRoadmap}
                      disabled={isGeneratingRoadmap}
                    >
                      {isGeneratingRoadmap ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Regenerate"
                      )}
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleGenerateRoadmap}
                    disabled={isGeneratingRoadmap}
                  >
                    {isGeneratingRoadmap ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Map className="h-4 w-4 mr-2" />
                    )}
                    Generate Roadmap
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* PRD Section */}
          <Card className="border-dashed">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium">Product Requirements</h4>
                  <p className="text-xs text-muted-foreground">
                    {prd ? "View or regenerate" : "Generate PRD document"}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {prd ? (
                  <>
                    <Dialog open={prdDialogOpen} onOpenChange={setPRDDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          View PRD
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>{prd.title}</DialogTitle>
                        </DialogHeader>
                        <PRDView prd={prd} />
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleGeneratePRD}
                      disabled={isGeneratingPRD}
                    >
                      {isGeneratingPRD ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Regenerate"
                      )}
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleGeneratePRD}
                    disabled={isGeneratingPRD}
                  >
                    {isGeneratingPRD ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <FileText className="h-4 w-4 mr-2" />
                    )}
                    Generate PRD
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
