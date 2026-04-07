"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProposalCard } from "@/components/proposals/ProposalCard";
import { DeclineModal } from "@/components/proposals/DeclineModal";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Inbox, FileText } from "lucide-react";
import type { Proposal } from "@/types/proposal";

export default function FreelancerIncomingProposalsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("PENDING");
  const [declineModalOpen, setDeclineModalOpen] = useState(false);
  const [proposalToDecline, setProposalToDecline] = useState<Proposal | null>(null);

  useEffect(() => {
    fetchProposals();
  }, []);

  async function fetchProposals() {
    try {
      const response = await fetch("/api/proposals");
      if (response.ok) {
        const data = await response.json();
        setProposals(data);
      }
    } catch (error) {
      console.error("Error fetching proposals:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAccept(id: string) {
    setActionLoading(id);
    try {
      const response = await fetch(`/api/proposals/${id}/respond`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ACCEPT" }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Project accepted!",
          description: "It's now in your Projects. Let's get started!",
        });
        // Redirect to the new project
        if (data.project?.id) {
          router.push(`/projects/${data.project.id}`);
        } else {
          fetchProposals();
        }
      } else {
        throw new Error(data.error || "Failed to accept proposal");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to accept proposal",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  }

  function handleDeclineClick(id: string) {
    const proposal = proposals.find((p) => p.id === id);
    if (proposal) {
      setProposalToDecline(proposal);
      setDeclineModalOpen(true);
    }
  }

  async function handleDeclineConfirm(reason?: string) {
    if (!proposalToDecline) return;

    setActionLoading(proposalToDecline.id);
    try {
      const response = await fetch(`/api/proposals/${proposalToDecline.id}/respond`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "DECLINE", declineReason: reason }),
      });

      if (response.ok) {
        toast({
          title: "Proposal declined",
          description: "The client has been notified.",
        });
        setDeclineModalOpen(false);
        setProposalToDecline(null);
        fetchProposals();
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to decline proposal");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to decline proposal",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  }

  const pendingProposals = proposals.filter((p) => p.status === "PENDING");
  const acceptedProposals = proposals.filter((p) => p.status === "ACCEPTED");
  const declinedProposals = proposals.filter((p) => p.status === "DECLINED");

  const filteredProposals =
    activeTab === "PENDING"
      ? pendingProposals
      : activeTab === "ACCEPTED"
      ? acceptedProposals
      : declinedProposals;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Incoming Proposals</h1>
        <p className="text-muted-foreground">
          Review and respond to project proposals from clients
        </p>
      </div>

      {proposals.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Inbox className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-1">No proposals yet</h3>
            <p className="text-muted-foreground text-center max-w-sm">
              When clients reach out, you&apos;ll see their project proposals here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="PENDING" className="gap-2">
              Pending
              {pendingProposals.length > 0 && (
                <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
                  {pendingProposals.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="ACCEPTED">
              Accepted ({acceptedProposals.length})
            </TabsTrigger>
            <TabsTrigger value="DECLINED">
              Declined ({declinedProposals.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {filteredProposals.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <FileText className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">
                    No {activeTab.toLowerCase()} proposals
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredProposals.map((proposal) => (
                  <ProposalCard
                    key={proposal.id}
                    proposal={proposal}
                    viewType="freelancer"
                    onAccept={handleAccept}
                    onDecline={handleDeclineClick}
                    isLoading={actionLoading === proposal.id}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Decline Modal */}
      {proposalToDecline && (
        <DeclineModal
          open={declineModalOpen}
          onOpenChange={setDeclineModalOpen}
          onConfirm={handleDeclineConfirm}
          proposalTitle={proposalToDecline.title}
          isLoading={actionLoading === proposalToDecline.id}
        />
      )}
    </div>
  );
}
