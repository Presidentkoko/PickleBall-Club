"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function GenerateBracketButton({
  tournamentId,
  hasBracket,
}: {
  tournamentId: string;
  hasBracket: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  async function generate() {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/tournaments/${tournamentId}/generate`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Could not generate bracket.");
        return;
      }
      toast.success(`Bracket generated — ${json.data.matches} matches.`);
      router.refresh();
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button variant={hasBracket ? "outline" : "default"} onClick={generate} disabled={busy}>
      <Shuffle />
      {busy ? "Generating…" : hasBracket ? "Regenerate bracket" : "Generate bracket"}
    </Button>
  );
}
