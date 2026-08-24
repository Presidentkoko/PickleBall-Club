import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApiStaff } from "@/lib/auth/api-guard";
import { getSetting } from "@/lib/settings";
import { ok, handleApiError, ApiError } from "@/lib/api";
import { notifyUser } from "@/lib/notifications";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  action: z.enum(["approve", "reject", "complete", "cancel"]),
  courtId: z.string().optional(),
  assignedStaffId: z.string().optional(),
  price: z.number().nonnegative().optional(),
  rejectionReason: z.string().max(500).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireApiStaff();
    const { id } = await params;
    const input = schema.parse(await req.json());

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new ApiError("Booking not found", 404);

    if (input.action === "approve") {
      const rules = await getSetting<{ pricePerHour?: number }>("booking.rules");
      const pricePerHour = rules?.pricePerHour ?? 300;
      const hours = Math.max(
        1,
        (booking.endTime.getTime() - booking.startTime.getTime()) / 3_600_000,
      );
      const price = input.price ?? Math.round(hours * pricePerHour);
      const invoiceNumber = `SVPC-${Date.now().toString(36).toUpperCase()}`;

      await prisma.booking.update({
        where: { id },
        data: {
          status: "APPROVED",
          approvedById: admin.id,
          approvedAt: new Date(),
          courtId: input.courtId ?? booking.courtId,
          assignedStaffId: input.assignedStaffId ?? booking.assignedStaffId,
          price,
          invoiceNumber,
        },
      });
      await notifyUser(booking.userId, {
        type: "BOOKING",
        title: "Booking approved ✅",
        message: `Your court booking is confirmed. Invoice ${invoiceNumber}.`,
        link: "/dashboard/bookings",
      });
    } else if (input.action === "reject") {
      await prisma.booking.update({
        where: { id },
        data: { status: "REJECTED", notes: input.rejectionReason ?? booking.notes },
      });
      await notifyUser(booking.userId, {
        type: "BOOKING",
        title: "Booking rejected",
        message: input.rejectionReason ?? "Your booking request was rejected.",
        link: "/dashboard/bookings",
      });
    } else if (input.action === "complete") {
      await prisma.booking.update({ where: { id }, data: { status: "COMPLETED" } });
    } else {
      await prisma.booking.update({ where: { id }, data: { status: "CANCELLED" } });
      await notifyUser(booking.userId, {
        type: "BOOKING",
        title: "Booking cancelled",
        message: "Your booking was cancelled by the club.",
        link: "/dashboard/bookings",
      });
    }

    await logAudit({
      userId: admin.id,
      action: `BOOKING_${input.action.toUpperCase()}`,
      entity: "Booking",
      entityId: id,
    });

    return ok({ id });
  } catch (error) {
    return handleApiError(error);
  }
}
