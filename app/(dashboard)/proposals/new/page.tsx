"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ProposalForm } from "@/components/proposals/ProposalForm";
import { ArrowLeft, Loader2 } from "lucide-react";

function NewProposalContent() {
  const searchParams = useSearchParams();
  const freelancerId = searchParams.get("freelancerId");

  return (
    <ProposalForm preselectedFreelancerId={freelancerId || undefined} />
  );
}

export default function NewProposalPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <Link
        href="/proposals"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Proposals
      </Link>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Send a Proposal</h1>
        <p className="text-muted-foreground">
          Describe your project and reach out to a freelancer
        </p>
      </div>

      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <NewProposalContent />
      </Suspense>
    </div>
  );
}
