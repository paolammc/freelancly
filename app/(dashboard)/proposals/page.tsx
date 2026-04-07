"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProposalCard } from "@/components/proposals/ProposalCard";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Plus, Send, FileText } from "lucide-react";
import type { Proposal, ProposalStatus } from "@/types/proposal";

export default function ClientProposalsPage() {
  const { toast } = useToast();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all");

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

  async function handleWithdraw(id: string) {
    setActionLoading(id);
    try {
      const response = await fetch(`/api/proposals/${id}/withdraw`, {
        method: "PATCH",
      });

      if (response.ok) {
        toast({
          title: "Proposal withdrawn",
          description: "Your proposal has been withdrawn.",
        });
        fetchProposals();
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to withdraw proposal");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to withdraw proposal",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  }

  const filteredProposals =
    activeTab === "all"
      ? proposals
      : proposals.filter((p) => p.status === activeTab);

  const pendingCount = proposals.filter((p) => p.status === "PENDING").length;
  const acceptedCount = proposals.filter((p) => p.status === "ACCEPTED").length;
  const declinedCount = proposals.filter((p) => p.status === "DECLINED").length;
  const withdrawnCount = proposals.filter((p) => p.status === "WITHDRAWN").length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">My Proposals</h1>
          <p className="text-muted-foreground">
            Track and manage your project proposals
          </p>
        </div>
        <Link href="/proposals/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Send New Proposal
          </Button>
        </Link>
      </div>

      {proposals.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Send className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-1">No proposals yet</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-sm">
              You haven&apos;t sent any proposals yet. Find a freelancer and get started.
            </p>
            <Link href="/marketplace">
              <Button>Browse Freelancers</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">
              All ({proposals.length})
            </TabsTrigger>
            <TabsTrigger value="PENDING">
              Pending ({pendingCount})
            </TabsTrigger>
            <TabsTrigger value="ACCEPTED">
              Accepted ({acceptedCount})
            </TabsTrigger>
            <TabsTrigger value="DECLINED">
              Declined ({declinedCount})
            </TabsTrigger>
            <TabsTrigger value="WITHDRAWN">
              Withdrawn ({withdrawnCount})
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
                    viewType="client"
                    onWithdraw={handleWithdraw}
                    isLoading={actionLoading === proposal.id}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
