import Link from "next/link";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Users,
  Briefcase,
  Clock,
  Sparkles,
  Zap,
  Star,
  CheckCircle2,
  FileText,
  UserCheck,
  ClipboardList,
  Quote,
} from "lucide-react";

export default async function HomePage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/onboarding");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      {/* ========================================
          NAVIGATION
          ======================================== */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-md shadow-primary/25">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Freelancly
            </span>
          </Link>

          {/* Nav Links - Desktop only "How it Works" anchor */}
          <div className="flex items-center gap-2 md:gap-6">
            <Link
              href="#how-it-works"
              className="hidden md:block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              How it Works
            </Link>
            <Link href="/sign-in">
              <Button variant="ghost" size="sm" className="md:size-default">
                Sign In
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm" className="md:size-default">
                Get Started
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-4">
        {/* ========================================
            HERO SECTION
            ======================================== */}
        <section className="py-12 md:py-20">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Hero Content */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-6">
                <Sparkles className="h-4 w-4" />
                AI-Powered Freelancing Platform
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">
                Connect with Top Freelancers
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 mb-8">
                Find skilled professionals, manage projects with AI-powered task generation,
                and track time seamlessly. All in one platform.
              </p>

              {/* CTA Buttons - Primary visually differentiated from secondary */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4">
                <Link href="/sign-up" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto gap-2 shadow-lg shadow-primary/25 font-semibold"
                  >
                    Start Hiring <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/sign-up" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    variant="ghost"
                    className="w-full sm:w-auto text-muted-foreground hover:text-foreground"
                  >
                    Become a Freelancer
                  </Button>
                </Link>
              </div>
            </div>

            {/* Hero Image/Mockup - Desktop only */}
            <div className="hidden lg:block relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-primary/10 border bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
                {/* Dashboard Mockup */}
                <div className="p-6">
                  {/* Mock Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
                        <div className="h-3 w-24 bg-gray-100 dark:bg-gray-800 rounded mt-1" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="h-8 w-20 bg-primary/20 rounded-md" />
                      <div className="h-8 w-8 bg-gray-100 dark:bg-gray-800 rounded-md" />
                    </div>
                  </div>

                  {/* Mock Stats Cards */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="p-4 rounded-xl bg-violet-50 dark:bg-violet-950/30">
                      <div className="text-2xl font-bold text-violet-600">12</div>
                      <div className="text-xs text-muted-foreground">Active Projects</div>
                    </div>
                    <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
                      <div className="text-2xl font-bold text-emerald-600">48</div>
                      <div className="text-xs text-muted-foreground">Tasks Done</div>
                    </div>
                    <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30">
                      <div className="text-2xl font-bold text-amber-600">127h</div>
                      <div className="text-xs text-muted-foreground">Time Tracked</div>
                    </div>
                  </div>

                  {/* Mock Task List */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      <div className="flex-1">
                        <div className="h-3 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
                      </div>
                      <div className="h-6 w-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full" />
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                      <div className="flex-1">
                        <div className="h-3 w-40 bg-gray-200 dark:bg-gray-700 rounded" />
                      </div>
                      <div className="h-6 w-20 bg-blue-100 dark:bg-blue-900/30 rounded-full" />
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                      <div className="flex-1">
                        <div className="h-3 w-36 bg-gray-200 dark:bg-gray-700 rounded" />
                      </div>
                      <div className="h-6 w-24 bg-amber-100 dark:bg-amber-900/30 rounded-full" />
                    </div>
                  </div>
                </div>

                {/* AI Badge Overlay */}
                <div className="absolute top-4 right-4 flex items-center gap-2 bg-white dark:bg-gray-900 shadow-lg rounded-full px-3 py-1.5 text-xs font-medium">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <span>AI-Powered</span>
                </div>
              </div>

              {/* Decorative Elements */}
              <div className="absolute -z-10 top-8 -right-8 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
              <div className="absolute -z-10 -bottom-8 -left-8 w-48 h-48 bg-violet-500/10 rounded-full blur-2xl" />
            </div>
          </div>
        </section>

        {/* ========================================
            SOCIAL PROOF / STATS BAR
            ======================================== */}
        <section className="py-8 md:py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            <StatCard value="10,000+" label="Active Freelancers" />
            <StatCard value="500+" label="Projects Completed" />
            <StatCard value="4.9" label="Average Rating" icon={<Star className="h-4 w-4 fill-amber-400 text-amber-400" />} />
            <StatCard value="98%" label="Client Satisfaction" />
          </div>
        </section>

        {/* ========================================
            HOW IT WORKS SECTION
            ======================================== */}
        <section id="how-it-works" className="py-12 md:py-20 scroll-mt-20">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">How It Works</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Get your project done in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting Line - Desktop only */}
            <div className="hidden md:block absolute top-16 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-primary/20 via-primary to-primary/20" />

            <HowItWorksStep
              step={1}
              icon={FileText}
              title="Post a Project"
              description="Describe your project and let our AI help break it down into clear, actionable tasks."
            />
            <HowItWorksStep
              step={2}
              icon={UserCheck}
              title="Get Matched"
              description="Browse our curated marketplace of skilled freelancers and find the perfect fit for your needs."
            />
            <HowItWorksStep
              step={3}
              icon={ClipboardList}
              title="Hire & Track"
              description="Collaborate seamlessly with built-in project management, time tracking, and billing tools."
            />
          </div>
        </section>

        {/* ========================================
            FEATURES SECTION
            ======================================== */}
        <section className="py-12 md:py-20">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Everything you need</h2>
            <p className="text-muted-foreground">Powerful features to supercharge your workflow</p>
          </div>

          {/* Feature Cards - 2x2 grid on mobile, 4-col on desktop */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <FeatureCard
              icon={Users}
              title="Find Talent"
              description="Access 10,000+ vetted freelancers. Filter by skills, ratings, and availability to find your perfect match in minutes."
              color="violet"
            />
            <FeatureCard
              icon={Sparkles}
              title="AI Task Generation"
              description="Save hours of planning. Our AI analyzes your project and generates detailed task breakdowns automatically."
              color="blue"
            />
            <FeatureCard
              icon={Briefcase}
              title="Project Management"
              description="Kanban boards, roadmaps, and PRDs built-in. No more juggling between multiple tools."
              color="emerald"
            />
            <FeatureCard
              icon={Clock}
              title="Time Tracking"
              description="Transparent billing with automatic time tracking. Know exactly where every hour goes."
              color="amber"
            />
          </div>
        </section>

        {/* ========================================
            TESTIMONIALS SECTION - Desktop focused
            ======================================== */}
        <section className="py-12 md:py-20">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Loved by teams worldwide</h2>
            <p className="text-muted-foreground">See what our customers are saying</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <TestimonialCard
              quote="Freelancly cut our project planning time in half. The AI task generation is a game-changer for our agency."
              author="Sarah Chen"
              role="Product Lead"
              company="TechFlow Agency"
            />
            <TestimonialCard
              quote="Finally, a platform that understands freelancers. The time tracking and billing features are exactly what I needed."
              author="Marcus Johnson"
              role="Full Stack Developer"
              company="Independent"
            />
            <TestimonialCard
              quote="We've hired 15 freelancers through Freelancly. The quality of talent and the smooth workflow keeps us coming back."
              author="Emily Rodriguez"
              role="CTO"
              company="StartupXYZ"
            />
          </div>
        </section>

        {/* ========================================
            CTA BANNER
            ======================================== */}
        <section className="py-12 md:py-20">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/80 p-8 md:p-12 text-center text-primary-foreground">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnY0em0wLTZoLTJ2LTRoMnY0em0tNiA2aC0ydi00aDJ2NHptMC02aC0ydi00aDJ2NHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />

            <div className="relative">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to get started?</h2>
              <p className="text-primary-foreground/80 mb-8 max-w-md mx-auto">
                Join thousands of clients and freelancers already using Freelancly.
              </p>

              {/* Prominent CTA Button */}
              <Link href="/sign-up">
                <Button
                  size="lg"
                  className="bg-white text-primary hover:bg-white/90 shadow-xl shadow-black/20 font-semibold text-base px-8 py-6 h-auto"
                >
                  Create Your Account
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ========================================
          FOOTER
          ======================================== */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Freelancly. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

/* ==========================================
   COMPONENT: Stats Card
   ========================================== */
function StatCard({
  value,
  label,
  icon,
}: {
  value: string;
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="text-center p-4 md:p-6 rounded-xl bg-white/50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800">
      <div className="flex items-center justify-center gap-1 mb-1">
        <span className="text-2xl md:text-3xl font-bold text-foreground">{value}</span>
        {icon}
      </div>
      <p className="text-xs md:text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

/* ==========================================
   COMPONENT: How It Works Step
   ========================================== */
function HowItWorksStep({
  step,
  icon: Icon,
  title,
  description,
}: {
  step: number;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="relative text-center">
      {/* Step Number Badge */}
      <div className="relative inline-flex mb-6">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Icon className="h-8 w-8 text-primary" />
        </div>
        <div className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center shadow-lg">
          {step}
        </div>
      </div>

      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm max-w-xs mx-auto">{description}</p>
    </div>
  );
}

/* ==========================================
   COMPONENT: Feature Card
   ========================================== */
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
    <div
      className={`relative overflow-hidden p-4 md:p-6 rounded-xl border-0 shadow-md bg-gradient-to-br ${colorClasses[color].split(" ")[0]} ${colorClasses[color].split(" ")[1]}`}
    >
      {/* Decorative Circle */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-current opacity-5 rounded-full -mr-10 -mt-10" />

      <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-current/10 flex items-center justify-center mb-3 md:mb-4">
        <Icon className={`h-5 w-5 md:h-6 md:w-6 ${colorClasses[color].split(" ")[2]}`} />
      </div>
      <h3 className="text-base md:text-lg font-semibold mb-1 md:mb-2">{title}</h3>
      <p className="text-muted-foreground text-xs md:text-sm leading-relaxed">{description}</p>
    </div>
  );
}

/* ==========================================
   COMPONENT: Testimonial Card
   ========================================== */
function TestimonialCard({
  quote,
  author,
  role,
  company,
}: {
  quote: string;
  author: string;
  role: string;
  company: string;
}) {
  return (
    <div className="relative p-6 rounded-xl bg-white dark:bg-gray-900 border shadow-sm">
      {/* Quote Icon */}
      <Quote className="h-8 w-8 text-primary/20 mb-4" />

      <p className="text-muted-foreground mb-6 leading-relaxed">&ldquo;{quote}&rdquo;</p>

      <div className="flex items-center gap-3">
        {/* Avatar Placeholder */}
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
          {author.charAt(0)}
        </div>
        <div>
          <p className="font-semibold text-sm">{author}</p>
          <p className="text-xs text-muted-foreground">
            {role}, {company}
          </p>
        </div>
      </div>
    </div>
  );
}
