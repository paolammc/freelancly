"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { GitPullRequest, FolderKanban, CheckSquare, Clock, X, LayoutDashboard, Store, Receipt, Search } from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const freelancerLinks = [
  { href: "/freelancer/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/marketplace/clients", label: "Find Work", icon: Search },
  { href: "/freelancer/pipeline", label: "Pipeline", icon: GitPullRequest },
  { href: "/freelancer/projects", label: "Projects", icon: FolderKanban },
  { href: "/freelancer/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/freelancer/time", label: "Time", icon: Clock },
  { href: "/freelancer/billing", label: "Billing", icon: Receipt },
];

const clientLinks = [
  { href: "/client/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/marketplace", label: "Find Freelancers", icon: Search },
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
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-14 z-50 h-[calc(100vh-3.5rem)] w-64 border-r bg-card/50 backdrop-blur-xl transition-transform duration-300 ease-in-out md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Mobile close button */}
        <div className="flex justify-end p-4 md:hidden">
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-accent transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="space-y-1 px-3 py-4 md:py-6">
          <p className="px-3 mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Menu
          </p>
          {links.map((link) => {
            const isActive = pathname === link.href ||
              (link.href !== "/freelancer/dashboard" && link.href !== "/client/dashboard" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground hover:translate-x-1"
                )}
              >
                <link.icon className={cn("h-5 w-5", isActive && "animate-pulse")} />
                {link.label}
              </Link>
            );
          })}
        </nav>

      </aside>
    </>
  );
}
