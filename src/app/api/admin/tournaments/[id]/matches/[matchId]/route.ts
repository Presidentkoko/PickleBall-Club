import { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireApiStaff } from "@/lib/auth/api-guard";
import { scoreSchema } from "@/lib/validations/tournament";
import { ok, handleApiError, ApiError } from "@/lib/api";
import { logAudit } from "@/lib/audit";

async function bumpPlayers(tx: Prisma.TransactionClient, teamId: string, won: boolean) {
  const players = await tx.tournamentPlayer.findMany({
    where: { teamId, NOT: { userId: null } },
    select: { userId: true },
  });
  for (const p of players) {
    if (!p.userId) continue;
    await tx.playerStats.upsert({
      where: { userId: p.userId },
      create: {
        userId: p.userId,
        matchesPlayed: 1,
        wins: won ? 1 : 0,
        losses: won ? 0 : 1,
        points: won ? 3 : 0,
      },
      update: {
        matchesPlayed: { increment: 1 },
        wins: { increment: won ? 1 : 0 },
        losses: { increment: won ? 0 : 1 },
        points: { increment: won ? 3 : 0 },
      },
    });
  }
}

async function bumpChampion(tx: Prisma.TransactionClient, teamId: string) {
  const players = await tx.tournamentPlayer.findMany({
    where: { teamId, NOT: { userId: null } },
    select: { userId: true },
  });
  for (const p of players) {
    if (!p.userId) continue;
    await tx.playerStats.upsert({
      where: { userId: p.userId },
      create: { userId: p.userId, tournamentsWon: 1 },
      update: { tournamentsWon: { increment: 1 } },
    });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; matchId: string }> },
) {
  try {
    const admin = await requireApiStaff();
    const { id, matchId } = await params;
    const { scoreA, scoreB } = scoreSchema.parse(await req.json());

    if (scoreA === scoreB) throw new ApiError("Scores can't be tied — there must be a winner.", 400);

    const match = await prisma.tournamentMatch.findUnique({ where: { id: matchId } });
    if (!match || match.tournamentId !== id) throw new ApiError("Match not found", 404);
    if (!match.teamAId || !match.teamBId) throw new ApiError("Both teams must be set first.", 400);
    if (match.status === "COMPLETED") throw new ApiError("This match is already recorded.", 400);

    const winnerId = scoreA > scoreB ? match.teamAId : match.teamBId;
    const loserId = scoreA > scoreB ? match.teamBId : match.teamAId;
    const winScore = Math.max(scoreA, scoreB);
    const loseScore = Math.min(scoreA, scoreB);

    await prisma.$transaction(async (tx) => {
      await tx.tournamentMatch.update({
        where: { id: matchId },
        data: { scoreA, scoreB, winnerId, loserId, status: "COMPLETED" },
      });

      await tx.tournamentTeam.update({
        where: { id: winnerId },
        data: {
          wins: { increment: 1 },
          pointsFor: { increment: winScore },
          pointsAgainst: { increment: loseScore },
        },
      });
      await tx.tournamentTeam.update({
        where: { id: loserId },
        data: {
          losses: { increment: 1 },
          pointsFor: { increment: loseScore },
          pointsAgainst: { increment: winScore },
        },
      });

      await bumpPlayers(tx, winnerId, true);
      await bumpPlayers(tx, loserId, false);

      if (match.bracket === "ROUND_ROBIN") {
        const remaining = await tx.tournamentMatch.count({
          where: { tournamentId: id, status: { in: ["PENDING", "SCHEDULED", "IN_PROGRESS"] } },
        });
        if (remaining === 0) {
          const champ = await tx.tournamentTeam.findFirst({
            where: { tournamentId: id },
            orderBy: [{ wins: "desc" }, { pointsFor: "desc" }, { pointsAgainst: "asc" }],
          });
          if (champ) {
            await tx.tournament.update({
              where: { id },
              data: { championId: champ.id, status: "FINISHED" },
            });
            await bumpChampion(tx, champ.id);
          }
        }
      } else if (match.nextMatchId) {
        const nm = await tx.tournamentMatch.findUnique({
          where: { id: match.nextMatchId },
          select: { teamAId: true },
        });
        await tx.tournamentMatch.update({
          where: { id: match.nextMatchId },
          data: nm?.teamAId ? { teamBId: winnerId } : { teamAId: winnerId },
        });
      } else {
        // Final match — crown the champion
        await tx.tournament.update({
          where: { id },
          data: { championId: winnerId, status: "FINISHED" },
        });
        await bumpChampion(tx, winnerId);
      }
    });

    await logAudit({
      userId: admin.id,
      action: "TOURNAMENT_SCORE_RECORDED",
      entity: "TournamentMatch",
      entityId: matchId,
      description: `${scoreA}-${scoreB}`,
    });

    return ok({ winnerId });
  } catch (error) {
    return handleApiError(error);
  }
}
