import type { Metadata } from "next";
import { format } from "date-fns";
import { MapPin } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireActiveMember } from "@/lib/auth/guards";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { BookingFormDialog } from "@/components/booking/booking-form-dialog";
import { BookingCancelButton } from "@/components/booking/booking-cancel-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = { title: "Bookings" };

function peso(amount: unknown) {
  return amount == null ? "—" : `₱${Number(amount).toLocaleString("en-PH")}`;
}

export default async function MemberBookingsPage() {
  const user = await requireActiveMember();
  const [bookings, courts] = await Promise.all([
    prisma.booking.findMany({
      where: { userId: user.id },
      include: { court: { select: { name: true } } },
      orderBy: { date: "desc" },
    }),
    prisma.court.findMany({
      where: { status: "AVAILABLE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="My Bookings" description="Request and manage your court bookings.">
        <BookingFormDialog courts={courts} />
      </PageHeader>

      {bookings.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No bookings yet"
          description="Request your first court booking to get on the court."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Court</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>{format(b.date, "MMM d, yyyy")}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(b.startTime, "h:mm a")} – {format(b.endTime, "h:mm a")}
                  </TableCell>
                  <TableCell>{b.court?.name ?? "—"}</TableCell>
                  <TableCell>
                    <StatusBadge status={b.status} />
                  </TableCell>
                  <TableCell>{peso(b.price)}</TableCell>
                  <TableCell className="text-right">
                    {["PENDING", "APPROVED"].includes(b.status) && <BookingCancelButton id={b.id} />}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
