import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/auth/api-guard";
import { ok, handleApiError, ApiError } from "@/lib/api";
import { notifyUser } from "@/lib/notifications";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireApiUser();
    const { id } = await params;

    const { promotedUserId } = await prisma.$transaction(async (tx) => {
      const participant = await tx.openPlayParticipant.findUnique({
        where: { openPlayId_userId: { openPlayId: id, userId: user.id } },
      });
      if (!participant || participant.status === "CANCELLED") {
        throw new ApiError("You're not registered for this session.", 400);
      }

      const wasRegistered = participant.status === "REGISTERED";
      await tx.openPlayParticipant.update({
        where: { id: participant.id },
        data: { status: "CANCELLED", waitlistPosition: null },
      });

      let promoted: string | null = null;
      if (wasRegistered) {
        const next = await tx.openPlayParticipant.findFirst({
          where: { openPlayId: id, status: "WAITLISTED" },
          orderBy: { waitlistPosition: "asc" },
        });
        if (next) {
          await tx.openPlayParticipant.update({
            where: { id: next.id },
            data: { status: "REGISTERED", waitlistPosition: null },
          });
          promoted = next.userId;
        } else {
          const op = await tx.openPlay.findUnique({ where: { id } });
          if (op && op.status === "FULL") {
            await tx.openPlay.update({ where: { id }, data: { status: "OPEN" } });
          }
        }
      }
      return { promotedUserId: promoted };
    });

    if (promotedUserId) {
      await notifyUser(promotedUserId, {
        type: "OPEN_PLAY",
        title: "You're in! 🎉",
        message: "A spot opened up — you've been moved from the waitlist into the session.",
        link: "/dashboard/open-play",
      });
    }

    return ok({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
