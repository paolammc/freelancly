import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Briefcase, Clock, Sparkles } from "lucide-react";

export default async function HomePage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/onboarding");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">Freelancly</h1>
          <div className="flex items-center gap-4">
            <Link href="/sign-in">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button>Get Started</Button>
            </Link>
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-4">
        <section className="py-20 text-center">
          <h2 className="text-5xl font-bold tracking-tight mb-6">
            Connect with Top Freelancers
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Find skilled professionals, manage projects with AI-powered task generation,
            and track time seamlessly. All in one platform.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/sign-up">
              <Button size="lg" className="gap-2">
                Start Hiring <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button size="lg" variant="outline">
                Become a Freelancer
              </Button>
            </Link>
          </div>
        </section>

        <section className="py-20">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={Users}
              title="Find Talent"
              description="Browse our marketplace of skilled freelancers across various domains."
            />
            <FeatureCard
              icon={Sparkles}
              title="AI Task Generation"
              description="Let AI break down your project into actionable tasks automatically."
            />
            <FeatureCard
              icon={Briefcase}
              title="Project Management"
              description="Track progress, manage tasks, and collaborate in real-time."
            />
            <FeatureCard
              icon={Clock}
              title="Time Tracking"
              description="Built-in time tracking for transparent billing and productivity."
            />
          </div>
        </section>

        <section className="py-20 text-center">
          <h3 className="text-3xl font-bold mb-4">Ready to get started?</h3>
          <p className="text-muted-foreground mb-8">
            Join thousands of clients and freelancers already using Freelancly.
          </p>
          <Link href="/sign-up">
            <Button size="lg">Create Your Account</Button>
          </Link>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2024 Freelancly. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 rounded-lg border bg-card text-card-foreground">
      <Icon className="h-10 w-10 text-primary mb-4" />
      <h4 className="text-lg font-semibold mb-2">{title}</h4>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
