"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import { adminAccountSchema, type AdminAccountInput } from "@/lib/validations/admin-account";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export function CreateAdminDialog() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [created, setCreated] = React.useState<{ email: string; tempPassword: string } | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AdminAccountInput>({
    resolver: zodResolver(adminAccountSchema),
    defaultValues: { role: "ADMIN" },
  });

  async function onSubmit(values: AdminAccountInput) {
    try {
      const res = await fetch("/api/admin/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Could not create account.");
        return;
      }
      setCreated({ email: json.data.email, tempPassword: json.data.tempPassword });
      toast.success("Account created.");
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
        Add account
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add team account</DialogTitle>
          <DialogDescription>Create an admin or staff account.</DialogDescription>
        </DialogHeader>

        {created ? (
          <div className="space-y-4">
            <div className="rounded-xl border bg-primary/5 p-4 text-sm">
              <p className="font-medium">Account created.</p>
              <p className="mt-2">Email: {created.email}</p>
              <p>
                Temporary password:{" "}
                <span className="font-mono font-semibold">{created.tempPassword}</span>
              </p>
              <p className="mt-2 text-muted-foreground">Share these with the team member.</p>
            </div>
            <div className="flex justify-end">
              <Button onClick={close}>Done</Button>
            </div>
          </div>
        ) : (
          <>
            <form id="create-admin-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First name</Label>
                  <Input id="firstName" aria-invalid={!!errors.firstName} {...register("firstName")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input id="lastName" aria-invalid={!!errors.lastName} {...register("lastName")} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" aria-invalid={!!errors.email} {...register("email")} />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <NativeSelect id="role" {...register("role")}>
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="ADMIN">Admin</option>
                  <option value="STAFF">Staff</option>
                </NativeSelect>
              </div>
            </form>
            <DialogFooter>
              <Button type="submit" form="create-admin-form" disabled={isSubmitting}>
                {isSubmitting ? "Creating…" : "Create account"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
