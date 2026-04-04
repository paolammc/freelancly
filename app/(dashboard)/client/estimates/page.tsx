import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

const statusConfig = {
  draft: { label: "Draft", variant: "secondary" as const, icon: Clock },
  sent: { label: "Pending Review", variant: "default" as const, icon: AlertCircle },
  approved: { label: "Approved", variant: "success" as const, icon: CheckCircle },
  rejected: { label: "Rejected", variant: "destructive" as const, icon: XCircle },
  expired: { label: "Expired", variant: "outline" as const, icon: AlertCircle },
};

export default async function ClientEstimatesPage() {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    redirect("/sign-in");
  }

  const user = await db.user.findUnique({
    where: { clerkUserId },
  });

  if (!user) {
    redirect("/onboarding");
  }

  if (user.role !== "client") {
    redirect("/freelancer/dashboard");
  }

  const estimates = await db.estimate.findMany({
    where: { clientId: user.id },
    include: {
      project: {
        select: {
          id: true,
          title: true,
        },
      },
      freelancer: {
        select: {
          email: true,
          freelancerProfile: {
            select: {
              fullName: true,
            },
          },
        },
      },
      items: {
        orderBy: { order: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Separate pending from other estimates
  const pendingEstimates = estimates.filter(e => e.status === "sent");
  const otherEstimates = estimates.filter(e => e.status !== "sent");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/client/dashboard"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Estimates</h1>
          <p className="text-muted-foreground">
            Review and manage project estimates
          </p>
        </div>
      </div>

      {estimates.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-1">No estimates yet</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-sm">
              You&apos;ll see estimates here once your freelancer sends them for review.
            </p>
            <Link href="/client/dashboard">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Pending Estimates - Highlighted */}
          {pendingEstimates.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                <h2 className="text-lg font-semibold">Awaiting Your Review</h2>
                <Badge variant="secondary">{pendingEstimates.length}</Badge>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {pendingEstimates.map((estimate) => {
                  const status = statusConfig[estimate.status];
                  const StatusIcon = status.icon;
                  const isExpired =
                    estimate.validUntil && new Date(estimate.validUntil) < new Date();

                  return (
                    <Link key={estimate.id} href={`/client/estimates/${estimate.id}`}>
                      <Card className="hover:border-primary transition-colors cursor-pointer h-full border-amber-200 bg-amber-50/50 dark:bg-amber-900/10 dark:border-amber-800">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-lg line-clamp-1">
                                {estimate.title}
                              </CardTitle>
                              <CardDescription className="mt-1">
                                {estimate.project.title}
                              </CardDescription>
                            </div>
                            <Badge variant={isExpired ? "outline" : status.variant}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {isExpired ? "Expired" : "Needs Review"}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">From</span>
                              <span className="text-sm font-medium">
                                {estimate.freelancer.freelancerProfile?.fullName ||
                                  estimate.freelancer.email}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Amount</span>
                              <span className="text-lg font-bold">
                                {formatCurrency(Number(estimate.totalAmount))}
                              </span>
                            </div>
                            {estimate.validUntil && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Valid Until</span>
                                <span className={`text-sm ${isExpired ? "text-destructive" : ""}`}>
                                  {formatDate(estimate.validUntil)}
                                </span>
                              </div>
                            )}
                            <Button className="w-full mt-2" size="sm">
                              Review Estimate
                              <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Other Estimates */}
          {otherEstimates.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">
                {pendingEstimates.length > 0 ? "Previous Estimates" : "All Estimates"}
              </h2>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {otherEstimates.map((estimate) => {
                  const status = statusConfig[estimate.status];
                  const StatusIcon = status.icon;

                  return (
                    <Link key={estimate.id} href={`/client/estimates/${estimate.id}`}>
                      <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-base line-clamp-1">
                                {estimate.title}
                              </CardTitle>
                              <CardDescription className="text-xs mt-1">
                                {estimate.project.title}
                              </CardDescription>
                            </div>
                            <Badge variant={status.variant} className="shrink-0">
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {status.label}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-muted-foreground">Amount</span>
                              <span className="font-semibold">
                                {formatCurrency(Number(estimate.totalAmount))}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-muted-foreground">From</span>
                              <span className="text-xs">
                                {estimate.freelancer.freelancerProfile?.fullName ||
                                  estimate.freelancer.email}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
