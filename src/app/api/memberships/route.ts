import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { membershipApplicationSchema } from "@/lib/validations/membership";
import { getMembershipFees } from "@/lib/settings";
import { persistImage } from "@/lib/storage";
import { prisma } from "@/lib/prisma";
import { ok, fail, handleApiError, ApiError } from "@/lib/api";
import { notifyAdmins } from "@/lib/notifications";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("Not authenticated", 401);

    const body = await req.json();
    const input = membershipApplicationSchema.parse(body);

    const existing = await prisma.membership.findFirst({
      where: { userId: user.id, status: { in: ["ACTIVE", "PENDING"] } },
    });
    if (existing) {
      throw new ApiError(
        existing.status === "ACTIVE"
          ? "You already have an active membership."
          : "You already have a pending application awaiting verification.",
        409,
      );
    }

    const fees = (await getMembershipFees()) ?? {};
    const fee = fees[input.type];
    if (fee == null) throw new ApiError("Membership fee is not configured. Contact the admin.", 400);

    const avatarUrl = input.avatarDataUrl
      ? await persistImage(input.avatarDataUrl, "svpc/avatars")
      : undefined;
    const proofUrl = input.proofDataUrl
      ? await persistImage(input.proofDataUrl, "svpc/payments")
      : undefined;

    const membership = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          phone: input.phone,
          birthdate: input.birthdate ? new Date(input.birthdate) : undefined,
          gender: input.gender,
          address: input.address,
          emergencyContact: input.emergencyContact,
          emergencyContactPhone: input.emergencyContactPhone,
          skillLevel: input.skillLevel,
          preferredTime: input.preferredTime,
          ...(avatarUrl ? { avatarUrl } : {}),
        },
      });

      const created = await tx.membership.create({
        data: { userId: user.id, type: input.type, status: "PENDING", fee },
      });

      await tx.payment.create({
        data: {
          userId: user.id,
          purpose: "MEMBERSHIP",
          amount: fee,
          method: input.method,
          referenceNumber: input.referenceNumber,
          proofUrl,
          status: "PENDING",
          membershipId: created.id,
        },
      });

      return created;
    });

    await notifyAdmins({
      type: "MEMBERSHIP",
      title: "New membership application",
      message: `${user.firstName} ${user.lastName} applied for a ${input.type
        .toLowerCase()
        .replace("_", "-")} membership.`,
      link: "/admin/payments",
    });
    await logAudit({
      userId: user.id,
      action: "MEMBERSHIP_APPLIED",
      entity: "Membership",
      entityId: membership.id,
      description: `Applied for ${input.type} membership (${input.method})`,
    });

    return ok({ id: membership.id }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
