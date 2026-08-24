import type { Metadata } from "next";
import Link from "next/link";
import { format, startOfDay } from "date-fns";
import { ArrowRight, CalendarDays, Clock, Trophy } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { DIVISION_LABELS } from "@/lib/validations/tournament";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Events" };

export default async function EventsPage() {
  const now = startOfDay(new Date());
  const [openPlays, tournaments] = await Promise.all([
    prisma.openPlay.findMany({
      where: { date: { gte: now }, status: { in: ["OPEN", "FULL"] } },
      orderBy: { date: "asc" },
      take: 4,
    }),
    prisma.tournament.findMany({
      where: { status: { in: ["OPEN", "ONGOING"] } },
      orderBy: { date: "asc" },
      take: 4,
    }),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-14 px-4 py-16 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">What&apos;s on</h1>
        <p className="mt-2 text-muted-foreground">Upcoming open play and tournaments at SVPC.</p>
      </div>

      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <CalendarDays className="size-5 text-primary" /> Open Play
          </h2>
          <Link href="/open-play" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            View all <ArrowRight className="size-4" />
          </Link>
        </div>
        {openPlays.length === 0 ? (
          <EmptyState icon={CalendarDays} title="No sessions scheduled" />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {openPlays.map((s) => (
              <Card key={s.id}>
                <CardContent className="space-y-1.5">
                  <h3 className="font-medium">{s.title}</h3>
                  <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <CalendarDays className="size-3.5" />
                    {format(s.date, "EEE, MMM d")}
                  </p>
                  <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock className="size-3.5" />
                    {format(s.startTime, "h:mm a")}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <Trophy className="size-5 text-primary" /> Tournaments
          </h2>
          <Link href="/tournaments" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            View all <ArrowRight className="size-4" />
          </Link>
        </div>
        {tournaments.length === 0 ? (
          <EmptyState icon={Trophy} title="No tournaments scheduled" />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {tournaments.map((t) => (
              <Card key={t.id}>
                <CardContent className="space-y-1.5">
                  <h3 className="font-medium">{t.name}</h3>
                  <p className="text-sm text-muted-foreground">{DIVISION_LABELS[t.division]}</p>
                  <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <CalendarDays className="size-3.5" />
                    {format(t.date, "MMM d, yyyy")}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
