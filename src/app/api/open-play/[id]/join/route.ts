import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiActiveMember } from "@/lib/auth/api-guard";
import { ok, handleApiError, ApiError } from "@/lib/api";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireApiActiveMember();
    const { id } = await params;

    const result = await prisma.$transaction(async (tx) => {
      const op = await tx.openPlay.findUnique({ where: { id } });
      if (!op) throw new ApiError("Session not found", 404);
      if (["CLOSED", "CANCELLED", "COMPLETED"].includes(op.status)) {
        throw new ApiError("This session is not open for registration.", 400);
      }

      const existing = await tx.openPlayParticipant.findUnique({
        where: { openPlayId_userId: { openPlayId: id, userId: user.id } },
      });
      if (existing && existing.status !== "CANCELLED") {
        throw new ApiError("You've already joined this session.", 409);
      }

      const activeCount = await tx.openPlayParticipant.count({
        where: { openPlayId: id, status: "REGISTERED" },
      });

      let status: "REGISTERED" | "WAITLISTED";
      let waitlistPosition: number | null = null;
      if (activeCount >= op.maxPlayers) {
        status = "WAITLISTED";
        const wl = await tx.openPlayParticipant.count({
          where: { openPlayId: id, status: "WAITLISTED" },
        });
        waitlistPosition = wl + 1;
      } else {
        status = "REGISTERED";
      }

      if (existing) {
        await tx.openPlayParticipant.update({
          where: { id: existing.id },
          data: { status, waitlistPosition },
        });
      } else {
        await tx.openPlayParticipant.create({
          data: { openPlayId: id, userId: user.id, status, waitlistPosition },
        });
      }

      if (status === "REGISTERED" && activeCount + 1 >= op.maxPlayers && op.status === "OPEN") {
        await tx.openPlay.update({ where: { id }, data: { status: "FULL" } });
      }

      return { status, waitlistPosition };
    });

    return ok(result);
  } catch (error) {
    return handleApiError(error);
  }
}
