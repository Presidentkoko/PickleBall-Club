import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, Trophy, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth/guards";
import { cn } from "@/lib/utils";
import { DIVISION_LABELS, FORMAT_LABELS } from "@/lib/validations/tournament";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { AddTeamDialog } from "@/components/admin/add-team-dialog";
import { GenerateBracketButton } from "@/components/admin/generate-bracket-button";
import { MatchScoreDialog } from "@/components/admin/match-score-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = { title: "Tournament" };

function roundName(round: number, maxRound: number) {
  const fromEnd = maxRound - round;
  if (fromEnd === 0) return "Final";
  if (fromEnd === 1) return "Semifinals";
  if (fromEnd === 2) return "Quarterfinals";
  return `Round ${round}`;
}

export default async function AdminTournamentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff();
  const { id } = await params;

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      champion: { select: { name: true } },
      teams: {
        include: { players: true },
        orderBy: [{ wins: "desc" }, { seed: "asc" }, { createdAt: "asc" }],
      },
      matches: {
        orderBy: [{ round: "asc" }, { matchNumber: "asc" }],
        include: {
          teamA: { select: { id: true, name: true } },
          teamB: { select: { id: true, name: true } },
          winner: { select: { id: true, name: true } },
        },
      },
    },
  });
  if (!tournament) notFound();

  const isRoundRobin = tournament.format === "ROUND_ROBIN";
  const hasBracket = tournament.matches.length > 0;
  const maxRound = tournament.matches.reduce((m, x) => Math.max(m, x.round), 0);

  const rounds = Array.from(new Set(tournament.matches.map((m) => m.round))).sort((a, b) => a - b);

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/tournaments"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          All tournaments
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{tournament.name}</h1>
              <StatusBadge status={tournament.status} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {DIVISION_LABELS[tournament.division]} · {FORMAT_LABELS[tournament.format]} ·{" "}
              {format(tournament.date, "MMM d, yyyy")} · {tournament.venue}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {tournament.teams.length >= 2 && (
              <GenerateBracketButton tournamentId={tournament.id} hasBracket={hasBracket} />
            )}
          </div>
        </div>
      </div>

      {/* Champion banner */}
      {tournament.status === "FINISHED" && tournament.champion && (
        <div className="glass-strong bg-radial-fade flex flex-col items-center gap-2 rounded-2xl p-8 text-center animate-in zoom-in-50 duration-700">
          <Trophy className="size-10 text-primary" />
          <p className="text-sm text-muted-foreground">Champion</p>
          <p className="text-3xl font-bold text-gradient">{tournament.champion.name}</p>
        </div>
      )}

      {/* Teams */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Users className="size-5 text-primary" />
            Teams ({tournament.teams.length})
          </h2>
          {!hasBracket && (
            <AddTeamDialog tournamentId={tournament.id} teamSize={tournament.teamSize} />
          )}
        </div>
        {tournament.teams.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No teams yet"
            description="Add at least 2 teams, then generate the bracket."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tournament.teams.map((t, i) => (
              <Card key={t.id}>
                <CardContent className="flex items-center gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                    {t.seed ?? i + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{t.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {t.players.map((p) => p.name).join(", ") || "No players"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Bracket / standings */}
      {hasBracket && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">{isRoundRobin ? "Standings & matches" : "Bracket"}</h2>

          {isRoundRobin ? (
            <div className="space-y-6">
              <div className="overflow-x-auto rounded-xl border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead>W</TableHead>
                      <TableHead>L</TableHead>
                      <TableHead>PF</TableHead>
                      <TableHead>PA</TableHead>
                      <TableHead>Diff</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tournament.teams.map((t, i) => (
                      <TableRow key={t.id}>
                        <TableCell>{i + 1}</TableCell>
                        <TableCell className="font-medium">{t.name}</TableCell>
                        <TableCell>{t.wins}</TableCell>
                        <TableCell>{t.losses}</TableCell>
                        <TableCell>{t.pointsFor}</TableCell>
                        <TableCell>{t.pointsAgainst}</TableCell>
                        <TableCell>{t.pointsFor - t.pointsAgainst}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {tournament.matches.map((m) => {
                  const canRecord = m.teamA && m.teamB && m.status !== "COMPLETED";
                  return (
                    <div key={m.id} className="rounded-xl border bg-card p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className={cn(m.winnerId === m.teamAId && "font-semibold text-primary")}>
                          {m.teamA?.name ?? "TBD"}
                        </span>
                        <span className="tabular-nums">{m.scoreA ?? "–"}</span>
                      </div>
                      <div className="mt-1 flex items-center justify-between">
                        <span className={cn(m.winnerId === m.teamBId && "font-semibold text-primary")}>
                          {m.teamB?.name ?? "TBD"}
                        </span>
                        <span className="tabular-nums">{m.scoreB ?? "–"}</span>
                      </div>
                      {canRecord && (
                        <div className="mt-2 flex justify-end">
                          <MatchScoreDialog
                            tournamentId={tournament.id}
                            matchId={m.id}
                            teamAName={m.teamA?.name ?? "Team A"}
                            teamBName={m.teamB?.name ?? "Team B"}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex gap-6 overflow-x-auto pb-4">
              {rounds.map((round) => (
                <div key={round} className="flex min-w-60 flex-col gap-4">
                  <h3 className="text-sm font-semibold text-muted-foreground">
                    {roundName(round, maxRound)}
                  </h3>
                  {tournament.matches
                    .filter((m) => m.round === round)
                    .map((m) => {
                      const canRecord =
                        m.teamA && m.teamB && m.status !== "COMPLETED" && m.status !== "BYE";
                      return (
                        <div key={m.id} className="rounded-xl border bg-card p-3 text-sm shadow-elevated">
                          <div className="flex items-center justify-between">
                            <span className={cn(m.winnerId === m.teamAId && "font-semibold text-primary")}>
                              {m.teamA?.name ?? "TBD"}
                            </span>
                            <span className="tabular-nums">{m.scoreA ?? "–"}</span>
                          </div>
                          <div className="mt-1 flex items-center justify-between border-t pt-1">
                            <span className={cn(m.winnerId === m.teamBId && "font-semibold text-primary")}>
                              {m.teamB?.name ?? (m.status === "BYE" ? "Bye" : "TBD")}
                            </span>
                            <span className="tabular-nums">{m.scoreB ?? "–"}</span>
                          </div>
                          {canRecord && (
                            <div className="mt-2 flex justify-end">
                              <MatchScoreDialog
                                tournamentId={tournament.id}
                                matchId={m.id}
                                teamAName={m.teamA?.name ?? "Team A"}
                                teamBName={m.teamB?.name ?? "Team B"}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
