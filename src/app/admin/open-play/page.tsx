import type { Metadata } from "next";
import { format } from "date-fns";
import { CalendarDays } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth/guards";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { OpenPlayFormDialog } from "@/components/admin/open-play-form-dialog";
import { OpenPlayActions } from "@/components/admin/open-play-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = { title: "Open Play" };

function peso(amount: unknown) {
  return `₱${Number(amount ?? 0).toLocaleString("en-PH")}`;
}

export default async function AdminOpenPlayPage() {
  await requireStaff();

  const sessions = await prisma.openPlay.findMany({ orderBy: { date: "desc" } });
  const counts = await prisma.openPlayParticipant.groupBy({
    by: ["openPlayId"],
    where: { status: "REGISTERED" },
    _count: true,
  });
  const countMap = new Map(counts.map((c) => [c.openPlayId, c._count]));

  return (
    <div className="space-y-6">
      <PageHeader title="Open Play" description="Create and manage open play sessions.">
        <OpenPlayFormDialog />
      </PageHeader>

      {sessions.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No sessions yet"
          description="Create your first Open Play session to get members playing."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Session</TableHead>
                <TableHead>Date &amp; time</TableHead>
                <TableHead>Players</TableHead>
                <TableHead>Fee</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <div className="font-medium">{s.title}</div>
                    <div className="text-xs text-muted-foreground">{s.venue}</div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(s.date, "MMM d, yyyy")}
                    <br />
                    {format(s.startTime, "h:mm a")} – {format(s.endTime, "h:mm a")}
                  </TableCell>
                  <TableCell>
                    {countMap.get(s.id) ?? 0}/{s.maxPlayers}
                  </TableCell>
                  <TableCell>{peso(s.fee)}</TableCell>
                  <TableCell>
                    <StatusBadge status={s.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <OpenPlayActions id={s.id} status={s.status} />
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
