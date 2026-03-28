"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Target,
  Lightbulb,
  Users,
  BarChart3,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

interface PRDViewProps {
  prd: PRD;
}

const priorityColors: Record<string, string> = {
  "must-have": "bg-red-100 text-red-700 border-red-200",
  "should-have": "bg-orange-100 text-orange-700 border-orange-200",
  "nice-to-have": "bg-green-100 text-green-700 border-green-200",
};

export function PRDView({ prd }: PRDViewProps) {
  const goals = prd.goals?.split("\n").filter(Boolean) || [];
  const features = (prd.features as PRDFeature[]) || [];
  const userFlows = (prd.userFlows as PRDUserFlow[]) || [];
  const metrics = (prd.metrics as string[]) || [];

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="features">Features</TabsTrigger>
        <TabsTrigger value="flows">User Flows</TabsTrigger>
        <TabsTrigger value="document">Full Document</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-4 mt-4">
        {/* Problem Statement */}
        {prd.problem && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertCircle className="h-5 w-5 text-red-500" />
                Problem Statement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{prd.problem}</p>
            </CardContent>
          </Card>
        )}

        {/* Goals */}
        {goals.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-5 w-5 text-blue-500" />
                Goals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {goals.map((goal, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                    <span className="text-sm">{goal}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Success Metrics */}
        {metrics.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-5 w-5 text-purple-500" />
                Success Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {metrics.map((metric, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary font-medium">
                      {index + 1}.
                    </span>
                    <span className="text-sm">{metric}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="features" className="mt-4">
        <div className="space-y-3">
          {features.length > 0 ? (
            features.map((feature, index) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-amber-500" />
                      {feature.name}
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className={cn(
                        "capitalize",
                        priorityColors[feature.priority] || "bg-gray-100"
                      )}
                    >
                      {feature.priority}
                    </Badge>
                  </div>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                {feature.userStory && (
                  <CardContent className="pt-0">
                    <p className="text-sm italic text-muted-foreground bg-muted/50 rounded-md p-3">
                      {feature.userStory}
                    </p>
                  </CardContent>
                )}
              </Card>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No features defined
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="flows" className="mt-4">
        <div className="space-y-4">
          {userFlows.length > 0 ? (
            userFlows.map((flow, flowIndex) => (
              <Card key={flowIndex}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="h-4 w-4 text-indigo-500" />
                    {flow.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {flow.steps.map((step, stepIndex) => (
                      <div
                        key={stepIndex}
                        className="flex items-center gap-2 text-sm"
                      >
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                            {stepIndex + 1}
                          </span>
                          <span>{step}</span>
                        </div>
                        {stepIndex < flow.steps.length - 1 && (
                          <ArrowRight className="h-3 w-3 text-muted-foreground ml-auto" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No user flows defined
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="document" className="mt-4">
        {prd.content ? (
          <Card>
            <CardContent className="pt-6">
              <div
                className="prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{
                  __html: prd.content
                    .replace(/\n/g, "<br>")
                    .replace(/#{3} (.*)/g, "<h3>$1</h3>")
                    .replace(/#{2} (.*)/g, "<h2>$1</h2>")
                    .replace(/#{1} (.*)/g, "<h1>$1</h1>")
                    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                    .replace(/\*(.*?)\*/g, "<em>$1</em>"),
                }}
              />
            </CardContent>
          </Card>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No document content available
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
