import type { Metadata } from "next";
import { Medal, Trophy } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/guards";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = { title: "Leaderboard" };

export default async function LeaderboardPage() {
  await requireUser();
  const stats = await prisma.playerStats.findMany({
    where: { matchesPlayed: { gt: 0 } },
    orderBy: [{ wins: "desc" }, { tournamentsWon: "desc" }, { points: "desc" }],
    take: 50,
    include: { user: { select: { firstName: true, lastName: true } } },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Leaderboard" description="Top players by wins, matches, and titles." />

      {stats.length === 0 ? (
        <EmptyState
          icon={Medal}
          title="No rankings yet"
          description="Rankings appear once tournament matches are played."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Player</TableHead>
                <TableHead>Matches</TableHead>
                <TableHead>Wins</TableHead>
                <TableHead>Losses</TableHead>
                <TableHead>Win %</TableHead>
                <TableHead>Titles</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.map((s, i) => {
                const winPct = s.matchesPlayed
                  ? Math.round((s.wins / s.matchesPlayed) * 100)
                  : 0;
                return (
                  <TableRow key={s.id}>
                    <TableCell>
                      <span
                        className={cn(
                          "flex size-7 items-center justify-center rounded-full text-xs font-bold",
                          i === 0
                            ? "bg-primary text-primary-foreground"
                            : i < 3
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground",
                        )}
                      >
                        {i + 1}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">
                      {s.user.firstName} {s.user.lastName}
                    </TableCell>
                    <TableCell>{s.matchesPlayed}</TableCell>
                    <TableCell>{s.wins}</TableCell>
                    <TableCell>{s.losses}</TableCell>
                    <TableCell>{winPct}%</TableCell>
                    <TableCell>
                      {s.tournamentsWon > 0 ? (
                        <span className="flex items-center gap-1 font-medium text-primary">
                          <Trophy className="size-3.5" /> {s.tournamentsWon}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
