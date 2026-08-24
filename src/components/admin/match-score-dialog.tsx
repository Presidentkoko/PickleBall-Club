"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function MatchScoreDialog({
  tournamentId,
  matchId,
  teamAName,
  teamBName,
}: {
  tournamentId: string;
  matchId: string;
  teamAName: string;
  teamBName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [a, setA] = React.useState("");
  const [b, setB] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  async function submit() {
    const scoreA = Number(a);
    const scoreB = Number(b);
    if (a === "" || b === "" || Number.isNaN(scoreA) || Number.isNaN(scoreB)) {
      toast.error("Enter both scores.");
      return;
    }
    if (scoreA === scoreB) {
      toast.error("Scores can't be tied.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/tournaments/${tournamentId}/matches/${matchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scoreA, scoreB }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Could not record score.");
        return;
      }
      toast.success("Score recorded.");
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="xs" variant="outline" />}>Record</DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Record score</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Label className="flex-1 truncate">{teamAName}</Label>
            <Input
              type="number"
              min={0}
              className="w-20"
              value={a}
              onChange={(e) => setA(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <Label className="flex-1 truncate">{teamBName}</Label>
            <Input
              type="number"
              min={0}
              className="w-20"
              value={b}
              onChange={(e) => setB(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={busy}>
            {busy ? "Saving…" : "Save score"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
