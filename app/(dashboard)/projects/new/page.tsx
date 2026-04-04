"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

function NewProjectForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const freelancerId = searchParams.get("freelancerId");
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [freelancer, setFreelancer] = useState<{
    fullName: string;
    title: string;
  } | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    budget: "",
    startDate: "",
    deadline: "",
    meetingUrl: "",
  });

  useEffect(() => {
    async function fetchFreelancer() {
      if (!freelancerId) return;
      try {
        const response = await fetch(`/api/freelancers/${freelancerId}`);
        if (response.ok) {
          const data = await response.json();
          setFreelancer(data);
        }
      } catch (error) {
        console.error("Error fetching freelancer:", error);
      }
    }

    fetchFreelancer();
  }, [freelancerId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!freelancerId) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          freelancerId,
          title: formData.title,
          description: formData.description,
          budget: formData.budget ? parseFloat(formData.budget) : null,
          startDate: formData.startDate || null,
          deadline: formData.deadline || null,
          meetingUrl: formData.meetingUrl || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create project");
      }

      toast({
        title: "Project created",
        description: "Your project has been created successfully.",
      });

      router.push(`/projects/${data.id}`);
    } catch (error) {
      console.error("Error creating project:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (!freelancerId) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-10">
          <p className="text-muted-foreground mb-4">No freelancer selected</p>
          <Link href="/marketplace">
            <Button>Browse Freelancers</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
          <CardDescription>
            {freelancer
              ? `Create a project with ${freelancer.fullName}`
              : "Loading freelancer details..."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Project Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="e.g., Build E-commerce Website"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Project Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Describe your project requirements, goals, and any specific details the freelancer should know..."
              rows={6}
              required
            />
            <p className="text-xs text-muted-foreground">
              Be as detailed as possible. Our AI will use this to generate task
              suggestions.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget">Budget (USD)</Label>
            <Input
              id="budget"
              type="number"
              min="0"
              step="0.01"
              value={formData.budget}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, budget: e.target.value }))
              }
              placeholder="5000"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, startDate: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline">End Date / Deadline</Label>
              <Input
                id="deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, deadline: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="meetingUrl">Meeting Link</Label>
            <Input
              id="meetingUrl"
              type="url"
              value={formData.meetingUrl}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, meetingUrl: e.target.value }))
              }
              placeholder="https://meet.google.com/..."
            />
            <p className="text-xs text-muted-foreground">
              Optional: Add a video call link for project discussions
            </p>
          </div>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Project"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

export default function NewProjectPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <Link
        href="/marketplace"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Marketplace
      </Link>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create New Project</h1>
        <p className="text-muted-foreground">
          Define your project and start collaborating
        </p>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <NewProjectForm />
      </Suspense>
    </div>
  );
}
