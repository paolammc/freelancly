"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { GitPullRequest, FolderKanban, CheckSquare, Clock, X } from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const freelancerLinks = [
  { href: "/freelancer/pipeline", label: "Pipeline", icon: GitPullRequest },
  { href: "/freelancer/projects", label: "Projects", icon: FolderKanban },
  { href: "/freelancer/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/freelancer/time", label: "Time", icon: Clock },
];

const clientLinks = [
  { href: "/client/dashboard", label: "Dashboard", icon: FolderKanban },
  { href: "/marketplace", label: "Marketplace", icon: GitPullRequest },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const isClient = pathname.startsWith("/client");
  const isFreelancer = pathname.startsWith("/freelancer");

  const links = isClient ? clientLinks : isFreelancer ? freelancerLinks : [];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-14 z-50 h-[calc(100vh-3.5rem)] w-64 border-r bg-background transition-transform duration-300 ease-in-out md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Mobile close button */}
        <div className="flex justify-end p-4 md:hidden">
          <button
            onClick={onClose}
            className="rounded-md p-2 hover:bg-accent"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="space-y-1 px-3 py-4 md:py-6">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <link.icon className="h-5 w-5" />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
