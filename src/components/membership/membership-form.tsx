"use client";

import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Landmark, Smartphone, Wallet } from "lucide-react";
import {
  membershipApplicationSchema,
  type MembershipApplicationInput,
  MEMBERSHIP_TYPE_LABELS,
} from "@/lib/validations/membership";
import type { PaymentAccounts } from "@/lib/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { ImageUpload } from "@/components/ui/image-upload";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

function peso(n: number) {
  return `₱${n.toLocaleString("en-PH")}`;
}

export function MembershipForm({
  fees,
  paymentAccounts,
}: {
  fees: Record<string, number>;
  paymentAccounts: PaymentAccounts | null;
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<MembershipApplicationInput>({
    resolver: zodResolver(membershipApplicationSchema),
    defaultValues: { type: "MONTHLY", method: "GCASH", skillLevel: "BEGINNER" },
  });

  const type = useWatch({ control, name: "type" });
  const method = useWatch({ control, name: "method" });
  const fee = fees[type] ?? 0;

  async function onSubmit(values: MembershipApplicationInput) {
    try {
      const res = await fetch("/api/memberships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Could not submit your application.");
        return;
      }
      toast.success("Application submitted! We'll verify your payment shortly.");
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  }

  const errText = (name: keyof MembershipApplicationInput) =>
    errors[name] ? <p className="text-sm text-destructive">{errors[name]?.message}</p> : null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {/* Your details */}
      <Card>
        <CardHeader>
          <CardTitle>Your details</CardTitle>
          <CardDescription>Tell us a bit about you for your membership profile.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label className="mb-2">Profile photo (optional)</Label>
            <Controller
              control={control}
              name="avatarDataUrl"
              render={({ field }) => (
                <ImageUpload
                  value={field.value}
                  onChange={field.onChange}
                  aspect="square"
                  className="max-w-40"
                  label="Add photo"
                />
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone number</Label>
            <Input id="phone" placeholder="09xx xxx xxxx" aria-invalid={!!errors.phone} {...register("phone")} />
            {errText("phone")}
          </div>
          <div className="space-y-2">
            <Label htmlFor="birthdate">Birthdate</Label>
            <Input id="birthdate" type="date" {...register("birthdate")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <NativeSelect id="gender" {...register("gender", { setValueAs: (v) => (v === "" ? undefined : v) })}>
              <option value="">Prefer not to say</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </NativeSelect>
          </div>
          <div className="space-y-2">
            <Label htmlFor="skillLevel">Skill level</Label>
            <NativeSelect id="skillLevel" aria-invalid={!!errors.skillLevel} {...register("skillLevel")}>
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
              <option value="PRO">Pro</option>
            </NativeSelect>
            {errText("skillLevel")}
          </div>

          <div className="space-y-2">
            <Label htmlFor="preferredTime">Preferred playing time</Label>
            <NativeSelect
              id="preferredTime"
              {...register("preferredTime", { setValueAs: (v) => (v === "" ? undefined : v) })}
            >
              <option value="">No preference</option>
              <option value="MORNING">Morning</option>
              <option value="AFTERNOON">Afternoon</option>
              <option value="EVENING">Evening</option>
              <option value="FLEXIBLE">Flexible</option>
            </NativeSelect>
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergencyContact">Emergency contact</Label>
            <Input id="emergencyContact" placeholder="Name" {...register("emergencyContact")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emergencyContactPhone">Emergency contact phone</Label>
            <Input id="emergencyContactPhone" placeholder="09xx xxx xxxx" {...register("emergencyContactPhone")} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Textarea id="address" rows={2} placeholder="Street, city, province" {...register("address")} />
          </div>
        </CardContent>
      </Card>

      {/* Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Membership plan</CardTitle>
          <CardDescription>Choose the plan that fits you.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="type">Plan</Label>
            <NativeSelect id="type" {...register("type")}>
              {Object.entries(MEMBERSHIP_TYPE_LABELS).map(([value, { label }]) => (
                <option key={value} value={value}>
                  {label}
                  {fees[value] != null ? ` — ${peso(fees[value])}` : ""}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-primary/10 px-4 py-3 text-primary">
            <span className="text-sm font-medium">Total due</span>
            <span className="text-xl font-bold">{peso(fee)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Payment */}
      <Card>
        <CardHeader>
          <CardTitle>Payment</CardTitle>
          <CardDescription>Pay via the account below, then upload your proof.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="method">Payment method</Label>
            <NativeSelect id="method" {...register("method")}>
              <option value="GCASH">GCash</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="CASH">Cash (pay at the club)</option>
            </NativeSelect>
          </div>

          {method === "GCASH" && paymentAccounts?.gcash && (
            <div className="flex items-start gap-3 rounded-xl border p-3 text-sm">
              <Smartphone className="mt-0.5 size-4 text-primary" />
              <div>
                <p className="font-medium">GCash</p>
                <p className="text-muted-foreground">{paymentAccounts.gcash.name}</p>
                <p className="font-mono">{paymentAccounts.gcash.number}</p>
              </div>
            </div>
          )}
          {method === "BANK_TRANSFER" && paymentAccounts?.bank && (
            <div className="flex items-start gap-3 rounded-xl border p-3 text-sm">
              <Landmark className="mt-0.5 size-4 text-primary" />
              <div>
                <p className="font-medium">{paymentAccounts.bank.bankName}</p>
                <p className="text-muted-foreground">{paymentAccounts.bank.accountName}</p>
                <p className="font-mono">{paymentAccounts.bank.accountNumber}</p>
              </div>
            </div>
          )}
          {method === "CASH" && (
            <div className="flex items-start gap-3 rounded-xl border p-3 text-sm">
              <Wallet className="mt-0.5 size-4 text-primary" />
              <p className="text-muted-foreground">
                Pay at the front desk. An admin will confirm your payment.
              </p>
            </div>
          )}

          {method !== "CASH" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="referenceNumber">Reference number</Label>
                <Input
                  id="referenceNumber"
                  placeholder="e.g. 1234 5678 90"
                  aria-invalid={!!errors.referenceNumber}
                  {...register("referenceNumber")}
                />
                {errText("referenceNumber")}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Proof of payment</Label>
                <Controller
                  control={control}
                  name="proofDataUrl"
                  render={({ field }) => (
                    <ImageUpload
                      value={field.value}
                      onChange={field.onChange}
                      aspect="video"
                      label="Upload screenshot of your payment"
                    />
                  )}
                />
                {errText("proofDataUrl")}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? "Submitting…" : `Submit application · ${peso(fee)}`}
        </Button>
      </div>
    </form>
  );
}
