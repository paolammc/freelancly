"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

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
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="rounded-md p-2 hover:bg-accent md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link href={dashboardUrl} className="flex items-center space-x-2">
            <span className="text-xl font-bold text-primary">Freelancly</span>
          </Link>
        </div>

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
