"use client";

import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Users } from "lucide-react";

export function Navbar() {
  const { user } = useUser();
  const pathname = usePathname();

  const isClient = pathname.startsWith("/client");
  const isFreelancer = pathname.startsWith("/freelancer");

  const dashboardUrl = isClient ? "/client/dashboard" : "/freelancer/dashboard";
  const profileUrl = isFreelancer ? "/freelancer/profile" : undefined;

  const clientLinks = [
    { href: "/marketplace", label: "Marketplace", icon: Users },
  ];

  const links = isClient ? clientLinks : [];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-6">
        <Link href={dashboardUrl} className="mr-6 flex items-center space-x-2">
          <span className="text-xl font-bold text-primary">Freelancly</span>
        </Link>

        {links.length > 0 && (
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
        )}

        <div className="flex items-center">
          <UserButton afterSignOutUrl="/">
            {profileUrl && (
              <UserButton.MenuItems>
                <UserButton.Link label="Profile" labelIcon={<ProfileIcon />} href={profileUrl} />
              </UserButton.MenuItems>
            )}
          </UserButton>
        </div>
      </div>
    </header>
  );
}

function ProfileIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
