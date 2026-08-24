"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function JoinButton({
  id,
  joined,
  waitlisted,
  full,
}: {
  id: string;
  joined: boolean;
  waitlisted: boolean;
  full: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  async function call(path: "join" | "cancel") {
    setBusy(true);
    try {
      const res = await fetch(`/api/open-play/${id}/${path}`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Action failed.");
        return;
      }
      if (path === "join") {
        toast.success(json.data?.status === "WAITLISTED" ? "Added to the waitlist." : "You're in!");
      } else {
        toast.success("Registration cancelled.");
      }
      router.refresh();
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  if (joined) {
    return (
      <Button variant="outline" className="w-full" onClick={() => call("cancel")} disabled={busy}>
        {waitlisted ? "Leave waitlist" : "Cancel spot"}
      </Button>
    );
  }

  return (
    <Button className="w-full" onClick={() => call("join")} disabled={busy}>
      {full ? "Join waitlist" : "Join session"}
    </Button>
  );
}
