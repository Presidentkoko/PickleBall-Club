import type { Metadata } from "next";
import { format, startOfDay } from "date-fns";
import { CalendarDays, Clock, MapPin, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireActiveMember } from "@/lib/auth/guards";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { JoinButton } from "@/components/open-play/join-button";

export const metadata: Metadata = { title: "Open Play" };

function peso(amount: unknown) {
  const n = Number(amount ?? 0);
  return n === 0 ? "Free" : `₱${n.toLocaleString("en-PH")}`;
}

export default async function MemberOpenPlayPage() {
  const user = await requireActiveMember();

  const sessions = await prisma.openPlay.findMany({
    where: { date: { gte: startOfDay(new Date()) }, status: { in: ["OPEN", "FULL"] } },
    orderBy: { date: "asc" },
    include: {
      participants: {
        where: { status: { in: ["REGISTERED", "WAITLISTED"] } },
        select: { userId: true, status: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Open Play" description="Join upcoming sessions and reserve your spot." />

      {sessions.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No upcoming sessions"
          description="Check back soon — new sessions are added regularly."
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {sessions.map((s) => {
            const registered = s.participants.filter((p) => p.status === "REGISTERED").length;
            const mine = s.participants.find((p) => p.userId === user.id);
            const spotsLeft = Math.max(0, s.maxPlayers - registered);
            const full = registered >= s.maxPlayers;

            return (
              <Card key={s.id} className="overflow-hidden">
                {s.bannerUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.bannerUrl} alt="" className="aspect-video w-full object-cover" />
                )}
                <CardContent className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-heading font-semibold leading-tight">{s.title}</h3>
                    {s.skillLevel && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium capitalize text-muted-foreground">
                        {s.skillLevel.toLowerCase()}
                      </span>
                    )}
                  </div>

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
                    <p className="flex items-center gap-2">
                      <Users className="size-4" />
                      {full ? "Full — waitlist open" : `${spotsLeft} spot${spotsLeft === 1 ? "" : "s"} left`}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{peso(s.fee)}</span>
                    {mine && (
                      <span className="text-xs font-medium text-primary">
                        {mine.status === "WAITLISTED" ? "Waitlisted" : "You're in"}
                      </span>
                    )}
                  </div>

                  <JoinButton
                    id={s.id}
                    joined={!!mine}
                    waitlisted={mine?.status === "WAITLISTED"}
                    full={full}
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
