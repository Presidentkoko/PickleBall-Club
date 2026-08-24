"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function AddTeamDialog({
  tournamentId,
  teamSize,
}: {
  tournamentId: string;
  teamSize: number;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [players, setPlayers] = React.useState<string[]>(Array(Math.max(1, teamSize)).fill(""));
  const [busy, setBusy] = React.useState(false);

  async function submit() {
    const filtered = players.map((p) => p.trim()).filter(Boolean);
    if (!name.trim()) {
      toast.error("Team name is required.");
      return;
    }
    if (filtered.length === 0) {
      toast.error("Add at least one player.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/tournaments/${tournamentId}/teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), players: filtered }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Could not add team.");
        return;
      }
      toast.success("Team added.");
      setOpen(false);
      setName("");
      setPlayers(Array(Math.max(1, teamSize)).fill(""));
      router.refresh();
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <UserPlus />
        Add team
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add team</DialogTitle>
          <DialogDescription>Enter the team name and players.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="teamName">Team name</Label>
            <Input id="teamName" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Players</Label>
            <div className="space-y-2">
              {players.map((p, i) => (
                <Input
                  key={i}
                  value={p}
                  placeholder={`Player ${i + 1}`}
                  onChange={(e) => {
                    const next = [...players];
                    next[i] = e.target.value;
                    setPlayers(next);
                  }}
                />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={busy}>
            {busy ? "Adding…" : "Add team"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
