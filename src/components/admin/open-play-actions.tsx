"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function OpenPlayActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  async function setStatus(next: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/open-play/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Failed to update.");
        return;
      }
      toast.success("Session updated.");
      router.refresh();
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon-sm" aria-label="Session actions" disabled={busy} />}
      >
        <MoreHorizontal />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {status !== "OPEN" && (
          <DropdownMenuItem onClick={() => setStatus("OPEN")}>Reopen</DropdownMenuItem>
        )}
        {status !== "CLOSED" && (
          <DropdownMenuItem onClick={() => setStatus("CLOSED")}>Close registration</DropdownMenuItem>
        )}
        {status !== "COMPLETED" && (
          <DropdownMenuItem onClick={() => setStatus("COMPLETED")}>Mark completed</DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => setStatus("CANCELLED")}>
          Cancel session
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
