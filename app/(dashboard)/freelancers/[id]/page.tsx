import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatCurrency } from "@/lib/utils";
import { ExternalLink, Mail, ArrowLeft } from "lucide-react";

export default async function FreelancerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    redirect("/sign-in");
  }

  const currentUser = await db.user.findUnique({
    where: { clerkUserId },
  });

  if (!currentUser) {
    redirect("/onboarding");
  }

  const { id } = await params;

  const freelancer = await db.user.findUnique({
    where: { id },
    include: {
      freelancerProfile: true,
    },
  });

  if (!freelancer || !freelancer.freelancerProfile) {
    notFound();
  }

  const profile = freelancer.freelancerProfile;
  const isClient = currentUser.role === "client";

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Link
        href="/marketplace"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Marketplace
      </Link>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profile.avatarUrl || undefined} />
              <AvatarFallback className="text-2xl">
                {profile.fullName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-2xl">{profile.fullName}</CardTitle>
              <CardDescription className="text-lg">{profile.title}</CardDescription>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {freelancer.email}
                </span>
                {profile.portfolioUrl && (
                  <a
                    href={profile.portfolioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Portfolio
                  </a>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                {formatCurrency(Number(profile.hourlyRate))}
                <span className="text-sm font-normal text-muted-foreground">/hr</span>
              </div>
              {isClient && (
                <Link href={`/projects/new?freelancerId=${freelancer.id}`}>
                  <Button className="mt-4">Start a Project</Button>
                </Link>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">About</h3>
            <p className="text-muted-foreground whitespace-pre-wrap">{profile.bio}</p>
          </div>

          {profile.skills.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <Badge key={skill} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
