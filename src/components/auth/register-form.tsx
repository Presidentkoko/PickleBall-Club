"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Landmark, Smartphone, Wallet } from "lucide-react";
import {
  memberRegistrationSchema,
  type MemberRegistrationInput,
  WEEKDAYS,
  WEEKDAY_LABELS,
  PLAYING_EXPERIENCE_OPTIONS,
} from "@/lib/validations/register";
import { MEMBERSHIP_TYPE_LABELS } from "@/lib/validations/membership";
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

export function RegisterForm({
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
    watch,
    formState: { errors, isSubmitting },
  } = useForm<MemberRegistrationInput>({
    resolver: zodResolver(memberRegistrationSchema),
    defaultValues: {
      gender: "PREFER_NOT_TO_SAY",
      skillLevel: "BEGINNER",
      type: "MONTHLY",
      method: "GCASH",
      preferredDays: [],
    },
  });

  const type = watch("type");
  const method = watch("method");
  const fee = fees[type] ?? 0;

  async function onSubmit(values: MemberRegistrationInput) {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Could not submit your application.");
        return;
      }
      toast.success("Application submitted! An admin will review it shortly.");
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  }

  const err = (n: keyof MemberRegistrationInput) =>
    errors[n] ? <p className="text-sm text-destructive">{errors[n]?.message as string}</p> : null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>You&apos;ll use these to log in and track your application.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="email">Email address</Label>
            <Input id="email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...register("email")} />
            {err("email")}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" autoComplete="new-password" aria-invalid={!!errors.password} {...register("password")} />
            {err("password")}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input id="confirmPassword" type="password" autoComplete="new-password" aria-invalid={!!errors.confirmPassword} {...register("confirmPassword")} />
            {err("confirmPassword")}
          </div>
        </CardContent>
      </Card>

      {/* Personal */}
      <Card>
        <CardHeader>
          <CardTitle>Personal details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">First name</Label>
            <Input id="firstName" aria-invalid={!!errors.firstName} {...register("firstName")} />
            {err("firstName")}
          </div>
          <div className="space-y-2">
            <Label htmlFor="middleName">Middle name (optional)</Label>
            <Input id="middleName" {...register("middleName")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last name</Label>
            <Input id="lastName" aria-invalid={!!errors.lastName} {...register("lastName")} />
            {err("lastName")}
          </div>
          <div className="space-y-2">
            <Label htmlFor="birthdate">Date of birth</Label>
            <Input id="birthdate" type="date" aria-invalid={!!errors.birthdate} {...register("birthdate")} />
            {err("birthdate")}
          </div>
          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <NativeSelect id="gender" {...register("gender")}>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
              <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
            </NativeSelect>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Mobile number</Label>
            <Input id="phone" placeholder="09xx xxx xxxx" aria-invalid={!!errors.phone} {...register("phone")} />
            {err("phone")}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address">Complete address</Label>
            <Textarea id="address" rows={2} aria-invalid={!!errors.address} {...register("address")} />
            {err("address")}
          </div>
        </CardContent>
      </Card>

      {/* Emergency contact */}
      <Card>
        <CardHeader>
          <CardTitle>Emergency contact</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="emergencyContact">Name</Label>
            <Input id="emergencyContact" aria-invalid={!!errors.emergencyContact} {...register("emergencyContact")} />
            {err("emergencyContact")}
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergencyContactPhone">Number</Label>
            <Input id="emergencyContactPhone" aria-invalid={!!errors.emergencyContactPhone} {...register("emergencyContactPhone")} />
            {err("emergencyContactPhone")}
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergencyContactRelation">Relationship</Label>
            <Input id="emergencyContactRelation" placeholder="e.g. Spouse" aria-invalid={!!errors.emergencyContactRelation} {...register("emergencyContactRelation")} />
            {err("emergencyContactRelation")}
          </div>
        </CardContent>
      </Card>

      {/* Playing profile */}
      <Card>
        <CardHeader>
          <CardTitle>Playing profile</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="skillLevel">Skill level</Label>
            <NativeSelect id="skillLevel" {...register("skillLevel")}>
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
              <option value="PRO">Pro</option>
            </NativeSelect>
          </div>
          <div className="space-y-2">
            <Label htmlFor="playingExperience">Playing experience</Label>
            <NativeSelect id="playingExperience" aria-invalid={!!errors.playingExperience} {...register("playingExperience")}>
              <option value="">Select…</option>
              {PLAYING_EXPERIENCE_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </NativeSelect>
            {err("playingExperience")}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Preferred playing days</Label>
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map((d) => (
                <label
                  key={d}
                  className="flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:checked]:text-primary"
                >
                  <input type="checkbox" value={d} className="sr-only" {...register("preferredDays")} />
                  {WEEKDAY_LABELS[d]}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="preferredTime">Preferred playing time</Label>
            <NativeSelect id="preferredTime" {...register("preferredTime", { setValueAs: (v) => (v === "" ? undefined : v) })}>
              <option value="">No preference</option>
              <option value="MORNING">Morning</option>
              <option value="AFTERNOON">Afternoon</option>
              <option value="EVENING">Evening</option>
              <option value="FLEXIBLE">Flexible</option>
            </NativeSelect>
          </div>
        </CardContent>
      </Card>

      {/* Membership & payment */}
      <Card>
        <CardHeader>
          <CardTitle>Membership &amp; payment</CardTitle>
          <CardDescription>Choose a plan, pay via the account below, then upload your proof.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="type">Membership type</Label>
            <NativeSelect id="type" {...register("type")}>
              {(["MONTHLY", "QUARTERLY", "SEMI_ANNUAL", "ANNUAL"] as const).map((k) => (
                <option key={k} value={k}>
                  {MEMBERSHIP_TYPE_LABELS[k]?.label ?? k}
                  {fees[k] != null ? ` — ${peso(fees[k])}` : ""}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-primary/10 px-4 py-3 text-primary">
            <span className="text-sm font-medium">Total due</span>
            <span className="text-xl font-bold">{peso(fee)}</span>
          </div>

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
              <p className="text-muted-foreground">Pay at the front desk; an admin will confirm your payment.</p>
            </div>
          )}

          {method !== "CASH" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="referenceNumber">Reference number</Label>
                <Input id="referenceNumber" aria-invalid={!!errors.referenceNumber} {...register("referenceNumber")} />
                {err("referenceNumber")}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Proof of payment</Label>
                <Controller
                  control={control}
                  name="proofDataUrl"
                  render={({ field }) => (
                    <ImageUpload value={field.value} onChange={field.onChange} aspect="video" label="Upload screenshot of your payment" />
                  )}
                />
                {err("proofDataUrl")}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Submitting application…" : `Submit application · ${peso(fee)}`}
      </Button>
    </form>
  );
}
