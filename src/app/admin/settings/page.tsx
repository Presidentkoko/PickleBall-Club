import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/guards";
import { getClubInfo, getMembershipFees, getPaymentAccounts } from "@/lib/settings";
import { PageHeader } from "@/components/ui/page-header";
import { SettingsForms } from "@/components/admin/settings-forms";

export const metadata: Metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  await requireAdmin();
  const [clubInfo, fees, paymentAccounts] = await Promise.all([
    getClubInfo(),
    getMembershipFees(),
    getPaymentAccounts(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage club information, fees, and payment accounts." />
      <SettingsForms clubInfo={clubInfo} fees={fees} paymentAccounts={paymentAccounts} />
    </div>
  );
}
