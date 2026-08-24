"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export type Application = {
  membershipId: string;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  gender?: string | null;
  birthdate?: string | null;
  skillLevel?: string | null;
  playingExperience?: string | null;
  preferredDays?: string | null;
  preferredTime?: string | null;
  emergency?: string | null;
  membershipType: string;
  fee: string;
  paymentMethod?: string | null;
  referenceNumber?: string | null;
};

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between gap-4 border-b py-1.5 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value || "—"}</span>
    </div>
  );
}

export function ApplicationReviewDialog({ application }: { application: Application }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [proofUrl, setProofUrl] = React.useState<string | null | undefined>(undefined);
  const [message, setMessage] = React.useState("");

  React.useEffect(() => {
    if (!open) return;
    fetch(`/api/admin/applications/${application.membershipId}`)
      .then((r) => r.json())
      .then((j) => setProofUrl(j?.data?.payment?.proofUrl ?? null))
      .catch(() => setProofUrl(null));
  }, [open, application.membershipId]);

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) setProofUrl(undefined);
    setOpen(nextOpen);
  }

  async function act(action: "approve" | "reject" | "request_info" | "note") {
    if (action === "reject" && !message.trim()) {
      toast.error("Please provide a rejection reason.");
      return;
    }
    if ((action === "request_info" || action === "note") && !message.trim()) {
      toast.error("Please enter a message.");
      return;
    }
    setBusy(action);
    try {
      const res = await fetch(`/api/admin/applications/${application.membershipId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          reason: action === "reject" ? message : undefined,
          note: action === "request_info" || action === "note" ? message : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Action failed.");
        return;
      }
      toast.success(
        action === "approve"
          ? "Membership approved."
          : action === "reject"
            ? "Application rejected."
            : action === "request_info"
              ? "Info requested from applicant."
              : "Note saved.",
      );
      if (action !== "note") setOpen(false);
      setMessage("");
      router.refresh();
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="outline" size="sm">Review</Button>} />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{application.name}</DialogTitle>
          <DialogDescription>{application.email}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-xl border p-3">
            <Row label="Phone" value={application.phone} />
            <Row label="Address" value={application.address} />
            <Row label="Gender" value={application.gender} />
            <Row label="Date of birth" value={application.birthdate} />
            <Row label="Skill level" value={application.skillLevel} />
            <Row label="Experience" value={application.playingExperience} />
            <Row label="Preferred days" value={application.preferredDays} />
            <Row label="Preferred time" value={application.preferredTime} />
            <Row label="Emergency contact" value={application.emergency} />
          </div>

          <div className="rounded-xl border p-3">
            <Row label="Membership" value={application.membershipType} />
            <Row label="Fee" value={application.fee} />
            <Row label="Payment method" value={application.paymentMethod} />
            <Row label="Reference #" value={application.referenceNumber} />
          </div>

          <div>
            <Label className="mb-1.5">Proof of payment</Label>
            {proofUrl === undefined ? (
              <div className="h-44 animate-pulse rounded-lg bg-muted" />
            ) : proofUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={proofUrl} alt="Proof" className="max-h-72 w-full rounded-lg border object-contain" />
            ) : (
              <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                No proof uploaded (e.g. cash payment).
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="message">Message / reason / note</Label>
            <Textarea
              id="message"
              rows={2}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Reason (to reject) · message (to request info) · internal note"
            />
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
          <Button variant="ghost" size="sm" onClick={() => act("note")} disabled={!!busy}>
            Add note
          </Button>
          <Button variant="outline" size="sm" onClick={() => act("request_info")} disabled={!!busy}>
            Request info
          </Button>
          <Button variant="destructive" size="sm" onClick={() => act("reject")} disabled={!!busy}>
            Reject
          </Button>
          <Button size="sm" onClick={() => act("approve")} disabled={!!busy}>
            {busy === "approve" ? "Approving…" : "Approve"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
