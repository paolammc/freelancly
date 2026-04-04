"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, SignUp, SignIn } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle2, Loader2, Mail, ArrowRight } from "lucide-react";
import Link from "next/link";

interface InviteData {
  valid: boolean;
  error?: string;
  code?: string;
  invite?: {
    id: string;
    email: string;
    expiresAt: string;
  };
  project?: {
    id: string;
    title: string;
    description: string;
  };
  freelancer?: {
    name: string;
    title?: string;
    avatarUrl?: string;
  };
}

export default function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimed, setClaimed] = useState(false);

  // Unwrap params
  useEffect(() => {
    params.then((p) => setToken(p.token));
  }, [params]);

  // Validate token
  useEffect(() => {
    if (!token) return;

    async function validateToken() {
      try {
        const res = await fetch(`/api/invites/${token}`);
        const data = await res.json();
        setInviteData(data);
      } catch (error) {
        console.error("Error validating invite:", error);
        setInviteData({
          valid: false,
          error: "Failed to validate invitation",
          code: "ERROR",
        });
      } finally {
        setIsLoading(false);
      }
    }

    validateToken();
  }, [token]);

  // Claim invite when user signs in
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !token || !inviteData?.valid || claimed) {
      return;
    }

    async function claimInvite() {
      setIsClaiming(true);
      setClaimError(null);

      try {
        const res = await fetch(`/api/invites/${token}/claim`, {
          method: "POST",
        });

        const data = await res.json();

        if (!res.ok) {
          setClaimError(data.error || "Failed to claim invitation");
          return;
        }

        setClaimed(true);
        // Redirect to client dashboard after a short delay
        setTimeout(() => {
          router.push("/client/dashboard");
        }, 2000);
      } catch (error) {
        console.error("Error claiming invite:", error);
        setClaimError("Failed to claim invitation");
      } finally {
        setIsClaiming(false);
      }
    }

    claimInvite();
  }, [isLoaded, isSignedIn, token, inviteData?.valid, claimed, router]);

  // Loading state
  if (isLoading || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Validating invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Invalid/expired token
  if (!inviteData?.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Invalid Invitation</h2>
            <p className="text-muted-foreground text-center mb-6">
              {inviteData?.error || "This invitation link is invalid or has expired."}
            </p>
            <div className="text-sm text-muted-foreground text-center">
              <p>Please contact your freelancer to request a new invitation.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Claiming state (after sign in)
  if (isSignedIn && !claimed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            {claimError ? (
              <>
                <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                  <AlertCircle className="h-8 w-8 text-destructive" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Unable to Join</h2>
                <p className="text-muted-foreground text-center mb-6">{claimError}</p>
                <Button variant="outline" asChild>
                  <Link href="/">Go to Home</Link>
                </Button>
              </>
            ) : (
              <>
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Linking you to the project...</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Successfully claimed
  if (claimed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Welcome Aboard!</h2>
            <p className="text-muted-foreground text-center mb-6">
              You&apos;ve been successfully added to the project.
            </p>
            <p className="text-sm text-muted-foreground">Redirecting to your dashboard...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show invitation details and sign up/sign in
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-12 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Invitation Header */}
        <Card>
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={inviteData.freelancer?.avatarUrl || undefined} />
                <AvatarFallback className="text-lg">
                  {inviteData.freelancer?.name?.charAt(0)?.toUpperCase() || "F"}
                </AvatarFallback>
              </Avatar>
            </div>
            <CardTitle className="text-2xl">You&apos;ve Been Invited!</CardTitle>
            <CardDescription className="text-base">
              <span className="font-medium text-foreground">
                {inviteData.freelancer?.name}
              </span>
              {inviteData.freelancer?.title && (
                <span className="text-muted-foreground">
                  {" "}({inviteData.freelancer.title})
                </span>
              )}
              {" "}has invited you to collaborate on a project.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <h3 className="font-semibold mb-1">{inviteData.project?.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-3">
                {inviteData.project?.description}
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>Invitation sent to: {inviteData.invite?.email}</span>
            </div>
          </CardContent>
        </Card>

        {/* Sign Up / Sign In */}
        <Card>
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>
              Create an account or sign in to view your project
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signup" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
                <TabsTrigger value="signin">Sign In</TabsTrigger>
              </TabsList>
              <TabsContent value="signup">
                <div className="flex justify-center">
                  <SignUp
                    routing="hash"
                    signInUrl="#signin"
                    fallbackRedirectUrl={`/invite/${token}`}
                    appearance={{
                      elements: {
                        rootBox: "w-full",
                        card: "shadow-none border-0 p-0",
                        headerTitle: "hidden",
                        headerSubtitle: "hidden",
                        socialButtonsBlockButton: "border",
                        formFieldInput: "border",
                        footerAction: "hidden",
                      },
                    }}
                  />
                </div>
              </TabsContent>
              <TabsContent value="signin">
                <div className="flex justify-center">
                  <SignIn
                    routing="hash"
                    signUpUrl="#signup"
                    fallbackRedirectUrl={`/invite/${token}`}
                    appearance={{
                      elements: {
                        rootBox: "w-full",
                        card: "shadow-none border-0 p-0",
                        headerTitle: "hidden",
                        headerSubtitle: "hidden",
                        socialButtonsBlockButton: "border",
                        formFieldInput: "border",
                        footerAction: "hidden",
                      },
                    }}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
