"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { FilterPanel, FilterState } from "@/components/marketplace/filter-panel";
import { ListingCard, Listing } from "@/components/marketplace/listing-card";
import { ListingDetailDrawer } from "@/components/marketplace/listing-detail-drawer";
import { Briefcase, Search, Loader2 } from "lucide-react";

// ========================================
// CLIENT MARKETPLACE PAGE
// Where freelancers browse open project postings
// ========================================

export default function ClientMarketplacePage() {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [pipelineIds, setPipelineIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    category: "",
    duration: "",
    budgetMin: 0,
    budgetMax: 50000,
    sortBy: "newest",
  });

  // Fetch listings and pipeline data
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        // Build query string
        const params = new URLSearchParams();
        if (filters.search) params.set("search", filters.search);
        if (filters.category && filters.category !== "all") params.set("category", filters.category);
        if (filters.duration && filters.duration !== "all") params.set("duration", filters.duration);
        if (filters.budgetMin > 0) params.set("budgetMin", filters.budgetMin.toString());
        if (filters.budgetMax < 50000) params.set("budgetMax", filters.budgetMax.toString());
        params.set("sortBy", filters.sortBy);

        // Fetch listings
        const listingsRes = await fetch(`/api/listings?${params}`);
        if (listingsRes.ok) {
          const data = await listingsRes.json();
          setListings(data);
        }

        // Fetch pipeline to know which listings are already added
        const pipelineRes = await fetch("/api/pipeline");
        if (pipelineRes.ok) {
          const pipelineData = await pipelineRes.json();
          const ids = new Set<string>(
            pipelineData
              .filter((card: { listingId: string | null }) => card.listingId)
              .map((card: { listingId: string }) => card.listingId)
          );
          setPipelineIds(ids);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [filters]);

  // Add listing to pipeline
  const handleAddToPipeline = async (listingId: string) => {
    try {
      const res = await fetch("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });

      if (res.ok) {
        setPipelineIds((prev) => new Set(prev).add(listingId));
      }
    } catch (error) {
      console.error("Error adding to pipeline:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Client Marketplace
        </h1>
        <p className="text-muted-foreground">
          Browse open project postings and add opportunities to your pipeline
        </p>
      </div>

      {/* Filters */}
      <FilterPanel filters={filters} onFiltersChange={setFilters} />

      {/* Listings Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : listings.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-1">No projects found</h3>
            <p className="text-muted-foreground text-center max-w-sm">
              Try adjusting your filters or check back later for new opportunities.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {listings.length} project{listings.length !== 1 ? "s" : ""} available
          </p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                isInPipeline={pipelineIds.has(listing.id)}
                onAddToPipeline={handleAddToPipeline}
                onViewDetails={setSelectedListing}
              />
            ))}
          </div>
        </>
      )}

      {/* Listing Detail Drawer */}
      <ListingDetailDrawer
        listing={selectedListing}
        isOpen={!!selectedListing}
        onClose={() => setSelectedListing(null)}
        isInPipeline={selectedListing ? pipelineIds.has(selectedListing.id) : false}
        onAddToPipeline={handleAddToPipeline}
      />
    </div>
  );
}
