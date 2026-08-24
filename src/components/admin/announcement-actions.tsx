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

export function AnnouncementActions({
  id,
  isPinned,
  isPublished,
}: {
  id: string;
  isPinned: boolean;
  isPublished: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  async function patch(body: Record<string, boolean>) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/announcements/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        toast.error("Update failed.");
        return;
      }
      toast.success("Updated.");
      router.refresh();
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/announcements/${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Delete failed.");
        return;
      }
      toast.success("Announcement deleted.");
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
        render={<Button variant="ghost" size="icon-sm" aria-label="Actions" disabled={busy} />}
      >
        <MoreHorizontal />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={() => patch({ isPinned: !isPinned })}>
          {isPinned ? "Unpin" : "Pin to top"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => patch({ isPublished: !isPublished })}>
          {isPublished ? "Unpublish" : "Publish"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={remove}>
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
