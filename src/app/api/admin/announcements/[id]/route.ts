import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApiAdmin } from "@/lib/auth/api-guard";
import { ok, handleApiError, ApiError } from "@/lib/api";
import { notifyAllMembers } from "@/lib/notifications";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  isPinned: z.boolean().optional(),
  isPublished: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireApiAdmin();
    const { id } = await params;
    const input = schema.parse(await req.json());

    const existing = await prisma.announcement.findUnique({ where: { id } });
    if (!existing) throw new ApiError("Announcement not found", 404);

    const goingLive = input.isPublished === true && !existing.publishedAt;

    const updated = await prisma.announcement.update({
      where: { id },
      data: {
        ...(input.isPinned !== undefined ? { isPinned: input.isPinned } : {}),
        ...(input.isPublished !== undefined ? { isPublished: input.isPublished } : {}),
        ...(goingLive ? { publishedAt: new Date() } : {}),
      },
    });

    if (goingLive) {
      await notifyAllMembers({
        type: "ANNOUNCEMENT",
        title: updated.title,
        message: updated.content.slice(0, 140),
        link: "/dashboard/announcements",
      });
    }

    await logAudit({
      userId: admin.id,
      action: "ANNOUNCEMENT_UPDATED",
      entity: "Announcement",
      entityId: id,
    });

    return ok({ id });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireApiAdmin();
    const { id } = await params;
    await prisma.announcement.delete({ where: { id } });
    await logAudit({ userId: admin.id, action: "ANNOUNCEMENT_DELETED", entity: "Announcement", entityId: id });
    return ok({ id });
  } catch (error) {
    return handleApiError(error);
  }
}
