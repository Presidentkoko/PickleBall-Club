import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApiOwnerOrSuperAdmin } from "@/lib/auth/api-guard";
import { hashPassword } from "@/lib/auth/password";
import { ok, handleApiError, ApiError } from "@/lib/api";
import { logAudit } from "@/lib/audit";

function genTempPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let s = "";
  for (let i = 0; i < 12; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

const schema = z.object({
  action: z.enum(["set_role", "disable", "enable", "reset_password"]),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "STAFF"]).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireApiOwnerOrSuperAdmin();
    const { id } = await params;
    const { action, role } = schema.parse(await req.json());

    const target = await prisma.user.findUnique({ where: { id }, include: { role: true } });
    if (!target) throw new ApiError("Account not found", 404);
    if (target.role.name === "OWNER") {
      throw new ApiError("The Club Owner account can't be modified here.", 400);
    }

    if (action === "set_role") {
      if (!role) throw new ApiError("A role is required.", 400);
      const roleRecord = await prisma.role.findUnique({ where: { name: role } });
      if (!roleRecord) throw new ApiError("That role does not exist.", 400);
      await prisma.user.update({ where: { id }, data: { roleId: roleRecord.id } });
    } else if (action === "disable") {
      if (target.id === admin.id) throw new ApiError("You can't disable your own account.", 400);
      await prisma.user.update({ where: { id }, data: { isActive: false } });
    } else if (action === "enable") {
      await prisma.user.update({ where: { id }, data: { isActive: true } });
    } else {
      const tempPassword = genTempPassword();
      await prisma.user.update({ where: { id }, data: { passwordHash: await hashPassword(tempPassword) } });
      await logAudit({ userId: admin.id, action: "ADMIN_PASSWORD_RESET", entity: "User", entityId: id });
      return ok({ tempPassword });
    }

    await logAudit({
      userId: admin.id,
      action: `ADMIN_ACCOUNT_${action.toUpperCase()}`,
      entity: "User",
      entityId: id,
    });
    return ok({ id });
  } catch (error) {
    return handleApiError(error);
  }
}
