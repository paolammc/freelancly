"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Search, X, Filter, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

// ========================================
// CATEGORY OPTIONS
// ========================================
export const CATEGORIES = [
  { value: "design", label: "Design" },
  { value: "development", label: "Development" },
  { value: "writing", label: "Writing" },
  { value: "marketing", label: "Marketing" },
  { value: "video", label: "Video" },
  { value: "data", label: "Data" },
  { value: "consulting", label: "Consulting" },
  { value: "other", label: "Other" },
] as const;

export const DURATIONS = [
  { value: "short_term", label: "Short-term (< 1 month)" },
  { value: "medium_term", label: "Medium-term (1-3 months)" },
  { value: "long_term", label: "Long-term (3+ months)" },
] as const;

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "budget_high", label: "Budget (High to Low)" },
  { value: "budget_low", label: "Budget (Low to High)" },
] as const;

// ========================================
// FILTER STATE TYPE
// ========================================
export interface FilterState {
  search: string;
  category: string;
  duration: string;
  budgetMin: number;
  budgetMax: number;
  sortBy: string;
}

interface FilterPanelProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  maxBudget?: number;
}

export function FilterPanel({
  filters,
  onFiltersChange,
  maxBudget = 50000,
}: FilterPanelProps) {
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const updateFilter = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: "",
      category: "",
      duration: "",
      budgetMin: 0,
      budgetMax: maxBudget,
      sortBy: "newest",
    });
  };

  const hasActiveFilters =
    filters.search ||
    filters.category ||
    filters.duration ||
    filters.budgetMin > 0 ||
    filters.budgetMax < maxBudget;

  return (
    <div className="space-y-4">
      {/* Search Bar - Always Visible */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          className="md:hidden"
          onClick={() => setShowMobileFilters(!showMobileFilters)}
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </div>

      {/* Filter Controls */}
      <div
        className={cn(
          "space-y-4 md:space-y-0 md:flex md:items-center md:gap-4",
          showMobileFilters ? "block" : "hidden md:flex"
        )}
      >
        {/* Category Filter */}
        <Select
          value={filters.category}
          onValueChange={(value) => updateFilter("category", value)}
        >
          <SelectTrigger className="w-full md:w-[160px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Duration Filter */}
        <Select
          value={filters.duration}
          onValueChange={(value) => updateFilter("duration", value)}
        >
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Duration" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any Duration</SelectItem>
            {DURATIONS.map((dur) => (
              <SelectItem key={dur.value} value={dur.value}>
                {dur.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Budget Range */}
        <div className="flex-1 min-w-[200px] space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Budget: ${filters.budgetMin.toLocaleString()}</span>
            <span>${filters.budgetMax.toLocaleString()}</span>
          </div>
          <Slider
            value={[filters.budgetMin, filters.budgetMax]}
            onValueChange={([min, max]) => {
              updateFilter("budgetMin", min);
              updateFilter("budgetMax", max);
            }}
            max={maxBudget}
            step={500}
            className="w-full"
          />
        </div>

        {/* Sort */}
        <Select
          value={filters.sortBy}
          onValueChange={(value) => updateFilter("sortBy", value)}
        >
          <SelectTrigger className="w-full md:w-[160px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="gap-1"
          >
            <X className="h-3 w-3" />
            Clear
          </Button>
        )}
      </div>

      {/* Active Filter Tags */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.category && filters.category !== "all" && (
            <Badge variant="secondary" className="gap-1">
              {CATEGORIES.find((c) => c.value === filters.category)?.label}
              <button onClick={() => updateFilter("category", "")}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.duration && filters.duration !== "all" && (
            <Badge variant="secondary" className="gap-1">
              {DURATIONS.find((d) => d.value === filters.duration)?.label}
              <button onClick={() => updateFilter("duration", "")}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
