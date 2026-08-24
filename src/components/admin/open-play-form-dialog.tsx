"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { openPlaySchema, type OpenPlayInput } from "@/lib/validations/open-play";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { ImageUpload } from "@/components/ui/image-upload";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function OpenPlayFormDialog() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<OpenPlayInput>({
    resolver: zodResolver(openPlaySchema),
    defaultValues: { maxPlayers: 16, fee: 0 },
  });

  async function onSubmit(values: OpenPlayInput) {
    try {
      const res = await fetch("/api/admin/open-play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Could not create session.");
        return;
      }
      toast.success("Open Play session created.");
      setOpen(false);
      reset();
      router.refresh();
    } catch {
      toast.error("Something went wrong.");
    }
  }

  const errText = (n: keyof OpenPlayInput) =>
    errors[n] ? <p className="text-sm text-destructive">{errors[n]?.message}</p> : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus />
        Create session
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Open Play session</DialogTitle>
          <DialogDescription>Schedule a session for members to join.</DialogDescription>
        </DialogHeader>

        <form id="op-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" aria-invalid={!!errors.title} {...register("title")} />
            {errText("title")}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={2} {...register("description")} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" aria-invalid={!!errors.date} {...register("date")} />
              {errText("date")}
            </div>
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
            <Label htmlFor="venue">Venue</Label>
            <Input id="venue" aria-invalid={!!errors.venue} {...register("venue")} />
            {errText("venue")}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="maxPlayers">Max players</Label>
              <Input id="maxPlayers" type="number" min={2} {...register("maxPlayers", { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fee">Fee (₱)</Label>
              <Input id="fee" type="number" min={0} step="0.01" {...register("fee", { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="skillLevel">Skill</Label>
              <NativeSelect
                id="skillLevel"
                {...register("skillLevel", { setValueAs: (v) => (v === "" ? undefined : v) })}
              >
                <option value="">All levels</option>
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
                <option value="PRO">Pro</option>
              </NativeSelect>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Banner (optional)</Label>
            <Controller
              control={control}
              name="bannerDataUrl"
              render={({ field }) => (
                <ImageUpload value={field.value} onChange={field.onChange} aspect="video" label="Add a banner" />
              )}
            />
          </div>
        </form>

        <DialogFooter>
          <Button type="submit" form="op-form" disabled={isSubmitting}>
            {isSubmitting ? "Creating…" : "Create session"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
