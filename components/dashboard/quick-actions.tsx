"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Inbox, ListPlus, Timer, Command } from "lucide-react";

interface QuickActionsProps {
  hasProjects: boolean;
}

export function QuickActions({ hasProjects }: QuickActionsProps) {
  // Trigger the quick task modal via keyboard event
  const openQuickTask = () => {
    const event = new KeyboardEvent("keydown", {
      key: "k",
      metaKey: true,
      bubbles: true,
    });
    document.dispatchEvent(event);
  };

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
      {/* Review Proposals */}
      <Link href="/inbox/proposals">
        <Button variant="outline" size="sm" className="gap-2 whitespace-nowrap">
          <Inbox className="h-4 w-4" />
          <span className="hidden sm:inline">Proposals</span>
          <span className="sm:hidden">Inbox</span>
        </Button>
      </Link>

      {/* Add Task - Opens Quick Task Modal */}
      <Button
        variant="outline"
        size="sm"
        className="gap-2 whitespace-nowrap"
        onClick={openQuickTask}
        disabled={!hasProjects}
        title={hasProjects ? "Add a new task (⌘K)" : "Create a project first"}
      >
        <ListPlus className="h-4 w-4" />
        <span className="hidden sm:inline">Add Task</span>
        <span className="sm:hidden">Task</span>
        <kbd className="hidden md:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
          <Command className="h-3 w-3" />K
        </kbd>
      </Button>

      {/* Log Time */}
      <Link href="/freelancer/time">
        <Button variant="outline" size="sm" className="gap-2 whitespace-nowrap">
          <Timer className="h-4 w-4" />
          <span className="hidden sm:inline">Log Time</span>
          <span className="sm:hidden">Time</span>
        </Button>
      </Link>
    </div>
  );
}
