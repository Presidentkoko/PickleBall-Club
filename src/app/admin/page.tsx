import type { Metadata } from "next";
import { startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths, format } from "date-fns";
import {
  CalendarDays,
  Clock,
  CreditCard,
  Trophy,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth/guards";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { DashboardCharts } from "@/components/admin/dashboard-charts";

export const metadata: Metadata = { title: "Dashboard" };

function peso(amount: unknown): string {
  return `₱${Number(amount ?? 0).toLocaleString("en-PH", { maximumFractionDigits: 0 })}`;
}

export default async function AdminDashboardPage() {
  const user = await requireStaff();
  const now = new Date();

  const [
    todayBookings,
    pendingMemberships,
    pendingPayments,
    totalMembers,
    upcomingOpenPlays,
    upcomingTournaments,
    monthlyRevenue,
    todayRevenue,
  ] = await Promise.all([
    prisma.booking.count({ where: { date: { gte: startOfDay(now), lte: endOfDay(now) } } }),
    prisma.membership.count({ where: { status: "PENDING" } }),
    prisma.payment.count({ where: { status: "PENDING" } }),
    prisma.user.count({ where: { role: { name: "MEMBER" }, isActive: true } }),
    prisma.openPlay.count({ where: { date: { gte: startOfDay(now) }, status: "OPEN" } }),
    prisma.tournament.count({
      where: { date: { gte: startOfDay(now) }, status: { in: ["OPEN", "ONGOING"] } },
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: "VERIFIED", verifiedAt: { gte: startOfMonth(now), lte: endOfMonth(now) } },
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: "VERIFIED", verifiedAt: { gte: startOfDay(now), lte: endOfDay(now) } },
    }),
  ]);

  const cards = [
    { label: "Today's Bookings", value: todayBookings, icon: CalendarDays },
    { label: "Today's Revenue", value: peso(todayRevenue._sum.amount), icon: Wallet },
    { label: "Pending Memberships", value: pendingMemberships, icon: UserPlus },
    { label: "Pending Payments", value: pendingPayments, icon: CreditCard },
    { label: "Upcoming Open Plays", value: upcomingOpenPlays, icon: Clock },
    { label: "Upcoming Tournaments", value: upcomingTournaments, icon: Trophy },
    { label: "Total Members", value: totalMembers, icon: Users },
    { label: "Monthly Revenue", value: peso(monthlyRevenue._sum.amount), icon: TrendingUp },
  ];

  const rangeStart = startOfMonth(subMonths(now, 5));
  const [chartPayments, chartMemberships] = await Promise.all([
    prisma.payment.findMany({
      where: { status: "VERIFIED", verifiedAt: { gte: rangeStart } },
      select: { amount: true, verifiedAt: true },
    }),
    prisma.membership.findMany({
      where: { createdAt: { gte: rangeStart } },
      select: { createdAt: true },
    }),
  ]);
  const series = Array.from({ length: 6 }, (_, i) => {
    const m = startOfMonth(subMonths(now, 5 - i));
    const mEnd = endOfMonth(m);
    const revenue = chartPayments
      .filter((p) => p.verifiedAt && p.verifiedAt >= m && p.verifiedAt <= mEnd)
      .reduce((sum, p) => sum + Number(p.amount), 0);
    const members = chartMemberships.filter(
      (mm) => mm.createdAt >= m && mm.createdAt <= mEnd,
    ).length;
    return { month: format(m, "MMM"), revenue, members };
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome back, ${user.firstName}`}
        description="Here's what's happening at the club today."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <StatCard key={card.label} label={card.label} value={card.value} icon={card.icon} />
        ))}
      </div>

      <DashboardCharts data={series} />
    </div>
  );
}
