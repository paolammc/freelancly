"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Briefcase } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"client" | "freelancer" | null>(null);

  async function handleRoleSelection() {
    if (!selectedRole || !user) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/users/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: selectedRole }),
      });

      if (!response.ok) {
        throw new Error("Failed to update role");
      }

      if (selectedRole === "freelancer") {
        router.push("/freelancer/profile");
      } else {
        router.push("/client/dashboard");
      }
    } catch (error) {
      console.error("Error setting role:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/20 p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome to Freelancly!</h1>
          <p className="text-muted-foreground">
            Let&apos;s get you set up. How do you plan to use the platform?
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card
            className={`cursor-pointer transition-all hover:border-primary ${
              selectedRole === "client" ? "border-primary ring-2 ring-primary" : ""
            }`}
            onClick={() => setSelectedRole("client")}
          >
            <CardHeader>
              <Users className="h-10 w-10 text-primary mb-2" />
              <CardTitle>I&apos;m a Client</CardTitle>
              <CardDescription>
                I want to hire freelancers for my projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>- Browse skilled freelancers</li>
                <li>- Create and manage projects</li>
                <li>- Use AI to generate tasks</li>
                <li>- Track project progress</li>
              </ul>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all hover:border-primary ${
              selectedRole === "freelancer" ? "border-primary ring-2 ring-primary" : ""
            }`}
            onClick={() => setSelectedRole("freelancer")}
          >
            <CardHeader>
              <Briefcase className="h-10 w-10 text-primary mb-2" />
              <CardTitle>I&apos;m a Freelancer</CardTitle>
              <CardDescription>
                I want to offer my services and find work
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>- Create your professional profile</li>
                <li>- Showcase your skills</li>
                <li>- Work on client projects</li>
                <li>- Track your time and earnings</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Button
            size="lg"
            onClick={handleRoleSelection}
            disabled={!selectedRole || isLoading}
          >
            {isLoading ? "Setting up..." : "Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}
