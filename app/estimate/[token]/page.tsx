"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EstimatePreview } from "@/components/billing/estimate-preview";
import { Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";

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

export default function EstimateApprovalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<"approved" | "rejected" | null>(null);

  useEffect(() => {
    async function fetchEstimate() {
      try {
        const response = await fetch(`/api/estimates/approve/${token}`);
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
  }, [token]);

  const handleAction = async (action: "approve" | "reject") => {
    setProcessing(true);
    try {
      const response = await fetch(`/api/estimates/approve/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        setResult(action === "approve" ? "approved" : "rejected");
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
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Unable to Load Estimate</h2>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            {result === "approved" ? (
              <>
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2">Estimate Approved!</h2>
                <p className="text-muted-foreground">
                  Thank you for approving this estimate. The freelancer has been
                  notified and will begin work shortly.
                </p>
              </>
            ) : (
              <>
                <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2">Estimate Rejected</h2>
                <p className="text-muted-foreground">
                  This estimate has been rejected. The freelancer has been notified.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!estimate) return null;

  const isExpired =
    estimate.validUntil && new Date(estimate.validUntil) < new Date();

  const alreadyProcessed = estimate.status !== "sent";

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {alreadyProcessed ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">
                This estimate has already been {estimate.status}
              </h2>
            </CardContent>
          </Card>
        ) : isExpired ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">This estimate has expired</h2>
              <p className="text-muted-foreground">
                Please contact the freelancer for an updated estimate.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
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

            <Card>
              <CardHeader>
                <CardTitle>Review This Estimate</CardTitle>
                <CardDescription>
                  Please review the details above and approve or reject this estimate.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex gap-4">
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
          </>
        )}
      </div>
    </div>
  );
}
