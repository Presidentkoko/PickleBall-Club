import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiStaff } from "@/lib/auth/api-guard";
import { openPlaySchema, combineDateTime } from "@/lib/validations/open-play";
import { persistImage } from "@/lib/storage";
import { ok, handleApiError } from "@/lib/api";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const admin = await requireApiStaff();
    const input = openPlaySchema.parse(await req.json());

    const bannerUrl = input.bannerDataUrl
      ? await persistImage(input.bannerDataUrl, "svpc/open-play")
      : undefined;

    const openPlay = await prisma.openPlay.create({
      data: {
        title: input.title,
        description: input.description,
        date: new Date(input.date),
        startTime: combineDateTime(input.date, input.startTime),
        endTime: combineDateTime(input.date, input.endTime),
        venue: input.venue,
        maxPlayers: input.maxPlayers,
        fee: input.fee,
        skillLevel: input.skillLevel,
        bannerUrl,
        status: "OPEN",
        createdById: admin.id,
      },
    });

    await logAudit({
      userId: admin.id,
      action: "OPEN_PLAY_CREATED",
      entity: "OpenPlay",
      entityId: openPlay.id,
      description: input.title,
    });

    return ok({ id: openPlay.id }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
