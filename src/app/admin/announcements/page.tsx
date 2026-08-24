import type { Metadata } from "next";
import { format } from "date-fns";
import { Megaphone, Pin } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guards";
import { cn } from "@/lib/utils";
import { ANNOUNCEMENT_TYPE_LABELS } from "@/lib/validations/announcement";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { AnnouncementFormDialog } from "@/components/admin/announcement-form-dialog";
import { AnnouncementActions } from "@/components/admin/announcement-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = { title: "Announcements" };

export default async function AdminAnnouncementsPage() {
  await requireAdmin();
  const announcements = await prisma.announcement.findMany({
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Announcements" description="Post news, highlights, and events for members.">
        <AnnouncementFormDialog />
      </PageHeader>

      {announcements.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No announcements yet"
          description="Post your first announcement to keep members in the loop."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {announcements.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>
                    <div className="flex items-center gap-1.5 font-medium">
                      {a.isPinned && <Pin className="size-3.5 text-primary" />}
                      {a.title}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {ANNOUNCEMENT_TYPE_LABELS[a.type]}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-medium",
                        a.isPublished
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {a.isPublished ? "Published" : "Draft"}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(a.createdAt, "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <AnnouncementActions id={a.id} isPinned={a.isPinned} isPublished={a.isPublished} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
