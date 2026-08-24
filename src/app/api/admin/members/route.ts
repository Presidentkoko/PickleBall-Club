import { NextRequest } from "next/server";
import { addMonths } from "date-fns";
import { prisma } from "@/lib/prisma";
import { requireApiAdmin } from "@/lib/auth/api-guard";
import { adminCreateMemberSchema } from "@/lib/validations/admin-member";
import { ROLES } from "@/lib/auth/rbac";
import { hashPassword } from "@/lib/auth/password";
import { getMembershipFees } from "@/lib/settings";
import { ok, handleApiError, ApiError } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { MEMBERSHIP_TYPE_LABELS } from "@/lib/validations/membership";

function genTempPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let s = "";
  for (let i = 0; i < 10; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function genMembershipNumber() {
  return `SVPC-${new Date().getFullYear()}-${Date.now().toString(36).slice(-5).toUpperCase()}`;
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireApiAdmin();
    const input = adminCreateMemberSchema.parse(await req.json());
    const email = input.email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new ApiError("An account with this email already exists.", 409);

    const memberRole = await prisma.role.findUnique({ where: { name: ROLES.MEMBER } });
    if (!memberRole) throw new ApiError("Roles are not initialized.", 500);

    const fees = (await getMembershipFees()) ?? {};
    const fee = fees[input.membershipType] ?? 0;

    const tempPassword = genTempPassword();
    const passwordHash = await hashPassword(tempPassword);

    const activate = input.accountStatus === "ACTIVE";
    const months = MEMBERSHIP_TYPE_LABELS[input.membershipType]?.months;
    const start = input.startDate ? new Date(input.startDate) : activate ? new Date() : null;
    const endDate = input.endDate
      ? new Date(input.endDate)
      : activate && months && start
        ? addMonths(start, months)
        : null;

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          firstName: input.firstName.trim(),
          middleName: input.middleName?.trim() || null,
          lastName: input.lastName.trim(),
          phone: input.phone,
          gender: input.gender,
          birthdate: input.birthdate ? new Date(input.birthdate) : undefined,
          address: input.address,
          skillLevel: input.skillLevel,
          roleId: memberRole.id,
          accountStatus: input.accountStatus,
        },
      });

      const membership = await tx.membership.create({
        data: {
          userId: user.id,
          type: input.membershipType,
          status: activate ? "ACTIVE" : "PENDING",
          fee,
          membershipNumber: input.membershipNumber?.trim() || genMembershipNumber(),
          startDate: start,
          endDate,
          approvedById: activate ? admin.id : null,
          approvedAt: activate ? new Date() : null,
          notes: input.internalNotes,
        },
      });

      if (input.paymentStatus !== "NONE") {
        await tx.payment.create({
          data: {
            userId: user.id,
            purpose: "MEMBERSHIP",
            amount: fee,
            method: "CASH",
            status: input.paymentStatus,
            membershipId: membership.id,
            verifiedById: input.paymentStatus === "VERIFIED" ? admin.id : null,
            verifiedAt: input.paymentStatus === "VERIFIED" ? new Date() : null,
          },
        });
      }
    });

    await logAudit({
      userId: admin.id,
      action: "MEMBER_CREATED_MANUAL",
      entity: "User",
      entityId: email,
      description: `${input.firstName} ${input.lastName} (${input.accountStatus})`,
    });

    return ok({ email, tempPassword }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
