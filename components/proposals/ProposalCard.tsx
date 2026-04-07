"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProposalStatusBadge } from "./ProposalStatusBadge";
import { formatCurrency } from "@/lib/utils";
import { Calendar, DollarSign, Clock, ArrowRight, ExternalLink } from "lucide-react";
import type { Proposal } from "@/types/proposal";

interface ProposalCardProps {
  proposal: Proposal;
  viewType: "client" | "freelancer";
  onWithdraw?: (id: string) => void;
  onAccept?: (id: string) => void;
  onDecline?: (id: string) => void;
  isLoading?: boolean;
}

export function ProposalCard({
  proposal,
  viewType,
  onWithdraw,
  onAccept,
  onDecline,
  isLoading,
}: ProposalCardProps) {
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
      : null;

  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="h-10 w-10">
              <AvatarImage src={otherPartyAvatar || undefined} />
              <AvatarFallback>
                {otherPartyName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <CardTitle className="text-base line-clamp-1">{proposal.title}</CardTitle>
              <CardDescription className="line-clamp-1">
                {viewType === "client" ? "To: " : "From: "}
                {otherPartyName}
              </CardDescription>
            </div>
          </div>
          <ProposalStatusBadge status={proposal.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {proposal.description}
        </p>

        <div className="flex flex-wrap gap-4 text-sm">
          {budgetDisplay && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span>{budgetDisplay}</span>
            </div>
          )}
          {proposal.timeline && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{proposal.timeline}</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{new Date(proposal.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Decline reason if shown */}
        {proposal.status === "DECLINED" && proposal.declineReason && (
          <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
            <p className="text-sm text-destructive">
              <strong>Reason:</strong> {proposal.declineReason}
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 pt-2">
          {/* Client view actions */}
          {viewType === "client" && (
            <>
              {proposal.status === "PENDING" && onWithdraw && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onWithdraw(proposal.id)}
                  disabled={isLoading}
                >
                  Withdraw
                </Button>
              )}
              {proposal.status === "ACCEPTED" && proposal.projectId && (
                <Link href={`/projects/${proposal.projectId}`}>
                  <Button size="sm" className="gap-1">
                    View Project
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </Link>
              )}
              <Link href={`/proposals/${proposal.id}`}>
                <Button variant="ghost" size="sm" className="gap-1">
                  View Details
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </>
          )}

          {/* Freelancer view actions */}
          {viewType === "freelancer" && (
            <>
              {proposal.status === "PENDING" && (
                <>
                  {onAccept && (
                    <Button
                      size="sm"
                      onClick={() => onAccept(proposal.id)}
                      disabled={isLoading}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      Accept Project
                    </Button>
                  )}
                  {onDecline && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDecline(proposal.id)}
                      disabled={isLoading}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      Decline
                    </Button>
                  )}
                </>
              )}
              {proposal.status === "ACCEPTED" && proposal.projectId && (
                <Link href={`/projects/${proposal.projectId}`}>
                  <Button size="sm" className="gap-1">
                    View Project
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </Link>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
