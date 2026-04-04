"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EstimatePreview } from "@/components/billing/estimate-preview";
import { Loader2, CheckCircle, XCircle, AlertCircle, ArrowLeft, MessageSquare } from "lucide-react";

interface EstimateItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

interface Estimate {
  id: string;
  title: string;
  description: string | null;
  status: "draft" | "sent" | "approved" | "rejected" | "expired";
  totalAmount: number;
  validUntil: string | null;
  sentAt: string | null;
  approvedAt: string | null;
  approvalToken: string | null;
  items: EstimateItem[];
  project: {
    id: string;
    title: string;
  };
  freelancer: {
    email: string;
    freelancerProfile: {
      fullName: string;
      title: string;
    } | null;
  };
  client: {
    email: string;
  };
}

export default function ClientEstimatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<"approved" | "rejected" | null>(null);

  useEffect(() => {
    async function fetchEstimate() {
      try {
        const response = await fetch(`/api/estimates/${id}`);
        if (response.ok) {
          const data = await response.json();
          setEstimate(data);
        } else {
          const errorData = await response.json();
          setError(errorData.error || "Estimate not found");
        }
      } catch (err) {
        setError("Failed to load estimate");
      } finally {
        setLoading(false);
      }
    }

    fetchEstimate();
  }, [id]);

  const handleAction = async (action: "approve" | "reject") => {
    if (!estimate?.approvalToken) {
      setError("Unable to process this estimate");
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch(`/api/estimates/approve/${estimate.approvalToken}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        setResult(action === "approve" ? "approved" : "rejected");
        // Update local state
        setEstimate(prev => prev ? { ...prev, status: action === "approve" ? "approved" : "rejected" } : null);

        // Mark that estimate was viewed in localStorage for onboarding
        localStorage.setItem("client-first-estimate-viewed", "true");
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to process");
      }
    } catch (err) {
      setError("Failed to process");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && !estimate) {
    return (
      <div className="space-y-6">
        <Link
          href="/client/dashboard"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>

        <Card>
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Unable to Load Estimate</h2>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!estimate) return null;

  const isExpired =
    estimate.validUntil && new Date(estimate.validUntil) < new Date();

  const canTakeAction = estimate.status === "sent" && !isExpired;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/client/dashboard"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>

        <Link href="/client/inbox">
          <Button variant="outline" size="sm">
            <MessageSquare className="h-4 w-4 mr-2" />
            Message Freelancer
          </Button>
        </Link>
      </div>

      {/* Success/Result Banner */}
      {result && (
        <Card className={result === "approved" ? "border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800" : "border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800"}>
          <CardContent className="pt-6 text-center">
            {result === "approved" ? (
              <>
                <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2">Estimate Approved!</h2>
                <p className="text-muted-foreground">
                  Thank you for approving this estimate. Your freelancer has been
                  notified and will begin work shortly.
                </p>
              </>
            ) : (
              <>
                <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2">Estimate Rejected</h2>
                <p className="text-muted-foreground">
                  This estimate has been rejected. Consider messaging your freelancer
                  to discuss alternative options.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Status Banner for already processed estimates */}
      {!result && estimate.status !== "sent" && (
        <Card className={
          estimate.status === "approved"
            ? "border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800"
            : estimate.status === "rejected"
            ? "border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800"
            : "border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800"
        }>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              {estimate.status === "approved" && (
                <>
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                  <span className="font-medium text-emerald-700 dark:text-emerald-400">
                    This estimate was approved on {estimate.approvedAt ? new Date(estimate.approvedAt).toLocaleDateString() : ""}
                  </span>
                </>
              )}
              {estimate.status === "rejected" && (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="font-medium text-red-700 dark:text-red-400">
                    This estimate was rejected
                  </span>
                </>
              )}
              {estimate.status === "expired" && (
                <>
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  <span className="font-medium text-amber-700 dark:text-amber-400">
                    This estimate has expired. Please contact your freelancer for an updated estimate.
                  </span>
                </>
              )}
              {estimate.status === "draft" && (
                <>
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  <span className="font-medium text-amber-700 dark:text-amber-400">
                    This estimate is still being drafted by your freelancer.
                  </span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expiration Warning */}
      {estimate.status === "sent" && isExpired && !result && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <span className="font-medium text-amber-700 dark:text-amber-400">
                This estimate has expired. Please contact your freelancer for an updated estimate.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estimate Preview */}
      <EstimatePreview
        estimate={{
          ...estimate,
          items: estimate.items.map((item) => ({
            ...item,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            amount: Number(item.amount),
          })),
        }}
        freelancer={
          estimate.freelancer.freelancerProfile
            ? {
                name: estimate.freelancer.freelancerProfile.fullName,
                email: estimate.freelancer.email,
                title: estimate.freelancer.freelancerProfile.title,
              }
            : {
                name: estimate.freelancer.email,
                email: estimate.freelancer.email,
              }
        }
        client={{ email: estimate.client.email }}
        project={{ title: estimate.project.title }}
      />

      {/* Action Buttons */}
      {canTakeAction && !result && (
        <Card>
          <CardHeader>
            <CardTitle>Review This Estimate</CardTitle>
            <CardDescription>
              Please review the details above and approve or reject this estimate.
              {estimate.validUntil && (
                <span className="block mt-1">
                  Valid until: {new Date(estimate.validUntil).toLocaleDateString()}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4">
            <Button
              className="flex-1"
              size="lg"
              onClick={() => handleAction("approve")}
              disabled={processing}
            >
              {processing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Approve Estimate
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              size="lg"
              onClick={() => handleAction("reject")}
              disabled={processing}
            >
              {processing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Reject
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Project Link */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Related Project</p>
              <p className="font-medium">{estimate.project.title}</p>
            </div>
            <Link href={`/projects/${estimate.project.id}`}>
              <Button variant="outline" size="sm">
                View Project
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
