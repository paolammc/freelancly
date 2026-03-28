"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PipelineBoard, PIPELINE_STAGES } from "@/components/pipeline/pipeline-board";
import { PipelineDetailPanel } from "@/components/pipeline/pipeline-detail-panel";
import { PipelineCardData } from "@/components/pipeline/pipeline-card";
import { formatCurrency } from "@/lib/utils";
import {
  GitPullRequest,
  DollarSign,
  TrendingUp,
  Clock,
  Target,
  Plus,
  Loader2,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

// ========================================
// PIPELINE PAGE
// Kanban board for tracking opportunities
// ========================================

export default function PipelinePage() {
  const [cards, setCards] = useState<PipelineCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState<PipelineCardData | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Fetch pipeline cards
  useEffect(() => {
    async function fetchPipeline() {
      setIsLoading(true);
      try {
        const res = await fetch("/api/pipeline");
        if (res.ok) {
          const data = await res.json();
          setCards(data);
        }
      } catch (error) {
        console.error("Error fetching pipeline:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPipeline();
  }, []);

  // Move card to new stage
  const handleMoveCard = async (cardId: string, newStage: string) => {
    // Optimistic update
    setCards((prev) =>
      prev.map((card) =>
        card.id === cardId
          ? { ...card, stage: newStage, stageEnteredAt: new Date().toISOString() }
          : card
      )
    );

    try {
      await fetch(`/api/pipeline/${cardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage }),
      });
    } catch (error) {
      console.error("Error moving card:", error);
      // Revert on error - refetch
      const res = await fetch("/api/pipeline");
      if (res.ok) {
        const data = await res.json();
        setCards(data);
      }
    }
  };

  // Open card details
  const handleCardClick = (card: PipelineCardData) => {
    setSelectedCard(card);
    setIsDetailOpen(true);
  };

  // Update card
  const handleUpdateCard = async (cardId: string, updates: Partial<PipelineCardData>) => {
    try {
      const res = await fetch(`/api/pipeline/${cardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        const updatedCard = await res.json();
        setCards((prev) =>
          prev.map((card) => (card.id === cardId ? updatedCard : card))
        );
        setSelectedCard(updatedCard);
      }
    } catch (error) {
      console.error("Error updating card:", error);
    }
  };

  // Delete card
  const handleDeleteCard = async (cardId: string) => {
    try {
      const res = await fetch(`/api/pipeline/${cardId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setCards((prev) => prev.filter((card) => card.id !== cardId));
      }
    } catch (error) {
      console.error("Error deleting card:", error);
    }
  };

  // Calculate stats
  const activeCards = cards.filter(
    (card) => card.stage !== "won" && card.stage !== "lost"
  );
  const wonCards = cards.filter((card) => card.stage === "won");
  const totalPipelineValue = activeCards.reduce(
    (sum, card) => sum + (card.budget || 0),
    0
  );
  const wonValue = wonCards.reduce((sum, card) => sum + (card.budget || 0), 0);

  // Calculate average days in pipeline for active cards
  const avgDaysInPipeline =
    activeCards.length > 0
      ? Math.round(
          activeCards.reduce((sum, card) => {
            const days = Math.floor(
              (Date.now() - new Date(card.stageEnteredAt).getTime()) /
                (1000 * 60 * 60 * 24)
            );
            return sum + days;
          }, 0) / activeCards.length
        )
      : 0;

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Pipeline</h1>
          <p className="text-muted-foreground">
            Track and manage your client opportunities
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Pipeline</h1>
          <p className="text-muted-foreground">
            Track and manage your client opportunities
          </p>
        </div>
        <Button asChild>
          <Link href="/marketplace/clients" className="gap-2">
            <Plus className="h-4 w-4" />
            Find Opportunities
          </Link>
        </Button>
      </div>

      {/* Summary Stats */}
      {cards.length > 0 && (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Active</p>
                  <p className="text-xl font-bold">{activeCards.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
                  <DollarSign className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pipeline Value</p>
                  <p className="text-xl font-bold">{formatCurrency(totalPipelineValue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                  <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Won</p>
                  <p className="text-xl font-bold">{formatCurrency(wonValue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Avg. Days</p>
                  <p className="text-xl font-bold">{avgDaysInPipeline}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pipeline Board or Empty State */}
      {cards.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <GitPullRequest className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-1">No opportunities yet</h3>
            <p className="text-muted-foreground text-center max-w-sm mb-6">
              Browse the marketplace to find client projects and add them to your pipeline.
            </p>
            <Button asChild>
              <Link href="/marketplace/clients" className="gap-2">
                Browse Marketplace
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <PipelineBoard
          cards={cards}
          onMoveCard={handleMoveCard}
          onCardClick={handleCardClick}
        />
      )}

      {/* Detail Panel */}
      <PipelineDetailPanel
        card={selectedCard}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedCard(null);
        }}
        onUpdate={handleUpdateCard}
        onDelete={handleDeleteCard}
      />
    </div>
  );
}
