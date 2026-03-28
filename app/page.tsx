import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Briefcase, Clock, Sparkles, Zap } from "lucide-react";

export default async function HomePage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/onboarding");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-md shadow-primary/25">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Freelancly
            </span>
          </Link>
          <div className="flex items-center gap-2 md:gap-4">
            <Link href="/sign-in">
              <Button variant="ghost" size="sm" className="md:size-default">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm" className="md:size-default">Get Started</Button>
            </Link>
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-4">
        <section className="py-12 md:py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            AI-Powered Freelancing Platform
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">
            Connect with Top Freelancers
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Find skilled professionals, manage projects with AI-powered task generation,
            and track time seamlessly. All in one platform.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link href="/sign-up" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto gap-2 shadow-lg shadow-primary/25">
                Start Hiring <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/sign-up" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Become a Freelancer
              </Button>
            </Link>
          </div>
        </section>

        <section className="py-12 md:py-20">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold mb-3">Everything you need</h3>
            <p className="text-muted-foreground">Powerful features to supercharge your workflow</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={Users}
              title="Find Talent"
              description="Browse our marketplace of skilled freelancers across various domains."
              color="violet"
            />
            <FeatureCard
              icon={Sparkles}
              title="AI Task Generation"
              description="Let AI break down your project into actionable tasks automatically."
              color="blue"
            />
            <FeatureCard
              icon={Briefcase}
              title="Project Management"
              description="Track progress, manage tasks, and collaborate in real-time."
              color="emerald"
            />
            <FeatureCard
              icon={Clock}
              title="Time Tracking"
              description="Built-in time tracking for transparent billing and productivity."
              color="amber"
            />
          </div>
        </section>

        <section className="py-12 md:py-20">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/80 p-8 md:p-12 text-center text-primary-foreground">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnY0em0wLTZoLTJ2LTRoMnY0em0tNiA2aC0ydi00aDJ2NHptMC02aC0ydi00aDJ2NHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
            <div className="relative">
              <h3 className="text-2xl md:text-3xl font-bold mb-4">Ready to get started?</h3>
              <p className="text-primary-foreground/80 mb-8 max-w-md mx-auto">
                Join thousands of clients and freelancers already using Freelancly.
              </p>
              <Link href="/sign-up">
                <Button size="lg" variant="secondary" className="shadow-lg">
                  Create Your Account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Freelancly. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

const colorClasses = {
  violet: "from-violet-500/10 to-purple-500/5 text-violet-600",
  blue: "from-blue-500/10 to-cyan-500/5 text-blue-600",
  emerald: "from-emerald-500/10 to-green-500/5 text-emerald-600",
  amber: "from-amber-500/10 to-orange-500/5 text-amber-600",
};

function FeatureCard({
  icon: Icon,
  title,
  description,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  color: keyof typeof colorClasses;
}) {
  return (
    <div className={`relative overflow-hidden p-6 rounded-xl border-0 shadow-md bg-gradient-to-br ${colorClasses[color].split(" ")[0]} ${colorClasses[color].split(" ")[1]}`}>
      <div className="absolute top-0 right-0 w-20 h-20 bg-current opacity-5 rounded-full -mr-10 -mt-10" />
      <div className={`h-12 w-12 rounded-xl bg-current/10 flex items-center justify-center mb-4`}>
        <Icon className={`h-6 w-6 ${colorClasses[color].split(" ")[2]}`} />
      </div>
      <h4 className="text-lg font-semibold mb-2">{title}</h4>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}
