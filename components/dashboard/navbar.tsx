"use client";

import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, Briefcase, FolderOpen } from "lucide-react";

export function Navbar() {
  const { user } = useUser();
  const pathname = usePathname();

  const isClient = pathname.startsWith("/client");
  const isFreelancer = pathname.startsWith("/freelancer");

  const clientLinks = [
    { href: "/client/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/marketplace", label: "Marketplace", icon: Users },
  ];

  const freelancerLinks = [
    { href: "/freelancer/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/freelancer/profile", label: "Profile", icon: Briefcase },
  ];

  const links = isClient ? clientLinks : isFreelancer ? freelancerLinks : [];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-6">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <span className="text-xl font-bold text-primary">Freelancly</span>
        </Link>

        <nav className="flex items-center space-x-6 text-sm font-medium">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-2 transition-colors hover:text-foreground/80",
                pathname === link.href ? "text-foreground" : "text-foreground/60"
              )}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {user?.emailAddresses[0]?.emailAddress}
          </span>
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </header>
  );
}
