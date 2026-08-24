"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function BookingCancelButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  async function cancel() {
    setBusy(true);
    try {
      const res = await fetch(`/api/bookings/${id}/cancel`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Could not cancel.");
        return;
      }
      toast.success("Booking cancelled.");
      router.refresh();
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={cancel} disabled={busy}>
      Cancel
    </Button>
  );
}
