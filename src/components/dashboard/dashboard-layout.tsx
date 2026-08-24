"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Menu } from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { UserNav } from "@/components/dashboard/user-nav";
import { NotificationBell } from "@/components/dashboard/notification-bell";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { adminNav, memberNav } from "@/lib/nav";

type DashUser = { name: string; email: string; role: string; avatarUrl?: string | null };

export function DashboardLayout({
  variant,
  user,
  children,
}: {
  variant: "admin" | "member";
  user: DashUser;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const nav =
    variant === "admin"
      ? adminNav.filter((item) => !item.roles || item.roles.includes(user.role))
      : memberNav;
  const isAdmin = variant === "admin";
  const home = isAdmin ? "/admin" : "/dashboard";

  return (
    <div className="flex min-h-svh">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-sidebar lg:flex print:hidden">
        <div className="flex h-16 items-center border-b px-5">
          <Link href={home} className="transition-opacity hover:opacity-90">
            <Logo />
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <SidebarNav items={nav} />
        </div>
        <div className="border-t p-3">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Back to site
          </Link>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="glass sticky top-0 z-40 flex h-16 items-center gap-3 border-b px-4 sm:px-6 print:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu" />
              }
            >
              <Menu />
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <SheetHeader className="h-16 justify-center border-b">
                <SheetTitle render={<Logo />} />
              </SheetHeader>
              <div className="p-3">
                <SidebarNav items={nav} onNavigate={() => setMobileOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex-1" />
          <NotificationBell />
          <ThemeToggle />
          <UserNav
            name={user.name}
            email={user.email}
            avatarUrl={user.avatarUrl}
            isAdmin={isAdmin}
          />
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
