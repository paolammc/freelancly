"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import {
  DollarSign,
  Clock,
  Calendar,
  Plus,
  Check,
  User,
  Briefcase,
  FileText,
  Target,
  ArrowRight,
} from "lucide-react";
import { Listing } from "./listing-card";

interface ListingDetailDrawerProps {
  listing: Listing | null;
  isOpen: boolean;
  onClose: () => void;
  isInPipeline?: boolean;
  onAddToPipeline?: (listingId: string) => void;
}

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
  short_term: "Less than 1 month",
  medium_term: "1-3 months",
  long_term: "3+ months",
};

export function ListingDetailDrawer({
  listing,
  isOpen,
  onClose,
  isInPipeline,
  onAddToPipeline,
}: ListingDetailDrawerProps) {
  const [isAdding, setIsAdding] = useState(false);

  if (!listing) return null;

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

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader className="text-left">
          <div className="flex items-center gap-2 mb-2">
            <Badge className={categoryColors[listing.category] || categoryColors.other}>
              {listing.category.charAt(0).toUpperCase() + listing.category.slice(1)}
            </Badge>
          </div>
          <SheetTitle className="text-xl">{listing.title}</SheetTitle>
          <SheetDescription className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
              <User className="h-3 w-3" />
            </div>
            <span>{listing.client.email.split("@")[0]}</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">
              Posted {postedDate.toLocaleDateString()}
            </span>
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Key Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <DollarSign className="h-4 w-4" />
                <span className="text-xs">Budget</span>
              </div>
              <p className="font-semibold">{formatBudget()}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Clock className="h-4 w-4" />
                <span className="text-xs">Duration</span>
              </div>
              <p className="font-semibold">
                {durationLabels[listing.duration] || listing.duration}
              </p>
            </div>
          </div>

          {listing.timeline && (
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Calendar className="h-4 w-4" />
                <span className="text-xs">Timeline</span>
              </div>
              <p className="font-semibold">{listing.timeline}</p>
            </div>
          )}

          <Separator />

          {/* Description */}
          <div>
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4" />
              Project Description
            </h3>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {listing.description}
            </p>
          </div>

          {/* Required Skills */}
          {listing.requiredSkills.length > 0 && (
            <div>
              <h3 className="font-semibold flex items-center gap-2 mb-3">
                <Target className="h-4 w-4" />
                Required Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {listing.requiredSkills.map((skill) => (
                  <Badge key={skill} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Actions */}
          <div className="space-y-3">
            <Button
              size="lg"
              className="w-full gap-2"
              variant={isInPipeline ? "secondary" : "default"}
              onClick={handleAddToPipeline}
              disabled={isInPipeline || isAdding}
            >
              {isInPipeline ? (
                <>
                  <Check className="h-5 w-5" />
                  Already in Pipeline
                </>
              ) : isAdding ? (
                "Adding to Pipeline..."
              ) : (
                <>
                  <Plus className="h-5 w-5" />
                  Add to Pipeline
                </>
              )}
            </Button>

            {isInPipeline && (
              <Button variant="outline" className="w-full gap-2" asChild>
                <a href="/freelancer/pipeline">
                  View in Pipeline
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
