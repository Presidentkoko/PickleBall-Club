"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { profileSchema, type ProfileInput } from "@/lib/validations/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { ImageUpload } from "@/components/ui/image-upload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const optional = { setValueAs: (v: string) => (v === "" ? undefined : v) };

export function ProfileForm({ defaultValues }: { defaultValues: Partial<ProfileInput> }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ProfileInput>({ resolver: zodResolver(profileSchema), defaultValues });

  async function onSubmit(values: ProfileInput) {
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Could not save.");
        return;
      }
      toast.success("Profile updated.");
      router.refresh();
    } catch {
      toast.error("Something went wrong.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Your details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label className="mb-2">Profile photo</Label>
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
            <Label htmlFor="firstName">First name</Label>
            <Input id="firstName" aria-invalid={!!errors.firstName} {...register("firstName")} />
            {errors.firstName && <p className="text-sm text-destructive">{errors.firstName.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last name</Label>
            <Input id="lastName" aria-invalid={!!errors.lastName} {...register("lastName")} />
            {errors.lastName && <p className="text-sm text-destructive">{errors.lastName.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" {...register("phone")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="birthdate">Birthdate</Label>
            <Input id="birthdate" type="date" {...register("birthdate")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <NativeSelect id="gender" {...register("gender", optional)}>
              <option value="">Prefer not to say</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </NativeSelect>
          </div>
          <div className="space-y-2">
            <Label htmlFor="skillLevel">Skill level</Label>
            <NativeSelect id="skillLevel" {...register("skillLevel", optional)}>
              <option value="">Not set</option>
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
              <option value="PRO">Pro</option>
            </NativeSelect>
          </div>

          <div className="space-y-2">
            <Label htmlFor="preferredTime">Preferred time</Label>
            <NativeSelect id="preferredTime" {...register("preferredTime", optional)}>
              <option value="">No preference</option>
              <option value="MORNING">Morning</option>
              <option value="AFTERNOON">Afternoon</option>
              <option value="EVENING">Evening</option>
              <option value="FLEXIBLE">Flexible</option>
            </NativeSelect>
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergencyContact">Emergency contact</Label>
            <Input id="emergencyContact" {...register("emergencyContact")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emergencyContactPhone">Emergency contact phone</Label>
            <Input id="emergencyContactPhone" {...register("emergencyContactPhone")} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Textarea id="address" rows={2} {...register("address")} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" rows={2} placeholder="A little about you" {...register("bio")} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
