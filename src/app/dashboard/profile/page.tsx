import type { Metadata } from "next";
import { Award, Swords, Target, Trophy } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/guards";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { ProfileForm } from "@/components/profile/profile-form";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await requireUser();
  const stats = await prisma.playerStats.findUnique({ where: { userId: user.id } });

  const winPct =
    stats && stats.matchesPlayed ? Math.round((stats.wins / stats.matchesPlayed) * 100) : 0;

  const defaultValues = {
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone ?? "",
    birthdate: user.birthdate ? user.birthdate.toISOString().slice(0, 10) : "",
    gender: user.gender ?? undefined,
    address: user.address ?? "",
    emergencyContact: user.emergencyContact ?? "",
    emergencyContactPhone: user.emergencyContactPhone ?? "",
    skillLevel: user.skillLevel ?? undefined,
    preferredTime: user.preferredTime ?? undefined,
    bio: user.bio ?? "",
    avatarDataUrl: user.avatarUrl ?? undefined,
  };

  return (
    <div className="space-y-8">
      <PageHeader title="Profile" description="Manage your details and track your stats." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Matches played" value={stats?.matchesPlayed ?? 0} icon={Swords} />
        <StatCard label="Wins" value={stats?.wins ?? 0} icon={Target} />
        <StatCard label="Win rate" value={`${winPct}%`} icon={Award} />
        <StatCard label="Titles" value={stats?.tournamentsWon ?? 0} icon={Trophy} />
      </div>

      <ProfileForm defaultValues={defaultValues} />
    </div>
  );
}
