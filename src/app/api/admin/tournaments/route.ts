import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiStaff } from "@/lib/auth/api-guard";
import { tournamentSchema } from "@/lib/validations/tournament";
import { persistImage } from "@/lib/storage";
import { ok, handleApiError } from "@/lib/api";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const admin = await requireApiStaff();
    const input = tournamentSchema.parse(await req.json());

    const bannerUrl = input.bannerDataUrl
      ? await persistImage(input.bannerDataUrl, "svpc/tournaments")
      : undefined;

    const tournament = await prisma.tournament.create({
      data: {
        name: input.name,
        description: input.description,
        division: input.division,
        format: input.format,
        date: new Date(input.date),
        venue: input.venue,
        entryFee: input.entryFee,
        registrationDeadline: input.registrationDeadline
          ? new Date(input.registrationDeadline)
          : null,
        maxTeams: input.maxTeams,
        teamSize: input.teamSize,
        rules: input.rules,
        prizes: input.prizes,
        bannerUrl,
        status: "DRAFT",
        createdById: admin.id,
      },
    });

    await logAudit({
      userId: admin.id,
      action: "TOURNAMENT_CREATED",
      entity: "Tournament",
      entityId: tournament.id,
      description: input.name,
    });

    return ok({ id: tournament.id }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
