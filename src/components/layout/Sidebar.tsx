"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import {
  Brain,
  LayoutDashboard,
  BookOpen,
  FileUp,
  LogOut,
  User,
  Moon,
  Sun,
  ChevronLeft,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "./SidebarProvider";
import { useEffect, useState } from "react";

interface SidebarProps {
  user: { name?: string | null; email?: string | null; image?: string | null };
}

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "My Decks" },
  { href: "/review", icon: BookOpen, label: "Review" },
  { href: "/upload", icon: FileUp, label: "Upload PDF" },
  { href: "/profile", icon: User, label: "Profile" },
];

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { isExpanded, toggle, isMobileMenuOpen, setMobileMenuOpen } = useSidebar();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const SidebarContent = (
    <div className="flex flex-col h-full min-h-0">
      {/* Logo */}
      <div
        className={cn(
          "p-5 sm:p-6 flex items-center justify-between border-b border-border transition-all duration-300 shrink-0",
          !isExpanded && "lg:px-4"
        )}
      >
        <Link
          href="/"
          className="flex items-center gap-3 overflow-hidden min-w-0"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <span
            className={cn(
              "font-bold text-foreground text-xl tracking-tight transition-all duration-300 whitespace-nowrap",
              !isExpanded && "lg:opacity-0 lg:w-0 lg:overflow-hidden"
            )}
          >
            CardMind
          </span>
        </Link>
        <button
          type="button"
          onClick={toggle}
          className={cn(
            "hidden lg:flex p-1.5 rounded-lg hover:bg-accent text-muted-foreground transition-all shrink-0",
            !isExpanded && "rotate-180"
          )}
          aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          <ChevronLeft size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto overflow-x-hidden scrollbar-hide min-h-0">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active =
            pathname === href || (href !== "/" && pathname.startsWith(href));
          const isUpload = href === "/upload";
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                "group flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all relative",
                active
                  ? "sidebar-item-active"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
                isUpload &&
                  !active &&
                  "lg:border lg:border-dashed lg:border-primary/25 lg:bg-primary/[0.03] lg:hover:border-primary/40"
              )}
            >
              <Icon
                className={cn(
                  "shrink-0 transition-colors",
                  active ? "text-primary" : "group-hover:text-foreground"
                )}
                size={20}
              />
              <span
                className={cn(
                  "transition-all duration-300 whitespace-nowrap truncate",
                  !isExpanded && "lg:opacity-0 lg:w-0 lg:overflow-hidden"
                )}
              >
                {label}
              </span>
              {!isExpanded && (
                <div className="absolute left-14 px-2 py-1 bg-foreground text-background text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity hidden lg:block whitespace-nowrap z-50 max-w-[12rem] truncate">
                  {label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Actions */}
      <div className="p-3 border-t border-border space-y-2 shrink-0">
        <button
          type="button"
          onClick={toggleTheme}
          className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-all text-left min-w-0"
        >
          {mounted && theme === "dark" ? (
            <Sun size={20} className="shrink-0" />
          ) : (
            <Moon size={20} className="shrink-0" />
          )}
          <span
            className={cn(
              "transition-all duration-300 whitespace-nowrap truncate",
              !isExpanded && "lg:opacity-0 lg:w-0 lg:overflow-hidden"
            )}
          >
            {mounted && theme === "dark" ? "Light Mode" : "Dark Mode"}
          </span>
        </button>

        <div
          className={cn(
            "flex items-center gap-3 px-3 py-3 rounded-xl bg-accent/50 transition-all overflow-hidden min-w-0",
            !isExpanded && "lg:px-2"
          )}
        >
          <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center shrink-0">
            <User className="w-4 h-4 text-white" />
          </div>
          <div
            className={cn(
              "flex-1 min-w-0 transition-all duration-300",
              !isExpanded && "lg:opacity-0 lg:w-0 lg:overflow-hidden"
            )}
          >
            <p className="text-sm font-semibold text-foreground truncate">
              {user.name || "Learner"}
            </p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all text-left min-w-0"
        >
          <LogOut size={20} className="shrink-0" />
          <span
            className={cn(
              "transition-all duration-300 whitespace-nowrap truncate",
              !isExpanded && "lg:opacity-0 lg:w-0 lg:overflow-hidden"
            )}
          >
            Sign out
          </span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden pointer-events-auto fixed top-0 left-0 right-0 h-14 sm:h-16 bg-background border-b border-border z-40 flex items-center justify-between px-3 sm:px-4 shadow-sm">
        <Link href="/" className="flex items-center gap-2 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl gradient-brand flex items-center justify-center shrink-0">
            <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <span className="font-bold text-foreground text-lg truncate">CardMind</span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
          className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-xl border border-border bg-card text-foreground shadow-sm hover:bg-accent active:scale-[0.98] transition"
          aria-expanded={isMobileMenuOpen}
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {isMobileMenuOpen ? <X size={26} strokeWidth={2} /> : <Menu size={26} strokeWidth={2} />}
        </button>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <button
          type="button"
          className="lg:hidden pointer-events-auto fixed inset-0 top-14 sm:top-16 bg-background/80 backdrop-blur-sm z-40"
          aria-hidden
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 z-50 flex flex-col pointer-events-auto bg-background border-r border-border transition-[transform,width] duration-300 ease-out shadow-sm",
          "lg:top-0 lg:h-full",
          "max-lg:top-14 max-lg:sm:top-16 max-lg:h-[calc(100dvh-3.5rem)] max-lg:sm:h-[calc(100dvh-4rem)]",
          // Mobile: full-width drawer; desktop: collapsed / expanded
          "w-[min(22rem,calc(100vw-1.25rem))] min-w-[260px] max-w-[min(22rem,90vw)] lg:min-w-0 lg:max-w-none",
          isExpanded ? "lg:w-64" : "lg:w-20",
          isMobileMenuOpen ? "max-lg:translate-x-0" : "max-lg:-translate-x-full",
          "lg:translate-x-0"
        )}
      >
        {SidebarContent}
      </aside>
    </>
  );
}
