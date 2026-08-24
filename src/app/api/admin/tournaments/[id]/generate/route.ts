import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiStaff } from "@/lib/auth/api-guard";
import { ok, handleApiError, ApiError } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { generateSingleElimination, generateRoundRobin } from "@/lib/tournament/bracket";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireApiStaff();
    const { id } = await params;

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: { teams: { orderBy: [{ seed: "asc" }, { createdAt: "asc" }] } },
    });
    if (!tournament) throw new ApiError("Tournament not found", 404);
    if (tournament.teams.length < 2) {
      throw new ApiError("Add at least 2 teams before generating a bracket.", 400);
    }

    const teamIds = tournament.teams.map((t) => t.id);
    const generated =
      tournament.format === "ROUND_ROBIN"
        ? generateRoundRobin(teamIds)
        : generateSingleElimination(teamIds);

    await prisma.$transaction(async (tx) => {
      await tx.tournamentMatch.deleteMany({ where: { tournamentId: id } });

      for (const g of generated) {
        await tx.tournamentMatch.create({
          data: {
            tournamentId: id,
            round: g.round,
            matchNumber: g.matchNumber,
            bracket: g.bracket,
            teamAId: g.teamAId,
            teamBId: g.teamBId,
            winnerId: g.winnerId,
            status: g.status,
          },
        });
      }

      const created = await tx.tournamentMatch.findMany({
        where: { tournamentId: id },
        select: { id: true, matchNumber: true },
      });
      const byNum = new Map(created.map((m) => [m.matchNumber, m.id]));

      for (const g of generated) {
        if (g.nextMatchNumber) {
          await tx.tournamentMatch.update({
            where: { id: byNum.get(g.matchNumber)! },
            data: { nextMatchId: byNum.get(g.nextMatchNumber) ?? null },
          });
        }
      }

      // Reset team standings and tournament champion
      await tx.tournamentTeam.updateMany({
        where: { tournamentId: id },
        data: { wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0 },
      });
      await tx.tournament.update({
        where: { id },
        data: { status: "ONGOING", championId: null },
      });
    });

    await logAudit({
      userId: admin.id,
      action: "TOURNAMENT_BRACKET_GENERATED",
      entity: "Tournament",
      entityId: id,
      description: `${generated.length} matches (${tournament.format})`,
    });

    return ok({ matches: generated.length });
  } catch (error) {
    return handleApiError(error);
  }
}
