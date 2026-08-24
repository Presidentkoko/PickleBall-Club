import { requireStaff } from "@/lib/auth/guards";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaff();

  return (
    <DashboardLayout
      variant="admin"
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
