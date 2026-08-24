import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/auth/api-guard";
import { ok, handleApiError, ApiError } from "@/lib/api";
import { logAudit } from "@/lib/audit";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireApiUser();
    const { id } = await params;

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking || booking.userId !== user.id) throw new ApiError("Booking not found.", 404);
    if (!["PENDING", "APPROVED"].includes(booking.status)) {
      throw new ApiError("This booking can no longer be cancelled.", 400);
    }

    await prisma.booking.update({ where: { id }, data: { status: "CANCELLED" } });
    await logAudit({ userId: user.id, action: "BOOKING_CANCELLED", entity: "Booking", entityId: id });

    return ok({ id });
  } catch (error) {
    return handleApiError(error);
  }
}
