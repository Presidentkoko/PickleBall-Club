import { NextRequest } from "next/server";
import { z } from "zod";
import { addMonths } from "date-fns";
import { prisma } from "@/lib/prisma";
import { requireApiAdmin } from "@/lib/auth/api-guard";
import { ok, handleApiError, ApiError } from "@/lib/api";
import { notifyUser } from "@/lib/notifications";
import { logAudit } from "@/lib/audit";
import { MEMBERSHIP_TYPE_LABELS } from "@/lib/validations/membership";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireApiAdmin();
    const { id } = await params;
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, phone: true } },
        membership: { select: { id: true, type: true, status: true } },
      },
    });
    if (!payment) throw new ApiError("Payment not found", 404);
    return ok(payment);
  } catch (error) {
    return handleApiError(error);
  }
}

const actionSchema = z.object({
  action: z.enum(["verify", "reject", "request_proof"]),
  notes: z.string().max(500).optional(),
  rejectionReason: z.string().max(500).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireApiAdmin();
    const { id } = await params;
    const { action, notes, rejectionReason } = actionSchema.parse(await req.json());

    const payment = await prisma.payment.findUnique({ where: { id }, include: { membership: true } });
    if (!payment) throw new ApiError("Payment not found", 404);

    if (action === "verify") {
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id },
          data: { status: "VERIFIED", verifiedById: admin.id, verifiedAt: new Date(), notes },
        });
        if (payment.purpose === "MEMBERSHIP" && payment.membership) {
          const months = MEMBERSHIP_TYPE_LABELS[payment.membership.type]?.months ?? 1;
          const start = new Date();
          await tx.membership.update({
            where: { id: payment.membership.id },
            data: {
              status: "ACTIVE",
              startDate: start,
              endDate: addMonths(start, months),
              approvedById: admin.id,
              approvedAt: start,
              rejectionReason: null,
            },
          });
        }
      });
      await notifyUser(payment.userId, {
        type: "PAYMENT",
        title: "Payment verified 🎉",
        message: "Your payment was verified and your membership is now active. Welcome to the club!",
        link: "/dashboard",
      });
      await logAudit({
        userId: admin.id,
        action: "PAYMENT_VERIFIED",
        entity: "Payment",
        entityId: id,
        description: `Verified ${payment.purpose} payment`,
      });
    } else if (action === "reject") {
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id },
          data: { status: "REJECTED", rejectionReason, verifiedById: admin.id, verifiedAt: new Date() },
        });
        if (payment.purpose === "MEMBERSHIP" && payment.membership) {
          await tx.membership.update({
            where: { id: payment.membership.id },
            data: { status: "REJECTED", rejectionReason },
          });
        }
      });
      await notifyUser(payment.userId, {
        type: "PAYMENT",
        title: "Payment rejected",
        message: rejectionReason
          ? `Your payment was rejected: ${rejectionReason}`
          : "Your payment was rejected. Please contact the club.",
        link: "/dashboard/membership",
      });
      await logAudit({ userId: admin.id, action: "PAYMENT_REJECTED", entity: "Payment", entityId: id });
    } else {
      // request_proof — keep pending, ask member to re-upload
      await prisma.payment.update({
        where: { id },
        data: { status: "PENDING", notes: notes ?? "New proof requested" },
      });
      await notifyUser(payment.userId, {
        type: "PAYMENT",
        title: "New payment proof requested",
        message: notes ?? "Please re-upload a clearer proof of payment.",
        link: "/dashboard/membership",
      });
      await logAudit({
        userId: admin.id,
        action: "PAYMENT_PROOF_REQUESTED",
        entity: "Payment",
        entityId: id,
      });
    }

    return ok({ id });
  } catch (error) {
    return handleApiError(error);
  }
}
