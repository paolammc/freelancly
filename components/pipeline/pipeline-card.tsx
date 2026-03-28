"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { DollarSign, Clock, AlertTriangle, ExternalLink } from "lucide-react";
import Link from "next/link";

// ========================================
// PIPELINE CARD TYPE
// ========================================
export interface PipelineCardData {
  id: string;
  title: string;
  clientName: string;
  budget: number | null;
  stage: string;
  stageEnteredAt: string;
  listingId: string | null;
  listingClosed: boolean;
  notes: string | null;
  nextAction: string | null;
  listing?: {
    id: string;
    status: string;
    category: string;
  } | null;
}

interface PipelineCardProps {
  card: PipelineCardData;
  onClick?: () => void;
  isDragging?: boolean;
}

// ========================================
// DAYS IN STAGE CALCULATION
// ========================================
function getDaysInStage(stageEnteredAt: string): number {
  const entered = new Date(stageEnteredAt);
  const now = new Date();
  return Math.floor((now.getTime() - entered.getTime()) / (1000 * 60 * 60 * 24));
}

export function PipelineCard({ card, onClick, isDragging }: PipelineCardProps) {
  const daysInStage = getDaysInStage(card.stageEnteredAt);
  const isStale = daysInStage > 7; // Mark as stale if in stage for over 7 days

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md hover:border-primary/50 ${
        isDragging ? "opacity-50 shadow-lg rotate-2" : ""
      } ${card.listingClosed ? "opacity-60 border-dashed" : ""}`}
      onClick={onClick}
    >
      <CardContent className="p-3 space-y-2">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-medium text-sm line-clamp-2">{card.title}</h4>
          {card.listingClosed && (
            <Badge variant="outline" className="shrink-0 text-xs text-amber-600 border-amber-300">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Closed
            </Badge>
          )}
        </div>

        {/* Client */}
        <p className="text-xs text-muted-foreground">{card.clientName}</p>

        {/* Budget & Days */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <DollarSign className="h-3 w-3 text-muted-foreground" />
            <span className="font-medium">
              {card.budget ? formatCurrency(card.budget) : "TBD"}
            </span>
          </div>
          <div
            className={`flex items-center gap-1 ${
              isStale ? "text-amber-600" : "text-muted-foreground"
            }`}
          >
            <Clock className="h-3 w-3" />
            <span>
              {daysInStage === 0
                ? "Today"
                : daysInStage === 1
                ? "1 day"
                : `${daysInStage} days`}
            </span>
          </div>
        </div>

        {/* Link to Marketplace */}
        {card.listingId && !card.listingClosed && (
          <Link
            href={`/marketplace/clients?highlight=${card.listingId}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            View in Marketplace
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
