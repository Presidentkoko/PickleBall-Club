import type { Metadata } from "next";
import { CheckCircle2, Clock } from "lucide-react";
import { format } from "date-fns";
import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { getMembershipFees, getPaymentAccounts } from "@/lib/settings";
import { PageHeader } from "@/components/ui/page-header";
import { MembershipForm } from "@/components/membership/membership-form";
import { MEMBERSHIP_TYPE_LABELS } from "@/lib/validations/membership";

export const metadata: Metadata = { title: "Membership" };

export default async function MembershipPage() {
  const user = await requireUser();
  const [membership, fees, paymentAccounts] = await Promise.all([
    prisma.membership.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
    getMembershipFees(),
    getPaymentAccounts(),
  ]);

  const inFlight = membership && ["ACTIVE", "PENDING"].includes(membership.status);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader title="Membership" description="Apply for or manage your club membership." />

      {inFlight ? (
        <div className="glass-strong bg-radial-fade rounded-2xl p-8 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            {membership.status === "ACTIVE" ? (
              <CheckCircle2 className="size-7" />
            ) : (
              <Clock className="size-7" />
            )}
          </div>
          <h2 className="mt-4 text-xl font-bold">
            {membership.status === "ACTIVE"
              ? "You're an active member!"
              : "Application under review"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {membership.status === "ACTIVE"
              ? `Your ${MEMBERSHIP_TYPE_LABELS[membership.type]?.label ?? membership.type} membership is active${
                  membership.endDate ? ` until ${format(membership.endDate, "MMMM d, yyyy")}` : ""
                }.`
              : "We've received your application and payment. An admin will verify it shortly — you'll be notified once it's approved."}
          </p>
        </div>
      ) : (
        <MembershipForm fees={fees ?? {}} paymentAccounts={paymentAccounts} />
      )}
    </div>
  );
}
