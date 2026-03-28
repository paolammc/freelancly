import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EstimateBuilder } from "@/components/billing/estimate-builder";
import { PaymentTracker } from "@/components/billing/payment-tracker";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  FileText,
  DollarSign,
  Clock,
  CheckCircle,
  Send,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

export default async function BillingPage() {
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

  if (user.role !== "freelancer") {
    redirect("/client/dashboard");
  }

  // Fetch projects for estimate builder
  const projects = await db.project.findMany({
    where: {
      freelancerId: user.id,
      status: "active",
    },
    select: {
      id: true,
      title: true,
      clientId: true,
      client: {
        select: {
          email: true,
        },
      },
    },
    orderBy: { title: "asc" },
  });

  // Fetch estimates
  const estimates = await db.estimate.findMany({
    where: { freelancerId: user.id },
    include: {
      project: {
        select: {
          id: true,
          title: true,
        },
      },
      client: {
        select: {
          email: true,
        },
      },
      items: {
        orderBy: { order: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Fetch payments
  const payments = await db.payment.findMany({
    where: {
      estimate: {
        freelancerId: user.id,
      },
    },
    include: {
      estimate: {
        select: {
          id: true,
          title: true,
          project: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
      receipt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Calculate summary stats
  const totalEstimated = estimates
    .filter((e) => e.status === "approved")
    .reduce((sum, e) => sum + Number(e.totalAmount), 0);

  const totalPending = payments
    .filter((p) => p.status === "pending" || p.status === "overdue")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const totalReceived = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const pendingEstimates = estimates.filter((e) => e.status === "sent").length;

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "approved":
        return "success";
      case "sent":
        return "default";
      case "rejected":
        return "destructive";
      case "expired":
        return "outline";
      default:
        return "secondary";
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
        <p className="text-muted-foreground">
          Manage estimates, track payments, and generate receipts
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              Pending Estimates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{pendingEstimates}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Total Approved
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalEstimated)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Awaiting Payment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">
              {formatCurrency(totalPending)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              Total Received
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(totalReceived)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="estimates" className="space-y-6">
        <TabsList>
          <TabsTrigger value="estimates">Estimates</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="create">Create Estimate</TabsTrigger>
        </TabsList>

        <TabsContent value="estimates" className="space-y-4">
          {estimates.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No estimates yet</p>
                <p className="text-sm text-muted-foreground">
                  Create your first estimate to start billing clients
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {estimates.map((estimate) => (
                <Card key={estimate.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{estimate.title}</CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          <span>{estimate.project.title}</span>
                          <span>-</span>
                          <span>{estimate.client.email}</span>
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusVariant(estimate.status) as "default" | "secondary" | "success" | "destructive" | "outline"}>
                          {estimate.status}
                        </Badge>
                        <span className="font-bold">
                          {formatCurrency(Number(estimate.totalAmount))}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4 text-muted-foreground">
                        {estimate.sentAt && (
                          <span>Sent: {formatDate(estimate.sentAt)}</span>
                        )}
                        {estimate.validUntil && (
                          <span>
                            Valid until: {formatDate(estimate.validUntil)}
                          </span>
                        )}
                        {estimate.approvedAt && (
                          <span className="text-green-600">
                            Approved: {formatDate(estimate.approvedAt)}
                          </span>
                        )}
                      </div>
                      {estimate.status === "sent" && estimate.approvalToken && (
                        <Link
                          href={`/estimate/${estimate.approvalToken}`}
                          target="_blank"
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Approval Link
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="payments">
          <PaymentTracker
            payments={payments.map((p) => ({
              ...p,
              amount: Number(p.amount),
              paidAt: p.paidAt?.toISOString() || null,
              dueDate: p.dueDate?.toISOString() || null,
              createdAt: p.createdAt.toISOString(),
            }))}
          />
        </TabsContent>

        <TabsContent value="create">
          <EstimateBuilder projects={projects} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
