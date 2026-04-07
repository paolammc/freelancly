"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { Menu, Zap } from "lucide-react";
import { NotificationBell } from "@/components/notifications/NotificationBell";

interface NavbarProps {
  onMenuClick: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const pathname = usePathname();

  const isClient = pathname.startsWith("/client");
  const isFreelancer = pathname.startsWith("/freelancer");

  const dashboardUrl = isClient ? "/client/dashboard" : "/freelancer/dashboard";
  const profileUrl = isFreelancer ? "/freelancer/profile" : undefined;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="rounded-lg p-2 hover:bg-accent transition-colors md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link href={dashboardUrl} className="flex items-center gap-2 group">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-md shadow-primary/25 group-hover:shadow-lg group-hover:shadow-primary/30 transition-shadow">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Freelancly
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell />
          <UserButton
            appearance={{
              elements: {
                avatarBox: "h-9 w-9 ring-2 ring-primary/20 hover:ring-primary/40 transition-all"
              }
            }}
          >
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
