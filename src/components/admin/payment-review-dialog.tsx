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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/status-badge";

export type PaymentSummary = {
  id: string;
  member: string;
  amount: string;
  method: string;
  purpose: string;
  status: string;
  referenceNumber?: string | null;
};

export function PaymentReviewDialog({ payment }: { payment: PaymentSummary }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState<string | null>(null);
  const [proofUrl, setProofUrl] = React.useState<string | null | undefined>(undefined);
  const [reason, setReason] = React.useState("");

  React.useEffect(() => {
    if (!open) return;
    fetch(`/api/admin/payments/${payment.id}`)
      .then((r) => r.json())
      .then((j) => setProofUrl(j?.data?.proofUrl ?? null))
      .catch(() => setProofUrl(null));
  }, [open, payment.id]);

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) setProofUrl(undefined);
    setOpen(nextOpen);
  }

  async function act(action: "verify" | "reject" | "request_proof") {
    if (action === "reject" && !reason.trim()) {
      toast.error("Please add a reason for rejection.");
      return;
    }
    setSubmitting(action);
    try {
      const res = await fetch(`/api/admin/payments/${payment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          rejectionReason: action === "reject" ? reason : undefined,
          notes: action === "request_proof" ? reason : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Action failed.");
        return;
      }
      toast.success(
        action === "verify"
          ? "Payment verified — membership activated."
          : action === "reject"
            ? "Payment rejected."
            : "Requested new proof from member.",
      );
      setOpen(false);
      setReason("");
      router.refresh();
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="outline" size="sm">Review</Button>} />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Review payment</DialogTitle>
          <DialogDescription>
            {payment.member} · {payment.purpose.toLowerCase()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Amount</span>
            <span className="font-semibold">{payment.amount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Method</span>
            <span>{payment.method.replace("_", " ")}</span>
          </div>
          {payment.referenceNumber && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reference</span>
              <span className="font-mono">{payment.referenceNumber}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Status</span>
            <StatusBadge status={payment.status} />
          </div>

          <div>
            <Label className="mb-1.5">Proof of payment</Label>
            {proofUrl === undefined ? (
              <div className="h-44 animate-pulse rounded-lg bg-muted" />
            ) : proofUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={proofUrl}
                alt="Proof of payment"
                className="max-h-72 w-full rounded-lg border object-contain"
              />
            ) : (
              <p className="rounded-lg border border-dashed p-4 text-center text-muted-foreground">
                No proof uploaded (e.g. cash payment).
              </p>
            )}
          </div>

          {payment.status === "PENDING" && (
            <div className="space-y-1.5">
              <Label htmlFor="reason">Note / reason</Label>
              <Textarea
                id="reason"
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Optional note; required when rejecting"
              />
            </div>
          )}
        </div>

        {payment.status === "PENDING" && (
          <DialogFooter>
            <Button variant="outline" onClick={() => act("request_proof")} disabled={!!submitting}>
              Request new proof
            </Button>
            <Button variant="destructive" onClick={() => act("reject")} disabled={!!submitting}>
              {submitting === "reject" ? "Rejecting…" : "Reject"}
            </Button>
            <Button onClick={() => act("verify")} disabled={!!submitting}>
              {submitting === "verify" ? "Approving…" : "Approve"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
