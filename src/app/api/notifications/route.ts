import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { ok, fail, handleApiError } from "@/lib/api";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("Not authenticated", 401);
    const [items, unread] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.notification.count({ where: { userId: user.id, isRead: false } }),
    ]);
    return ok({ items, unread });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH() {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("Not authenticated", 401);
    await prisma.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return ok({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
