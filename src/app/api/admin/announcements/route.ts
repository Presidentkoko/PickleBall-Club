import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAdmin } from "@/lib/auth/api-guard";
import { announcementSchema } from "@/lib/validations/announcement";
import { persistImage } from "@/lib/storage";
import { ok, handleApiError } from "@/lib/api";
import { notifyAllMembers } from "@/lib/notifications";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const admin = await requireApiAdmin();
    const input = announcementSchema.parse(await req.json());

    const imageUrl = input.imageDataUrl
      ? await persistImage(input.imageDataUrl, "svpc/announcements")
      : undefined;
    const published = input.isPublished ?? true;

    const announcement = await prisma.announcement.create({
      data: {
        title: input.title,
        content: input.content,
        type: input.type,
        imageUrl,
        isPinned: input.isPinned ?? false,
        isPublished: published,
        publishedAt: published ? new Date() : null,
        authorId: admin.id,
      },
    });

    if (published) {
      await notifyAllMembers({
        type: "ANNOUNCEMENT",
        title: input.title,
        message: input.content.slice(0, 140),
        link: "/dashboard/announcements",
      });
    }

    await logAudit({
      userId: admin.id,
      action: "ANNOUNCEMENT_CREATED",
      entity: "Announcement",
      entityId: announcement.id,
      description: input.title,
    });

    return ok({ id: announcement.id }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
