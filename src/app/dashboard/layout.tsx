import { requireUser } from "@/lib/auth/guards";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <DashboardLayout
      variant="member"
      user={{
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role.name,
        avatarUrl: user.avatarUrl,
      }}
    >
      {children}
    </DashboardLayout>
  );
}
