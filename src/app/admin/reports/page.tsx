import type { Metadata } from "next";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";
import { CalendarDays, CreditCard, MapPin, Trophy, Users, Wallet } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guards";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { PrintButton } from "@/components/admin/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = { title: "Reports" };

function peso(amount: unknown) {
  return `₱${Number(amount ?? 0).toLocaleString("en-PH")}`;
}

export default async function ReportsPage() {
  await requireAdmin();
  const now = new Date();

  const [revenue, members, activeMemberships, bookings, tournaments, sessions, verified, membershipGroups] =
    await Promise.all([
      prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "VERIFIED" } }),
      prisma.user.count({ where: { role: { name: "MEMBER" } } }),
      prisma.membership.count({ where: { status: "ACTIVE" } }),
      prisma.booking.count(),
      prisma.tournament.count(),
      prisma.openPlay.count(),
      prisma.payment.findMany({
        where: { status: "VERIFIED", verifiedAt: { gte: startOfMonth(subMonths(now, 5)) } },
        select: { amount: true, verifiedAt: true },
      }),
      prisma.membership.groupBy({ by: ["status"], _count: true }),
    ]);

  const series = Array.from({ length: 6 }, (_, i) => {
    const m = startOfMonth(subMonths(now, 5 - i));
    const mEnd = endOfMonth(m);
    const rev = verified
      .filter((p) => p.verifiedAt && p.verifiedAt >= m && p.verifiedAt <= mEnd)
      .reduce((s, p) => s + Number(p.amount), 0);
    return { month: format(m, "MMM yyyy"), rev };
  });

  return (
    <div className="space-y-8">
      <PageHeader title="Reports" description={`Generated ${format(now, "MMMM d, yyyy")}`}>
        <PrintButton />
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total revenue" value={peso(revenue._sum.amount)} icon={Wallet} />
        <StatCard label="Total members" value={members} icon={Users} />
        <StatCard label="Active memberships" value={activeMemberships} icon={CreditCard} />
        <StatCard label="Total bookings" value={bookings} icon={MapPin} />
        <StatCard label="Tournaments" value={tournaments} icon={Trophy} />
        <StatCard label="Open play sessions" value={sessions} icon={CalendarDays} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue — last 6 months</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {series.map((r) => (
                  <TableRow key={r.month}>
                    <TableCell>{r.month}</TableCell>
                    <TableCell className="text-right font-medium">{peso(r.rev)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Memberships by status</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {membershipGroups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-muted-foreground">
                      No memberships yet
                    </TableCell>
                  </TableRow>
                ) : (
                  membershipGroups.map((g) => (
                    <TableRow key={g.status}>
                      <TableCell className="capitalize">{g.status.toLowerCase()}</TableCell>
                      <TableCell className="text-right font-medium">{g._count}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
