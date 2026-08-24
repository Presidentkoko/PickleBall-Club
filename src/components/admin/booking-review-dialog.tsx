"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { NativeSelect } from "@/components/ui/native-select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type Booking = {
  id: string;
  member: string;
  status: string;
  courtId?: string | null;
  dateLabel: string;
  timeLabel: string;
};

export function BookingReviewDialog({
  booking,
  courts,
  staff,
}: {
  booking: Booking;
  courts: { id: string; name: string }[];
  staff: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [courtId, setCourtId] = React.useState(booking.courtId ?? "");
  const [staffId, setStaffId] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [reason, setReason] = React.useState("");

  async function act(action: string) {
    if (action === "reject" && !reason.trim()) {
      toast.error("Add a reason to reject.");
      return;
    }
    setBusy(action);
    try {
      const body: Record<string, unknown> = { action };
      if (action === "approve") {
        if (courtId) body.courtId = courtId;
        if (staffId) body.assignedStaffId = staffId;
        if (price) body.price = Number(price);
      }
      if (action === "reject") body.rejectionReason = reason;

      const res = await fetch(`/api/admin/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Action failed.");
        return;
      }
      toast.success("Booking updated.");
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm">Manage</Button>} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage booking</DialogTitle>
          <DialogDescription>
            {booking.member} · {booking.dateLabel} · {booking.timeLabel}
          </DialogDescription>
        </DialogHeader>

        {booking.status === "PENDING" ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Assign court</Label>
              <NativeSelect value={courtId} onChange={(e) => setCourtId(e.target.value)}>
                <option value="">Unassigned</option>
                {courts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-2">
              <Label>Assign staff (optional)</Label>
              <NativeSelect value={staffId} onChange={(e) => setStaffId(e.target.value)}>
                <option value="">None</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price override (optional)</Label>
              <Input
                id="price"
                type="number"
                min={0}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Auto: hours × rate"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Rejection reason (if rejecting)</Label>
              <Textarea id="reason" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            This booking is <span className="font-medium">{booking.status.toLowerCase()}</span>.
          </p>
        )}

        <DialogFooter>
          {booking.status === "PENDING" && (
            <>
              <Button variant="destructive" onClick={() => act("reject")} disabled={!!busy}>
                Reject
              </Button>
              <Button onClick={() => act("approve")} disabled={!!busy}>
                {busy === "approve" ? "Approving…" : "Approve"}
              </Button>
            </>
          )}
          {booking.status === "APPROVED" && (
            <>
              <Button variant="outline" onClick={() => act("cancel")} disabled={!!busy}>
                Cancel booking
              </Button>
              <Button onClick={() => act("complete")} disabled={!!busy}>
                Mark completed
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
