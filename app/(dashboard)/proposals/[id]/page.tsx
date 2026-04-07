"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ProposalDetailView } from "@/components/proposals/ProposalDetailView";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Loader2, ExternalLink } from "lucide-react";
import type { Proposal } from "@/types/proposal";

export default function ClientProposalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProposal() {
      try {
        const response = await fetch(`/api/proposals/${id}`);
        if (response.ok) {
          const data = await response.json();
          setProposal(data);
        } else {
          const errorData = await response.json();
          setError(errorData.error || "Proposal not found");
        }
      } catch (err) {
        setError("Failed to load proposal");
      } finally {
        setIsLoading(false);
      }
    }

    fetchProposal();
  }, [id]);

  async function handleWithdraw() {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/proposals/${id}/withdraw`, {
        method: "PATCH",
      });

      if (response.ok) {
        toast({
          title: "Proposal withdrawn",
          description: "Your proposal has been withdrawn.",
        });
        router.push("/proposals");
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
      setActionLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="space-y-6">
        <Link
          href="/proposals"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Proposals
        </Link>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Proposal Not Found</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/proposals"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Proposals
        </Link>

        <div className="flex gap-2">
          {proposal.status === "PENDING" && (
            <Button
              variant="outline"
              onClick={handleWithdraw}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Withdraw Proposal
            </Button>
          )}
          {proposal.status === "ACCEPTED" && proposal.projectId && (
            <Link href={`/projects/${proposal.projectId}`}>
              <Button className="gap-2">
                View Project
                <ExternalLink className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      <ProposalDetailView proposal={proposal} viewType="client" />
    </div>
  );
}
