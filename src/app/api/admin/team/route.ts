import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiOwnerOrSuperAdmin } from "@/lib/auth/api-guard";
import { adminAccountSchema } from "@/lib/validations/admin-account";
import { hashPassword } from "@/lib/auth/password";
import { ok, handleApiError, ApiError } from "@/lib/api";
import { logAudit } from "@/lib/audit";

function genTempPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let s = "";
  for (let i = 0; i < 12; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireApiOwnerOrSuperAdmin();
    const input = adminAccountSchema.parse(await req.json());
    const email = input.email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new ApiError("An account with this email already exists.", 409);

    const role = await prisma.role.findUnique({ where: { name: input.role } });
    if (!role) throw new ApiError("That role does not exist.", 400);

    const tempPassword = genTempPassword();
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: await hashPassword(tempPassword),
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        roleId: role.id,
        accountStatus: "ACTIVE",
        emailVerified: true,
      },
    });

    await logAudit({
      userId: admin.id,
      action: "ADMIN_ACCOUNT_CREATED",
      entity: "User",
      entityId: user.id,
      description: `${email} (${input.role})`,
    });

    return ok({ email, tempPassword }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
