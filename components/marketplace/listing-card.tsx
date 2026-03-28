"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import {
  DollarSign,
  Clock,
  Calendar,
  Plus,
  Check,
  User,
  Briefcase,
} from "lucide-react";

// ========================================
// LISTING TYPE
// ========================================
export interface Listing {
  id: string;
  title: string;
  description: string;
  category: string;
  budgetMin: number | null;
  budgetMax: number | null;
  duration: string;
  requiredSkills: string[];
  timeline: string | null;
  status: string;
  createdAt: string;
  client: {
    id: string;
    email: string;
  };
}

interface ListingCardProps {
  listing: Listing;
  isInPipeline?: boolean;
  onAddToPipeline?: (listingId: string) => void;
  onViewDetails?: (listing: Listing) => void;
}

// ========================================
// CATEGORY COLORS
// ========================================
const categoryColors: Record<string, string> = {
  design: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  development: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  writing: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  marketing: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  video: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  data: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  consulting: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  other: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
};

const durationLabels: Record<string, string> = {
  short_term: "< 1 month",
  medium_term: "1-3 months",
  long_term: "3+ months",
};

export function ListingCard({
  listing,
  isInPipeline,
  onAddToPipeline,
  onViewDetails,
}: ListingCardProps) {
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToPipeline = async () => {
    if (!onAddToPipeline) return;
    setIsAdding(true);
    try {
      await onAddToPipeline(listing.id);
    } finally {
      setIsAdding(false);
    }
  };

  const formatBudget = () => {
    if (listing.budgetMin && listing.budgetMax) {
      return `${formatCurrency(listing.budgetMin)} - ${formatCurrency(listing.budgetMax)}`;
    }
    if (listing.budgetMax) {
      return `Up to ${formatCurrency(listing.budgetMax)}`;
    }
    if (listing.budgetMin) {
      return `From ${formatCurrency(listing.budgetMin)}`;
    }
    return "Budget TBD";
  };

  const postedDate = new Date(listing.createdAt);
  const daysAgo = Math.floor(
    (Date.now() - postedDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <Card
      className="group hover:shadow-lg hover:border-primary/50 transition-all duration-200 cursor-pointer h-full flex flex-col"
      onClick={() => onViewDetails?.(listing)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
              <User className="h-3 w-3" />
            </div>
            <span>{listing.client.email.split("@")[0]}</span>
          </div>
          <Badge className={categoryColors[listing.category] || categoryColors.other}>
            {listing.category.charAt(0).toUpperCase() + listing.category.slice(1)}
          </Badge>
        </div>
        <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors mt-2">
          {listing.title}
        </CardTitle>
        <CardDescription className="line-clamp-2 text-sm">
          {listing.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-between gap-4">
        {/* Skills */}
        {listing.requiredSkills.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {listing.requiredSkills.slice(0, 3).map((skill) => (
              <Badge key={skill} variant="outline" className="text-xs">
                {skill}
              </Badge>
            ))}
            {listing.requiredSkills.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{listing.requiredSkills.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Meta Info */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span className="font-medium text-foreground">{formatBudget()}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground text-xs">
              <Clock className="h-3 w-3" />
              <span>{durationLabels[listing.duration] || listing.duration}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>
                {daysAgo === 0
                  ? "Posted today"
                  : daysAgo === 1
                  ? "Posted yesterday"
                  : `Posted ${daysAgo} days ago`}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 border-t">
          <Button
            size="sm"
            className="w-full gap-2"
            variant={isInPipeline ? "secondary" : "default"}
            onClick={(e) => {
              e.stopPropagation();
              handleAddToPipeline();
            }}
            disabled={isInPipeline || isAdding}
          >
            {isInPipeline ? (
              <>
                <Check className="h-4 w-4" />
                In Pipeline
              </>
            ) : isAdding ? (
              "Adding..."
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Add to Pipeline
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
