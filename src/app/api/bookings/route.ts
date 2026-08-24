import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiActiveMember } from "@/lib/auth/api-guard";
import { bookingRequestSchema, combineDateTime } from "@/lib/validations/booking";
import { ok, handleApiError, ApiError } from "@/lib/api";
import { notifyAdmins } from "@/lib/notifications";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const user = await requireApiActiveMember();
    const input = bookingRequestSchema.parse(await req.json());

    const start = combineDateTime(input.date, input.startTime);
    const end = combineDateTime(input.date, input.endTime);
    if (end <= start) throw new ApiError("End time must be after the start time.", 400);

    const booking = await prisma.booking.create({
      data: {
        userId: user.id,
        date: new Date(input.date),
        startTime: start,
        endTime: end,
        courtId: input.courtId || null,
        purpose: input.purpose,
        notes: input.notes,
        status: "PENDING",
      },
    });

    await notifyAdmins({
      type: "BOOKING",
      title: "New court booking request",
      message: `${user.firstName} ${user.lastName} requested a court booking.`,
      link: "/admin/bookings",
    });
    await logAudit({
      userId: user.id,
      action: "BOOKING_REQUESTED",
      entity: "Booking",
      entityId: booking.id,
    });

    return ok({ id: booking.id }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
