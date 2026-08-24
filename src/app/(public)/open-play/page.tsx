import type { Metadata } from "next";
import Link from "next/link";
import { format, startOfDay } from "date-fns";
import { CalendarDays, Clock, MapPin } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Open Play" };

function peso(amount: unknown) {
  const n = Number(amount ?? 0);
  return n === 0 ? "Free" : `₱${n.toLocaleString("en-PH")}`;
}

export default async function PublicOpenPlayPage() {
  const sessions = await prisma.openPlay.findMany({
    where: { date: { gte: startOfDay(new Date()) }, status: { in: ["OPEN", "FULL"] } },
    orderBy: { date: "asc" },
    take: 24,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Open Play</h1>
      <p className="mt-2 text-muted-foreground">
        Drop in for casual games. Log in to reserve your spot.
      </p>

      <div className="mt-10">
        {sessions.length === 0 ? (
          <EmptyState icon={CalendarDays} title="No upcoming sessions" description="Check back soon." />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {sessions.map((s) => (
              <Card key={s.id} className="overflow-hidden">
                {s.bannerUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.bannerUrl} alt="" className="aspect-video w-full object-cover" />
                )}
                <CardContent className="space-y-3">
                  <h3 className="font-heading font-semibold">{s.title}</h3>
                  <div className="space-y-1.5 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <CalendarDays className="size-4" />
                      {format(s.date, "EEE, MMM d")}
                    </p>
                    <p className="flex items-center gap-2">
                      <Clock className="size-4" />
                      {format(s.startTime, "h:mm a")} – {format(s.endTime, "h:mm a")}
                    </p>
                    <p className="flex items-center gap-2">
                      <MapPin className="size-4" />
                      {s.venue}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-sm font-semibold">{peso(s.fee)}</span>
                    <Link
                      href="/login?next=/dashboard/open-play"
                      className={cn(buttonVariants({ size: "sm" }))}
                    >
                      Log in to join
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
