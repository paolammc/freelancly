import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Clock, CheckCircle2, Activity, ArrowRight } from "lucide-react";
import { formatDuration } from "@/lib/utils";
import Link from "next/link";

interface TimeEntry {
  durationSeconds: number;
  createdAt: Date;
}

interface RecentActivityProps {
  recentTimeEntries: TimeEntry[];
  completedTasks: number;
  totalTasks: number;
}

export function RecentActivity({
  recentTimeEntries,
  completedTasks,
  totalTasks,
}: RecentActivityProps) {
  const hasActivity = recentTimeEntries.length > 0 || completedTasks > 0;

  // Calculate time tracked today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const timeTrackedToday = recentTimeEntries
    .filter((entry) => new Date(entry.createdAt) >= today)
    .reduce((acc, entry) => acc + entry.durationSeconds, 0);

  // Calculate time tracked this week
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const timeTrackedThisWeek = recentTimeEntries
    .filter((entry) => new Date(entry.createdAt) >= weekStart)
    .reduce((acc, entry) => acc + entry.durationSeconds, 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </div>
          <Link
            href="/freelancer/time"
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <CardDescription className="text-xs">
          Your latest updates and time tracking
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0">
        {!hasActivity ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Bell className="h-8 w-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">No recent activity</p>
            <p className="text-xs text-muted-foreground">
              Start tracking time or completing tasks to see updates here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Time Summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-3 w-3 text-amber-500" />
                  <span className="text-xs text-muted-foreground">Today</span>
                </div>
                <p className="text-lg font-semibold">
                  {timeTrackedToday > 0 ? formatDuration(timeTrackedToday) : "—"}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-3 w-3 text-blue-500" />
                  <span className="text-xs text-muted-foreground">This Week</span>
                </div>
                <p className="text-lg font-semibold">
                  {timeTrackedThisWeek > 0 ? formatDuration(timeTrackedThisWeek) : "—"}
                </p>
              </div>
            </div>

            {/* Task Completion Status */}
            {totalTasks > 0 && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm">Task Completion</span>
                </div>
                <div className="text-sm font-medium">
                  {completedTasks}/{totalTasks}{" "}
                  <span className="text-muted-foreground font-normal">
                    ({totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%)
                  </span>
                </div>
              </div>
            )}

            {/* Recent Time Entries Preview */}
            {recentTimeEntries.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Recent Sessions</p>
                <div className="space-y-1.5">
                  {recentTimeEntries.slice(0, 3).map((entry, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between text-xs p-2 rounded bg-muted/30"
                    >
                      <span className="text-muted-foreground">
                        {new Date(entry.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <span className="font-medium">{formatDuration(entry.durationSeconds)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
