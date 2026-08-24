"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MoreHorizontal } from "lucide-react";
import { ROLE_LABELS } from "@/lib/auth/rbac";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ASSIGNABLE = ["SUPER_ADMIN", "ADMIN", "STAFF"] as const;

export function AdminAccountActions({
  id,
  role,
  isActive,
  isSelf,
}: {
  id: string;
  role: string;
  isActive: boolean;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  async function patch(body: Record<string, string>) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/team/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Action failed.");
        return;
      }
      if (body.action === "reset_password" && json.data?.tempPassword) {
        toast.success(`New temporary password: ${json.data.tempPassword}`, { duration: 15000 });
      } else {
        toast.success("Account updated.");
      }
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
        render={<Button variant="ghost" size="icon-sm" aria-label="Account actions" disabled={busy} />}
      >
        <MoreHorizontal />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {ASSIGNABLE.filter((r) => r !== role).map((r) => (
          <DropdownMenuItem key={r} onClick={() => patch({ action: "set_role", role: r })}>
            Make {ROLE_LABELS[r]}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => patch({ action: "reset_password" })}>
          Reset password
        </DropdownMenuItem>
        {isActive ? (
          !isSelf && (
            <DropdownMenuItem variant="destructive" onClick={() => patch({ action: "disable" })}>
              Disable account
            </DropdownMenuItem>
          )
        ) : (
          <DropdownMenuItem onClick={() => patch({ action: "enable" })}>Enable account</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
