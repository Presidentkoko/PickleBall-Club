"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import { adminCreateMemberSchema, type AdminCreateMemberInput } from "@/lib/validations/admin-member";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const optional = { setValueAs: (v: string) => (v === "" ? undefined : v) };

export function CreateMemberDialog() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [created, setCreated] = React.useState<{ email: string; tempPassword: string } | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AdminCreateMemberInput>({
    resolver: zodResolver(adminCreateMemberSchema),
    defaultValues: {
      membershipType: "MONTHLY",
      accountStatus: "ACTIVE",
      paymentStatus: "VERIFIED",
    },
  });

  async function onSubmit(values: AdminCreateMemberInput) {
    try {
      const res = await fetch("/api/admin/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Could not create member.");
        return;
      }
      setCreated({ email: json.data.email, tempPassword: json.data.tempPassword });
      toast.success("Member created.");
      router.refresh();
    } catch {
      toast.error("Something went wrong.");
    }
  }

  function close() {
    setOpen(false);
    setCreated(null);
    reset();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : close())}>
      <DialogTrigger render={<Button size="sm" />}>
        <UserPlus />
        Add member
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add member</DialogTitle>
          <DialogDescription>Create a walk-in or migrated member account.</DialogDescription>
        </DialogHeader>

        {created ? (
          <div className="space-y-4">
            <div className="rounded-xl border bg-primary/5 p-4 text-sm">
              <p className="font-medium">Member created successfully.</p>
              <p className="mt-2">Email: {created.email}</p>
              <p>
                Temporary password:{" "}
                <span className="font-mono font-semibold">{created.tempPassword}</span>
              </p>
              <p className="mt-2 text-muted-foreground">
                Share these with the member so they can log in and change their password.
              </p>
            </div>
            <div className="flex justify-end">
              <Button onClick={close}>Done</Button>
            </div>
          </div>
        ) : (
          <>
            <form id="create-member-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First name</Label>
                  <Input id="firstName" aria-invalid={!!errors.firstName} {...register("firstName")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="middleName">Middle name</Label>
                  <Input id="middleName" {...register("middleName")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input id="lastName" aria-invalid={!!errors.lastName} {...register("lastName")} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" aria-invalid={!!errors.email} {...register("email")} />
                  {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" {...register("phone")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <NativeSelect id="gender" {...register("gender", optional)}>
                    <option value="">—</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                    <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                  </NativeSelect>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birthdate">Date of birth</Label>
                  <Input id="birthdate" type="date" {...register("birthdate")} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" {...register("address")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="skillLevel">Skill level</Label>
                  <NativeSelect id="skillLevel" {...register("skillLevel", optional)}>
                    <option value="">—</option>
                    <option value="BEGINNER">Beginner</option>
                    <option value="INTERMEDIATE">Intermediate</option>
                    <option value="ADVANCED">Advanced</option>
                    <option value="PRO">Pro</option>
                  </NativeSelect>
                </div>
              </div>

              <div className="rounded-xl border p-4">
                <p className="mb-3 text-sm font-semibold">Membership</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="membershipType">Type</Label>
                    <NativeSelect id="membershipType" {...register("membershipType")}>
                      <option value="MONTHLY">Monthly</option>
                      <option value="QUARTERLY">Quarterly</option>
                      <option value="SEMI_ANNUAL">Semi-Annual</option>
                      <option value="ANNUAL">Annual</option>
                      <option value="COMPLIMENTARY">Complimentary</option>
                      <option value="LIFETIME">Lifetime</option>
                    </NativeSelect>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="membershipNumber">Member ID (optional)</Label>
                    <Input id="membershipNumber" placeholder="Auto-generated if blank" {...register("membershipNumber")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start date</Label>
                    <Input id="startDate" type="date" {...register("startDate")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">Expiration date</Label>
                    <Input id="endDate" type="date" {...register("endDate")} />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border p-4">
                <p className="mb-3 text-sm font-semibold">Admin options</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="accountStatus">Account status</Label>
                    <NativeSelect id="accountStatus" {...register("accountStatus")}>
                      <option value="ACTIVE">Active (payment received)</option>
                      <option value="PENDING_VERIFICATION">Pending</option>
                    </NativeSelect>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentStatus">Payment status</Label>
                    <NativeSelect id="paymentStatus" {...register("paymentStatus")}>
                      <option value="VERIFIED">Paid / verified</option>
                      <option value="PENDING">Pending</option>
                      <option value="NONE">No payment record</option>
                    </NativeSelect>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="internalNotes">Internal notes</Label>
                    <Textarea id="internalNotes" rows={2} {...register("internalNotes")} />
                  </div>
                </div>
              </div>
            </form>

            <DialogFooter>
              <Button type="submit" form="create-member-form" disabled={isSubmitting}>
                {isSubmitting ? "Creating…" : "Create member"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
