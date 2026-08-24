import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApiStaff } from "@/lib/auth/api-guard";
import { ok, handleApiError, ApiError } from "@/lib/api";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  status: z.enum(["OPEN", "FULL", "CLOSED", "CANCELLED", "COMPLETED"]),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireApiStaff();
    const { id } = await params;
    const { status } = schema.parse(await req.json());

    const openPlay = await prisma.openPlay.findUnique({ where: { id } });
    if (!openPlay) throw new ApiError("Session not found", 404);

    await prisma.openPlay.update({ where: { id }, data: { status } });
    await logAudit({
      userId: admin.id,
      action: "OPEN_PLAY_STATUS",
      entity: "OpenPlay",
      entityId: id,
      description: `Status → ${status}`,
    });

    return ok({ id });
  } catch (error) {
    return handleApiError(error);
  }
}
