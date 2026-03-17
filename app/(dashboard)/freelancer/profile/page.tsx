"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { X } from "lucide-react";

interface ProfileData {
  fullName: string;
  title: string;
  bio: string;
  skills: string[];
  hourlyRate: string;
  portfolioUrl: string;
  avatarUrl: string;
}

export default function FreelancerProfilePage() {
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [skillInput, setSkillInput] = useState("");
  const [profile, setProfile] = useState<ProfileData>({
    fullName: "",
    title: "",
    bio: "",
    skills: [],
    hourlyRate: "",
    portfolioUrl: "",
    avatarUrl: "",
  });

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch("/api/freelancers/me");
        if (response.ok) {
          const data = await response.json();
          if (data) {
            setProfile({
              fullName: data.fullName || "",
              title: data.title || "",
              bio: data.bio || "",
              skills: data.skills || [],
              hourlyRate: data.hourlyRate?.toString() || "",
              portfolioUrl: data.portfolioUrl || "",
              avatarUrl: data.avatarUrl || "",
            });
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setIsFetching(false);
      }
    }

    fetchProfile();
  }, []);

  function addSkill(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && skillInput.trim()) {
      e.preventDefault();
      if (!profile.skills.includes(skillInput.trim())) {
        setProfile((prev) => ({
          ...prev,
          skills: [...prev.skills, skillInput.trim()],
        }));
      }
      setSkillInput("");
    }
  }

  function removeSkill(skill: string) {
    setProfile((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/freelancers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...profile,
          hourlyRate: parseFloat(profile.hourlyRate) || 0,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save profile");
      }

      toast({
        title: "Profile saved",
        description: "Your profile has been updated successfully.",
      });

      router.push("/freelancer/dashboard");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (isFetching) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-muted-foreground">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Freelancer Profile</h1>
        <p className="text-muted-foreground">
          Complete your profile to appear in the marketplace
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              This information will be displayed to potential clients
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                value={profile.fullName}
                onChange={(e) => setProfile((prev) => ({ ...prev, fullName: e.target.value }))}
                placeholder="John Doe"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Professional Title *</Label>
              <Input
                id="title"
                value={profile.title}
                onChange={(e) => setProfile((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Full Stack Developer"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio *</Label>
              <Textarea
                id="bio"
                value={profile.bio}
                onChange={(e) => setProfile((prev) => ({ ...prev, bio: e.target.value }))}
                placeholder="Tell clients about yourself, your experience, and what you can offer..."
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="skills">Skills</Label>
              <Input
                id="skills"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={addSkill}
                placeholder="Type a skill and press Enter"
              />
              {profile.skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {profile.skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="gap-1">
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="hourlyRate">Hourly Rate (USD) *</Label>
              <Input
                id="hourlyRate"
                type="number"
                min="0"
                step="0.01"
                value={profile.hourlyRate}
                onChange={(e) => setProfile((prev) => ({ ...prev, hourlyRate: e.target.value }))}
                placeholder="50"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="portfolioUrl">Portfolio URL</Label>
              <Input
                id="portfolioUrl"
                type="url"
                value={profile.portfolioUrl}
                onChange={(e) => setProfile((prev) => ({ ...prev, portfolioUrl: e.target.value }))}
                placeholder="https://yourportfolio.com"
              />
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
                {isLoading ? "Saving..." : "Save Profile"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
