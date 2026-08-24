import type { Metadata } from "next";
import { format } from "date-fns";
import { CalendarDays, MapPin, Trophy } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { DIVISION_LABELS, FORMAT_LABELS } from "@/lib/validations/tournament";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Tournaments" };

export default async function PublicTournamentsPage() {
  const tournaments = await prisma.tournament.findMany({
    where: { status: { in: ["OPEN", "ONGOING", "FINISHED"] } },
    orderBy: { date: "desc" },
    include: { champion: { select: { name: true } }, _count: { select: { teams: true } } },
    take: 24,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Tournaments</h1>
      <p className="mt-2 text-muted-foreground">Compete in our in-house tournaments across every division.</p>

      <div className="mt-10">
        {tournaments.length === 0 ? (
          <EmptyState icon={Trophy} title="No tournaments yet" description="Check back soon for upcoming competitions." />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {tournaments.map((t) => (
              <Card key={t.id} className="overflow-hidden">
                {t.bannerUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={t.bannerUrl} alt="" className="aspect-video w-full object-cover" />
                )}
                <CardContent className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-heading font-semibold leading-tight">{t.name}</h3>
                    <StatusBadge status={t.status} />
                  </div>
                  <div className="space-y-1.5 text-sm text-muted-foreground">
                    <p>{DIVISION_LABELS[t.division]} · {FORMAT_LABELS[t.format]}</p>
                    <p className="flex items-center gap-2">
                      <CalendarDays className="size-4" />
                      {format(t.date, "MMM d, yyyy")}
                    </p>
                    <p className="flex items-center gap-2">
                      <MapPin className="size-4" />
                      {t.venue}
                    </p>
                  </div>
                  {t.status === "FINISHED" && t.champion ? (
                    <p className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary">
                      <Trophy className="size-4" /> Champion: {t.champion.name}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">{t._count.teams} teams</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
