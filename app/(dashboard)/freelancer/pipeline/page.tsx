import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GitPullRequest } from "lucide-react";

export default async function PipelinePage() {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    redirect("/sign-in");
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pipeline</h1>
        <p className="text-muted-foreground">
          Manage your opportunities, estimates, and client inquiries
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-10">
          <GitPullRequest className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No opportunities yet</p>
          <p className="text-sm text-muted-foreground">
            Browse the marketplace to find new clients
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
