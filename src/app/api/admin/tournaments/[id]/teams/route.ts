import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiStaff } from "@/lib/auth/api-guard";
import { teamSchema } from "@/lib/validations/tournament";
import { ok, handleApiError, ApiError } from "@/lib/api";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireApiStaff();
    const { id } = await params;
    const input = teamSchema.parse(await req.json());

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: { _count: { select: { teams: true } } },
    });
    if (!tournament) throw new ApiError("Tournament not found", 404);
    if (tournament.maxTeams && tournament._count.teams >= tournament.maxTeams) {
      throw new ApiError("This tournament is full.", 400);
    }

    const team = await prisma.tournamentTeam.create({
      data: {
        tournamentId: id,
        name: input.name,
        seed: input.seed,
        status: "CONFIRMED",
        players: {
          create: input.players.map((name) => ({ name })),
        },
      },
    });

    await logAudit({
      userId: admin.id,
      action: "TOURNAMENT_TEAM_ADDED",
      entity: "TournamentTeam",
      entityId: team.id,
      description: input.name,
    });

    return ok({ id: team.id }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
