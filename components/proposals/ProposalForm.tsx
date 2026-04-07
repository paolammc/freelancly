"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Search } from "lucide-react";

interface Freelancer {
  id: string;
  email: string;
  freelancerProfile: {
    fullName: string;
    title: string;
    avatarUrl?: string;
    hourlyRate: number;
  } | null;
}

interface ProposalFormProps {
  preselectedFreelancerId?: string;
}

export function ProposalForm({ preselectedFreelancerId }: ProposalFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [loadingFreelancers, setLoadingFreelancers] = useState(true);
  const [selectedFreelancer, setSelectedFreelancer] = useState<Freelancer | null>(null);

  const [formData, setFormData] = useState({
    freelancerId: preselectedFreelancerId || "",
    title: "",
    description: "",
    budgetMin: "",
    budgetMax: "",
    timeline: "",
    scopeNotes: "",
  });

  useEffect(() => {
    async function fetchFreelancers() {
      try {
        const response = await fetch("/api/freelancers");
        if (response.ok) {
          const data = await response.json();
          setFreelancers(data);

          // If preselected, find and set the freelancer
          if (preselectedFreelancerId) {
            const preselected = data.find((f: Freelancer) => f.id === preselectedFreelancerId);
            if (preselected) {
              setSelectedFreelancer(preselected);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching freelancers:", error);
      } finally {
        setLoadingFreelancers(false);
      }
    }

    fetchFreelancers();
  }, [preselectedFreelancerId]);

  const handleFreelancerChange = (freelancerId: string) => {
    setFormData((prev) => ({ ...prev, freelancerId }));
    const freelancer = freelancers.find((f) => f.id === freelancerId);
    setSelectedFreelancer(freelancer || null);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          freelancerId: formData.freelancerId,
          title: formData.title,
          description: formData.description,
          budgetMin: formData.budgetMin ? parseFloat(formData.budgetMin) : null,
          budgetMax: formData.budgetMax ? parseFloat(formData.budgetMax) : null,
          timeline: formData.timeline || null,
          scopeNotes: formData.scopeNotes || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send proposal");
      }

      toast({
        title: "Proposal sent!",
        description: "The freelancer will be notified and can respond to your proposal.",
      });

      router.push("/proposals");
    } catch (error) {
      console.error("Error sending proposal:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send proposal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Proposal Details</CardTitle>
          <CardDescription>
            Describe your project and what you&apos;re looking for
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Freelancer Selector */}
          <div className="space-y-2">
            <Label htmlFor="freelancer">Select Freelancer *</Label>
            {loadingFreelancers ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading freelancers...
              </div>
            ) : (
              <Select
                value={formData.freelancerId}
                onValueChange={handleFreelancerChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a freelancer" />
                </SelectTrigger>
                <SelectContent>
                  {freelancers.map((freelancer) => (
                    <SelectItem key={freelancer.id} value={freelancer.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={freelancer.freelancerProfile?.avatarUrl || undefined} />
                          <AvatarFallback className="text-xs">
                            {(freelancer.freelancerProfile?.fullName || freelancer.email)
                              .charAt(0)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>
                          {freelancer.freelancerProfile?.fullName || freelancer.email}
                        </span>
                        {freelancer.freelancerProfile?.title && (
                          <span className="text-muted-foreground text-xs">
                            • {freelancer.freelancerProfile.title}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {selectedFreelancer?.freelancerProfile && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg mt-2">
                <Avatar>
                  <AvatarImage src={selectedFreelancer.freelancerProfile.avatarUrl || undefined} />
                  <AvatarFallback>
                    {selectedFreelancer.freelancerProfile.fullName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedFreelancer.freelancerProfile.fullName}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedFreelancer.freelancerProfile.title}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Project Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Project Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="e.g., E-commerce Website Redesign"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Project Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Describe what you're looking to accomplish, your goals, and any specific requirements..."
              rows={6}
              required
            />
          </div>

          {/* Budget Range */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budgetMin">Budget Min (USD)</Label>
              <Input
                id="budgetMin"
                type="number"
                min="0"
                step="0.01"
                value={formData.budgetMin}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, budgetMin: e.target.value }))
                }
                placeholder="1000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budgetMax">Budget Max (USD)</Label>
              <Input
                id="budgetMax"
                type="number"
                min="0"
                step="0.01"
                value={formData.budgetMax}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, budgetMax: e.target.value }))
                }
                placeholder="5000"
              />
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-2">
            <Label htmlFor="timeline">Timeline</Label>
            <Input
              id="timeline"
              value={formData.timeline}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, timeline: e.target.value }))
              }
              placeholder="e.g., 2-4 weeks, 1 month, Flexible"
            />
          </div>

          {/* Scope Notes */}
          <div className="space-y-2">
            <Label htmlFor="scopeNotes">Additional Notes</Label>
            <Textarea
              id="scopeNotes"
              value={formData.scopeNotes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, scopeNotes: e.target.value }))
              }
              placeholder="Any additional details about scope, deliverables, or expectations..."
              rows={3}
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !formData.freelancerId}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                "Send Proposal"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
