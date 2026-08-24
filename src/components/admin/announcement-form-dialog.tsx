"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import {
  announcementSchema,
  type AnnouncementInput,
  ANNOUNCEMENT_TYPE_LABELS,
} from "@/lib/validations/announcement";
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

export function AnnouncementFormDialog() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AnnouncementInput>({
    resolver: zodResolver(announcementSchema),
    defaultValues: { type: "NEWS", isPublished: true, isPinned: false },
  });

  async function onSubmit(values: AnnouncementInput) {
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Could not post announcement.");
        return;
      }
      toast.success("Announcement posted.");
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
        New announcement
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New announcement</DialogTitle>
          <DialogDescription>Share news, highlights, and events with members.</DialogDescription>
        </DialogHeader>

        <form id="ann-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" aria-invalid={!!errors.title} {...register("title")} />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <NativeSelect id="type" {...register("type")}>
              {Object.entries(ANNOUNCEMENT_TYPE_LABELS).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea id="content" rows={5} aria-invalid={!!errors.content} {...register("content")} />
            {errors.content && <p className="text-sm text-destructive">{errors.content.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Image (optional)</Label>
            <Controller
              control={control}
              name="imageDataUrl"
              render={({ field }) => (
                <ImageUpload value={field.value} onChange={field.onChange} aspect="video" label="Add an image" />
              )}
            />
          </div>
          <div className="flex flex-wrap gap-5">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="size-4 rounded border-input accent-primary" {...register("isPinned")} />
              Pin to top
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="size-4 rounded border-input accent-primary" {...register("isPublished")} />
              Publish now
            </label>
          </div>
        </form>

        <DialogFooter>
          <Button type="submit" form="ann-form" disabled={isSubmitting}>
            {isSubmitting ? "Posting…" : "Post announcement"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
