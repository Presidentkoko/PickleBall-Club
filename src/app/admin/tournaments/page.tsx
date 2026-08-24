import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { Trophy } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth/guards";
import { DIVISION_LABELS, FORMAT_LABELS } from "@/lib/validations/tournament";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { TournamentFormDialog } from "@/components/admin/tournament-form-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = { title: "Tournaments" };

export default async function AdminTournamentsPage() {
  await requireStaff();
  const tournaments = await prisma.tournament.findMany({
    orderBy: { date: "desc" },
    include: { _count: { select: { teams: true } } },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Tournaments" description="Create tournaments, seed teams, and run brackets.">
        <TournamentFormDialog />
      </PageHeader>

      {tournaments.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No tournaments yet"
          description="Create your first tournament to start bracket play."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tournament</TableHead>
                <TableHead>Division</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Teams</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Manage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tournaments.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell>{DIVISION_LABELS[t.division]}</TableCell>
                  <TableCell className="text-muted-foreground">{FORMAT_LABELS[t.format]}</TableCell>
                  <TableCell className="text-muted-foreground">{format(t.date, "MMM d, yyyy")}</TableCell>
                  <TableCell>{t._count.teams}</TableCell>
                  <TableCell>
                    <StatusBadge status={t.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/admin/tournaments/${t.id}`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      Open
                    </Link>
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
