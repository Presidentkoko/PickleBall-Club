import type { Metadata } from "next";
import Link from "next/link";
import { format, startOfDay } from "date-fns";
import { CalendarDays, Clock, Megaphone, Pin, Sparkles, XCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/guards";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Dashboard" };

const MEMBERSHIP_STATUS: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: "Active", className: "bg-primary/10 text-primary" },
  PENDING: { label: "Pending verification", className: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  REJECTED: { label: "Rejected", className: "bg-destructive/10 text-destructive" },
  EXPIRED: { label: "Expired", className: "bg-muted text-muted-foreground" },
  SUSPENDED: { label: "Suspended", className: "bg-destructive/10 text-destructive" },
  DEACTIVATED: { label: "Deactivated", className: "bg-muted text-muted-foreground" },
};

export default async function MemberDashboardPage() {
  const user = await requireUser();

  // Pending / rejected members see a status screen instead of member features.
  if (user.accountStatus !== "ACTIVE") {
    const membership = await prisma.membership.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    const rejected = user.accountStatus === "REJECTED";

    return (
      <div className="mx-auto max-w-2xl space-y-6 py-6">
        <div className="glass-strong bg-radial-fade rounded-2xl p-8 text-center">
          <div
            className={cn(
              "mx-auto flex size-14 items-center justify-center rounded-2xl",
              rejected
                ? "bg-destructive/10 text-destructive"
                : "bg-amber-500/15 text-amber-600 dark:text-amber-400",
            )}
          >
            {rejected ? <XCircle className="size-7" /> : <Clock className="size-7" />}
          </div>
          <h1 className="mt-4 text-2xl font-bold">
            {rejected ? "Application not approved" : "Application under review"}
          </h1>
          <p className="mx-auto mt-2 max-w-md text-muted-foreground">
            {rejected
              ? membership?.rejectionReason
                ? `Reason: ${membership.rejectionReason}`
                : "Please contact the club for more details."
              : "Thanks for applying! An admin is reviewing your application and payment. You'll be notified once it's approved — then you'll unlock open play, bookings, tournaments, and more."}
          </p>
          {rejected && (
            <Link href="/dashboard/membership" className={cn(buttonVariants(), "mt-5")}>
              Re-apply
            </Link>
          )}
        </div>

        <div className="rounded-xl border p-5 text-sm">
          <p className="font-medium">Submitted details</p>
          <p className="mt-1 text-muted-foreground">
            {user.firstName} {user.lastName} · {user.email}
          </p>
        </div>
      </div>
    );
  }

  const now = new Date();
  const [membership, announcements, openPlays, myOpenPlays, myTournaments] = await Promise.all([
    prisma.membership.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
    prisma.announcement.findMany({
      where: { isPublished: true },
      orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
      take: 4,
    }),
    prisma.openPlay.findMany({
      where: { date: { gte: startOfDay(now) }, status: "OPEN" },
      orderBy: { date: "asc" },
      take: 3,
    }),
    prisma.openPlayParticipant.count({
      where: { userId: user.id, status: { in: ["REGISTERED", "WAITLISTED", "ATTENDED"] } },
    }),
    prisma.tournamentPlayer.count({ where: { userId: user.id } }),
  ]);

  const status = membership ? MEMBERSHIP_STATUS[membership.status] : null;

  return (
    <div className="space-y-8">
      <PageHeader title={`Welcome, ${user.firstName}`} description="Your club at a glance." />

      <div className="glass-strong bg-radial-fade flex flex-col items-start justify-between gap-4 rounded-2xl p-6 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Sparkles className="size-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Membership</p>
            {status ? (
              <div className="mt-1 flex items-center gap-2">
                <span className={cn("rounded-full px-2.5 py-0.5 text-sm font-medium", status.className)}>
                  {status.label}
                </span>
                {membership?.endDate && membership.status === "ACTIVE" && (
                  <span className="text-sm text-muted-foreground">
                    · Renews {format(membership.endDate, "MMM d, yyyy")}
                  </span>
                )}
              </div>
            ) : (
              <p className="mt-1 text-base font-semibold">No membership yet</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Open Play sessions" value={myOpenPlays} icon={CalendarDays} />
        <StatCard label="Tournaments joined" value={myTournaments} icon={Sparkles} />
        <StatCard label="Upcoming sessions" value={openPlays.length} icon={CalendarDays} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="size-4 text-primary" />
              Announcements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {announcements.length === 0 ? (
              <p className="text-sm text-muted-foreground">No announcements yet.</p>
            ) : (
              announcements.map((a) => (
                <div key={a.id} className="rounded-lg border p-3">
                  <div className="flex items-center gap-2">
                    {a.isPinned && <Pin className="size-3.5 text-primary" />}
                    <p className="text-sm font-medium">{a.title}</p>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{a.content}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="size-4 text-primary" />
              Upcoming Open Play
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {openPlays.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sessions scheduled.</p>
            ) : (
              openPlays.map((op) => (
                <Link
                  key={op.id}
                  href="/dashboard/open-play"
                  className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted"
                >
                  <div>
                    <p className="text-sm font-medium">{op.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(op.date, "EEE, MMM d")} · {format(op.startTime, "h:mm a")}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-primary">View</span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
