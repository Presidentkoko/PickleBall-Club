import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApiAdmin } from "@/lib/auth/api-guard";
import { ok, handleApiError, ApiError } from "@/lib/api";
import { notifyUser } from "@/lib/notifications";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  action: z.enum(["activate", "deactivate", "suspend", "unsuspend"]),
});

const PAST_TENSE: Record<string, string> = {
  activate: "reactivated",
  deactivate: "deactivated",
  suspend: "suspended",
  unsuspend: "reactivated",
};

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireApiAdmin();
    const { id } = await params;
    const { action } = schema.parse(await req.json());

    const user = await prisma.user.findUnique({
      where: { id },
      include: { memberships: { orderBy: { createdAt: "desc" }, take: 1 }, role: true },
    });
    if (!user) throw new ApiError("Member not found", 404);
    if (user.role.name === "OWNER" || user.role.name === "ADMIN") {
      throw new ApiError("You can't modify an admin account here.", 400);
    }

    if (action === "deactivate") {
      await prisma.user.update({ where: { id }, data: { isActive: false } });
    } else if (action === "activate") {
      await prisma.user.update({ where: { id }, data: { isActive: true } });
    } else if (action === "suspend") {
      const m = user.memberships[0];
      if (!m || m.status !== "ACTIVE") throw new ApiError("No active membership to suspend.", 400);
      await prisma.membership.update({ where: { id: m.id }, data: { status: "SUSPENDED" } });
    } else if (action === "unsuspend") {
      const m = user.memberships[0];
      if (!m || m.status !== "SUSPENDED")
        throw new ApiError("No suspended membership to reactivate.", 400);
      await prisma.membership.update({ where: { id: m.id }, data: { status: "ACTIVE" } });
    }

    await notifyUser(id, {
      type: "SYSTEM",
      title: "Account update",
      message: `Your account was ${PAST_TENSE[action]} by an admin.`,
      link: "/dashboard",
    });
    await logAudit({
      userId: admin.id,
      action: `MEMBER_${action.toUpperCase()}`,
      entity: "User",
      entityId: id,
    });

    return ok({ id });
  } catch (error) {
    return handleApiError(error);
  }
}
