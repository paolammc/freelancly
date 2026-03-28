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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import {
  DollarSign,
  Clock,
  Calendar,
  User,
  ExternalLink,
  Trash2,
  Save,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { PipelineCardData } from "./pipeline-card";
import { PIPELINE_STAGES } from "./pipeline-board";

interface PipelineDetailPanelProps {
  card: PipelineCardData | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (cardId: string, updates: Partial<PipelineCardData>) => void;
  onDelete: (cardId: string) => void;
}

export function PipelineDetailPanel({
  card,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
}: PipelineDetailPanelProps) {
  const [notes, setNotes] = useState(card?.notes || "");
  const [nextAction, setNextAction] = useState(card?.nextAction || "");
  const [isSaving, setIsSaving] = useState(false);

  if (!card) return null;

  // Calculate days in stage
  const daysInStage = Math.floor(
    (Date.now() - new Date(card.stageEnteredAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate(card.id, { notes, nextAction });
    } finally {
      setIsSaving(false);
    }
  };

  const handleStageChange = async (newStage: string) => {
    await onUpdate(card.id, { stage: newStage });
  };

  const handleDelete = async () => {
    if (confirm("Remove this opportunity from your pipeline?")) {
      await onDelete(card.id);
      onClose();
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader className="text-left">
          {card.listingClosed && (
            <Badge variant="outline" className="w-fit text-amber-600 border-amber-300 mb-2">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Listing Closed
            </Badge>
          )}
          <SheetTitle className="text-xl">{card.title}</SheetTitle>
          <SheetDescription className="flex items-center gap-2">
            <User className="h-4 w-4" />
            {card.clientName}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Quick Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <DollarSign className="h-4 w-4" />
                <span className="text-xs">Budget</span>
              </div>
              <p className="font-semibold">
                {card.budget ? formatCurrency(card.budget) : "TBD"}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Clock className="h-4 w-4" />
                <span className="text-xs">Days in Stage</span>
              </div>
              <p className="font-semibold">{daysInStage}</p>
            </div>
          </div>

          {/* Stage Selector */}
          <div className="space-y-2">
            <Label>Stage</Label>
            <Select value={card.stage} onValueChange={handleStageChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PIPELINE_STAGES.map((stage) => (
                  <SelectItem key={stage.id} value={stage.id}>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${stage.color}`} />
                      {stage.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add notes about this opportunity..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>

          {/* Next Action */}
          <div className="space-y-2">
            <Label htmlFor="nextAction">Next Action</Label>
            <Input
              id="nextAction"
              placeholder="e.g., Follow up on proposal"
              value={nextAction}
              onChange={(e) => setNextAction(e.target.value)}
            />
          </div>

          <Separator />

          {/* Actions */}
          <div className="space-y-3">
            <Button
              className="w-full gap-2"
              onClick={handleSave}
              disabled={isSaving}
            >
              <Save className="h-4 w-4" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>

            {card.listingId && !card.listingClosed && (
              <Button variant="outline" className="w-full gap-2" asChild>
                <Link href={`/marketplace/clients`}>
                  <ExternalLink className="h-4 w-4" />
                  View in Marketplace
                </Link>
              </Button>
            )}

            <Button
              variant="ghost"
              className="w-full gap-2 text-destructive hover:text-destructive"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
              Remove from Pipeline
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
