"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

// This page now redirects to the proposal flow
// Clients should send proposals, not create projects directly

function RedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const freelancerId = searchParams.get("freelancerId");

  useEffect(() => {
    if (freelancerId) {
      // Redirect to proposal form with the freelancer pre-selected
      router.replace(`/proposals/new?freelancerId=${freelancerId}`);
    } else {
      // No freelancer selected, go to marketplace
      router.replace("/marketplace");
    }
  }, [freelancerId, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <p className="text-muted-foreground">Redirecting to proposal form...</p>
    </div>
  );
}

export default function NewProjectPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      }
    >
      <RedirectContent />
    </Suspense>
  );
}
