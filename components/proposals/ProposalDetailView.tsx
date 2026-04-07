"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ProposalStatusBadge } from "./ProposalStatusBadge";
import { formatCurrency } from "@/lib/utils";
import { Calendar, DollarSign, Clock, FileText, CheckCircle, XCircle, Send } from "lucide-react";
import type { Proposal } from "@/types/proposal";

interface ProposalDetailViewProps {
  proposal: Proposal;
  viewType: "client" | "freelancer";
}

export function ProposalDetailView({ proposal, viewType }: ProposalDetailViewProps) {
  const otherParty = viewType === "client" ? proposal.freelancer : proposal.client;
  const otherPartyName =
    otherParty?.freelancerProfile?.fullName || otherParty?.email?.split("@")[0] || "Unknown";
  const otherPartyAvatar = otherParty?.freelancerProfile?.avatarUrl;

  const budgetDisplay =
    proposal.budgetMin && proposal.budgetMax
      ? `${formatCurrency(proposal.budgetMin)} - ${formatCurrency(proposal.budgetMax)}`
      : proposal.budgetMin
      ? `From ${formatCurrency(proposal.budgetMin)}`
      : proposal.budgetMax
      ? `Up to ${formatCurrency(proposal.budgetMax)}`
      : "Not specified";

  // Timeline events
  const timelineEvents = [
    {
      date: proposal.createdAt,
      label: "Proposal sent",
      icon: Send,
      description: viewType === "client"
        ? `You sent this proposal to ${otherPartyName}`
        : `${otherPartyName} sent you this proposal`,
    },
  ];

  if (proposal.status === "ACCEPTED") {
    timelineEvents.push({
      date: proposal.updatedAt,
      label: "Proposal accepted",
      icon: CheckCircle,
      description: viewType === "client"
        ? `${otherPartyName} accepted your proposal`
        : "You accepted this proposal",
    });
  }

  if (proposal.status === "DECLINED") {
    timelineEvents.push({
      date: proposal.updatedAt,
      label: "Proposal declined",
      icon: XCircle,
      description: viewType === "client"
        ? `${otherPartyName} declined your proposal`
        : "You declined this proposal",
    });
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-2xl">{proposal.title}</CardTitle>
              <CardDescription>
                {viewType === "client" ? "Proposal to " : "Proposal from "}
                {otherPartyName}
              </CardDescription>
            </div>
            <ProposalStatusBadge status={proposal.status} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={otherPartyAvatar || undefined} />
              <AvatarFallback>
                {otherPartyName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{otherPartyName}</p>
              {viewType === "client" && otherParty?.freelancerProfile?.title && (
                <p className="text-sm text-muted-foreground">
                  {otherParty.freelancerProfile.title}
                </p>
              )}
              <p className="text-sm text-muted-foreground">{otherParty?.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Project Brief
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Description */}
          <div>
            <h4 className="font-medium mb-2">Description</h4>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {proposal.description}
            </p>
          </div>

          <Separator />

          {/* Details Grid */}
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                Budget
              </div>
              <p className="font-medium">{budgetDisplay}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Timeline
              </div>
              <p className="font-medium">{proposal.timeline || "Not specified"}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Date Sent
              </div>
              <p className="font-medium">
                {new Date(proposal.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Scope Notes */}
          {proposal.scopeNotes && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-2">Additional Notes</h4>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {proposal.scopeNotes}
                </p>
              </div>
            </>
          )}

          {/* Decline Reason */}
          {proposal.status === "DECLINED" && proposal.declineReason && (
            <>
              <Separator />
              <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                <h4 className="font-medium mb-2 text-destructive">Decline Reason</h4>
                <p className="text-muted-foreground">{proposal.declineReason}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Timeline Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {timelineEvents.map((event, index) => {
              const Icon = event.icon;
              return (
                <div key={index} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                      <Icon className="h-4 w-4" />
                    </div>
                    {index < timelineEvents.length - 1 && (
                      <div className="w-px h-full bg-border flex-1 mt-2" />
                    )}
                  </div>
                  <div className="pb-4">
                    <p className="font-medium">{event.label}</p>
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(event.date).toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
