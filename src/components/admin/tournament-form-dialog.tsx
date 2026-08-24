"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import {
  tournamentSchema,
  type TournamentInput,
  DIVISION_LABELS,
  FORMAT_LABELS,
} from "@/lib/validations/tournament";
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

export function TournamentFormDialog() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TournamentInput>({
    resolver: zodResolver(tournamentSchema),
    defaultValues: {
      division: "MIXED",
      format: "SINGLE_ELIMINATION",
      teamSize: 2,
      entryFee: 0,
    },
  });

  async function onSubmit(values: TournamentInput) {
    try {
      const res = await fetch("/api/admin/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Could not create tournament.");
        return;
      }
      toast.success("Tournament created.");
      setOpen(false);
      reset();
      router.push(`/admin/tournaments/${json.data.id}`);
      router.refresh();
    } catch {
      toast.error("Something went wrong.");
    }
  }

  const errText = (n: keyof TournamentInput) =>
    errors[n] ? <p className="text-sm text-destructive">{errors[n]?.message}</p> : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus />
        Create tournament
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>New tournament</DialogTitle>
          <DialogDescription>Set up a tournament, then add teams and generate the bracket.</DialogDescription>
        </DialogHeader>

        <form id="tourney-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" aria-invalid={!!errors.name} {...register("name")} />
            {errText("name")}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="division">Division</Label>
              <NativeSelect id="division" {...register("division")}>
                {Object.entries(DIVISION_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-2">
              <Label htmlFor="format">Format</Label>
              <NativeSelect id="format" {...register("format")}>
                {Object.entries(FORMAT_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </NativeSelect>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" aria-invalid={!!errors.date} {...register("date")} />
              {errText("date")}
            </div>
            <div className="space-y-2">
              <Label htmlFor="registrationDeadline">Registration deadline</Label>
              <Input id="registrationDeadline" type="date" {...register("registrationDeadline")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="venue">Venue</Label>
            <Input id="venue" aria-invalid={!!errors.venue} {...register("venue")} />
            {errText("venue")}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="entryFee">Entry fee (₱)</Label>
              <Input id="entryFee" type="number" min={0} {...register("entryFee", { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="teamSize">Team size</Label>
              <Input id="teamSize" type="number" min={1} {...register("teamSize", { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxTeams">Max teams</Label>
              <Input
                id="maxTeams"
                type="number"
                min={2}
                {...register("maxTeams", { setValueAs: (v) => (v === "" ? undefined : Number(v)) })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={2} {...register("description")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="rules">Rules</Label>
              <Textarea id="rules" rows={2} {...register("rules")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prizes">Prizes</Label>
              <Textarea id="prizes" rows={2} {...register("prizes")} />
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
          <Button type="submit" form="tourney-form" disabled={isSubmitting}>
            {isSubmitting ? "Creating…" : "Create tournament"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
