"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { bookingRequestSchema, type BookingRequestInput } from "@/lib/validations/booking";
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

export function BookingFormDialog({ courts }: { courts: { id: string; name: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BookingRequestInput>({ resolver: zodResolver(bookingRequestSchema) });

  async function onSubmit(values: BookingRequestInput) {
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Could not submit booking.");
        return;
      }
      toast.success("Booking requested! An admin will confirm shortly.");
      setOpen(false);
      reset();
      router.refresh();
    } catch {
      toast.error("Something went wrong.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus />
        New booking
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request a court booking</DialogTitle>
          <DialogDescription>Pick a date and time; an admin will confirm and assign a court.</DialogDescription>
        </DialogHeader>
        <form id="bk-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input id="date" type="date" aria-invalid={!!errors.date} {...register("date")} />
            {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start</Label>
              <Input id="startTime" type="time" aria-invalid={!!errors.startTime} {...register("startTime")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End</Label>
              <Input id="endTime" type="time" aria-invalid={!!errors.endTime} {...register("endTime")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="courtId">Preferred court (optional)</Label>
            <NativeSelect id="courtId" {...register("courtId", { setValueAs: (v) => (v === "" ? undefined : v) })}>
              <option value="">No preference</option>
              {courts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-2">
            <Label htmlFor="purpose">Purpose (optional)</Label>
            <Input id="purpose" placeholder="e.g. Practice with friends" {...register("purpose")} />
          </div>
        </form>
        <DialogFooter>
          <Button type="submit" form="bk-form" disabled={isSubmitting}>
            {isSubmitting ? "Requesting…" : "Request booking"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
