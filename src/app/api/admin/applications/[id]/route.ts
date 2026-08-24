import { NextRequest } from "next/server";
import { z } from "zod";
import { addMonths } from "date-fns";
import { prisma } from "@/lib/prisma";
import { requireApiAdmin } from "@/lib/auth/api-guard";
import { ok, handleApiError, ApiError } from "@/lib/api";
import { notifyUser } from "@/lib/notifications";
import { logAudit } from "@/lib/audit";
import { MEMBERSHIP_TYPE_LABELS } from "@/lib/validations/membership";

function genMembershipNumber() {
  return `SVPC-${new Date().getFullYear()}-${Date.now().toString(36).slice(-5).toUpperCase()}`;
}

function appendNote(existing: string | null, text: string) {
  const line = `${new Date().toISOString().slice(0, 10)}: ${text}`;
  return existing ? `${existing}\n${line}` : line;
}

// [id] = membership id (an "application" is a pending membership)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireApiAdmin();
    const { id } = await params;
    const membership = await prisma.membership.findUnique({
      where: { id },
      include: {
        payments: {
          where: { purpose: "MEMBERSHIP" },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { proofUrl: true, referenceNumber: true, method: true, status: true },
        },
      },
    });
    if (!membership) throw new ApiError("Application not found", 404);
    return ok({ payment: membership.payments[0] ?? null, notes: membership.notes });
  } catch (error) {
    return handleApiError(error);
  }
}

const schema = z.object({
  action: z.enum(["approve", "reject", "request_info", "note"]),
  reason: z.string().max(1000).optional(),
  note: z.string().max(1000).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireApiAdmin();
    const { id } = await params;
    const { action, reason, note } = schema.parse(await req.json());

    const membership = await prisma.membership.findUnique({ where: { id } });
    if (!membership) throw new ApiError("Application not found", 404);

    if (action === "approve") {
      const months = MEMBERSHIP_TYPE_LABELS[membership.type]?.months;
      const start = new Date();
      const endDate = months ? addMonths(start, months) : null; // complimentary/lifetime = no expiry
      await prisma.$transaction(async (tx) => {
        await tx.membership.update({
          where: { id },
          data: {
            status: "ACTIVE",
            startDate: start,
            endDate,
            approvedById: admin.id,
            approvedAt: start,
            rejectionReason: null,
            membershipNumber: membership.membershipNumber ?? genMembershipNumber(),
          },
        });
        await tx.user.update({
          where: { id: membership.userId },
          data: { accountStatus: "ACTIVE" },
        });
        await tx.payment.updateMany({
          where: { membershipId: id, status: "PENDING" },
          data: { status: "VERIFIED", verifiedById: admin.id, verifiedAt: new Date() },
        });
      });
      await notifyUser(membership.userId, {
        type: "MEMBERSHIP",
        title: "Membership approved 🎉",
        message: "Your membership is active — welcome to the club! You now have full access.",
        link: "/dashboard",
      });
    } else if (action === "reject") {
      if (!reason) throw new ApiError("A rejection reason is required.", 400);
      await prisma.$transaction(async (tx) => {
        await tx.membership.update({ where: { id }, data: { status: "REJECTED", rejectionReason: reason } });
        await tx.user.update({ where: { id: membership.userId }, data: { accountStatus: "REJECTED" } });
        await tx.payment.updateMany({
          where: { membershipId: id, status: "PENDING" },
          data: { status: "REJECTED", rejectionReason: reason },
        });
      });
      await notifyUser(membership.userId, {
        type: "MEMBERSHIP",
        title: "Membership application update",
        message: `Your application was not approved: ${reason}`,
        link: "/dashboard",
      });
    } else if (action === "request_info") {
      const msg = note || "Please provide additional information for your membership application.";
      await prisma.membership.update({
        where: { id },
        data: { notes: appendNote(membership.notes, `[Info requested] ${msg}`) },
      });
      await notifyUser(membership.userId, {
        type: "MEMBERSHIP",
        title: "More information needed",
        message: msg,
        link: "/dashboard/membership",
      });
    } else {
      if (!note) throw new ApiError("Note is empty.", 400);
      await prisma.membership.update({
        where: { id },
        data: { notes: appendNote(membership.notes, note) },
      });
    }

    await logAudit({
      userId: admin.id,
      action: `APPLICATION_${action.toUpperCase()}`,
      entity: "Membership",
      entityId: id,
    });
    return ok({ id });
  } catch (error) {
    return handleApiError(error);
  }
}
