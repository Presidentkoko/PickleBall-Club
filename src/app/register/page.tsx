import type { Metadata } from "next";
import Link from "next/link";
import { getMembershipFees, getPaymentAccounts } from "@/lib/settings";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { RegisterForm } from "@/components/auth/register-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Join the club" };

export default async function RegisterPage() {
  const [fees, paymentAccounts] = await Promise.all([getMembershipFees(), getPaymentAccounts()]);

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Join San Vicente Pickleball Club
            </h1>
            <p className="mt-2 text-muted-foreground">
              Complete your membership application below. An admin will review and approve it, then
              you&apos;ll get full access.
            </p>
          </div>
          <RegisterForm fees={fees ?? {}} paymentAccounts={paymentAccounts} />
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already a member?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
