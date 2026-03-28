"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PipelineCard, PipelineCardData } from "./pipeline-card";
import { cn } from "@/lib/utils";

// ========================================
// PIPELINE STAGES
// ========================================
export const PIPELINE_STAGES = [
  { id: "prospecting", label: "Prospecting", color: "bg-slate-500" },
  { id: "contacted", label: "Contacted", color: "bg-blue-500" },
  { id: "proposal_sent", label: "Proposal Sent", color: "bg-violet-500" },
  { id: "negotiating", label: "Negotiating", color: "bg-amber-500" },
  { id: "won", label: "Won", color: "bg-emerald-500" },
  { id: "lost", label: "Lost", color: "bg-red-500" },
] as const;

interface PipelineBoardProps {
  cards: PipelineCardData[];
  onMoveCard: (cardId: string, newStage: string) => void;
  onCardClick: (card: PipelineCardData) => void;
}

export function PipelineBoard({ cards, onMoveCard, onCardClick }: PipelineBoardProps) {
  const [draggedCard, setDraggedCard] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  // Group cards by stage
  const cardsByStage = PIPELINE_STAGES.reduce((acc, stage) => {
    acc[stage.id] = cards.filter((card) => card.stage === stage.id);
    return acc;
  }, {} as Record<string, PipelineCardData[]>);

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, cardId: string) => {
    setDraggedCard(cardId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggedCard(null);
    setDragOverStage(null);
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    setDragOverStage(stageId);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    if (draggedCard) {
      onMoveCard(draggedCard, stageId);
    }
    setDraggedCard(null);
    setDragOverStage(null);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0">
      {PIPELINE_STAGES.map((stage) => {
        const stageCards = cardsByStage[stage.id] || [];
        const isWonOrLost = stage.id === "won" || stage.id === "lost";

        return (
          <div
            key={stage.id}
            className={cn(
              "flex-shrink-0 w-72 md:w-80",
              isWonOrLost && "w-60 md:w-64"
            )}
          >
            <Card
              className={cn(
                "h-full min-h-[400px] transition-colors",
                dragOverStage === stage.id && "border-primary bg-primary/5"
              )}
              onDragOver={(e) => handleDragOver(e, stage.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn("h-2 w-2 rounded-full", stage.color)} />
                    <CardTitle className="text-sm font-medium">
                      {stage.label}
                    </CardTitle>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {stageCards.length}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {stageCards.length === 0 ? (
                  <div className="flex items-center justify-center h-24 text-xs text-muted-foreground border-2 border-dashed rounded-lg">
                    Drop cards here
                  </div>
                ) : (
                  stageCards.map((card) => (
                    <div
                      key={card.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, card.id)}
                      onDragEnd={handleDragEnd}
                    >
                      <PipelineCard
                        card={card}
                        onClick={() => onCardClick(card)}
                        isDragging={draggedCard === card.id}
                      />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}
