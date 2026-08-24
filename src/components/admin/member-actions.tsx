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

type Action = "activate" | "deactivate" | "suspend" | "unsuspend";

export function MemberActions({
  id,
  isActive,
  membershipStatus,
}: {
  id: string;
  isActive: boolean;
  membershipStatus?: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  async function run(action: Action) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/members/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Action failed.");
        return;
      }
      toast.success("Member updated.");
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
        render={<Button variant="ghost" size="icon-sm" aria-label="Member actions" disabled={busy} />}
      >
        <MoreHorizontal />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {membershipStatus === "ACTIVE" && (
          <DropdownMenuItem onClick={() => run("suspend")}>Suspend membership</DropdownMenuItem>
        )}
        {membershipStatus === "SUSPENDED" && (
          <DropdownMenuItem onClick={() => run("unsuspend")}>Reactivate membership</DropdownMenuItem>
        )}
        {(membershipStatus === "ACTIVE" || membershipStatus === "SUSPENDED") && (
          <DropdownMenuSeparator />
        )}
        {isActive ? (
          <DropdownMenuItem variant="destructive" onClick={() => run("deactivate")}>
            Deactivate account
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => run("activate")}>Reactivate account</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
