"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ClubInfo, PaymentAccounts } from "@/lib/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

async function saveSetting(key: string, value: unknown): Promise<boolean> {
  const res = await fetch("/api/admin/settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, value }),
  });
  return res.ok;
}

type Fees = { MONTHLY: number; QUARTERLY: number; SEMI_ANNUAL: number; ANNUAL: number };

export function SettingsForms({
  clubInfo,
  fees,
  paymentAccounts,
}: {
  clubInfo: ClubInfo | null;
  fees: Record<string, number> | null;
  paymentAccounts: PaymentAccounts | null;
}) {
  const router = useRouter();
  const [club, setClub] = React.useState<ClubInfo>(
    clubInfo ?? { name: "San Vicente Pickleball Club" },
  );
  const [fee, setFee] = React.useState<Fees>({
    MONTHLY: fees?.MONTHLY ?? 0,
    QUARTERLY: fees?.QUARTERLY ?? 0,
    SEMI_ANNUAL: fees?.SEMI_ANNUAL ?? 0,
    ANNUAL: fees?.ANNUAL ?? 0,
  });
  const [pay, setPay] = React.useState<PaymentAccounts>(paymentAccounts ?? {});
  const [busy, setBusy] = React.useState<string | null>(null);

  async function save(section: string, key: string, value: unknown) {
    setBusy(section);
    const okRes = await saveSetting(key, value);
    setBusy(null);
    if (okRes) {
      toast.success("Settings saved.");
      router.refresh();
    } else {
      toast.error("Could not save settings.");
    }
  }

  return (
    <div className="space-y-6">
      {/* Club info */}
      <Card>
        <CardHeader>
          <CardTitle>Club information</CardTitle>
          <CardDescription>Shown across the site and on receipts.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={club.name ?? ""} onChange={(e) => setClub({ ...club, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Tagline</Label>
            <Input value={club.tagline ?? ""} onChange={(e) => setClub({ ...club, tagline: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={club.email ?? ""} onChange={(e) => setClub({ ...club, email: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={club.phone ?? ""} onChange={(e) => setClub({ ...club, phone: e.target.value })} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Address</Label>
            <Input value={club.address ?? ""} onChange={(e) => setClub({ ...club, address: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <Button onClick={() => save("club", "club.info", club)} disabled={busy === "club"}>
              {busy === "club" ? "Saving…" : "Save club info"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Fees */}
      <Card>
        <CardHeader>
          <CardTitle>Membership fees (₱)</CardTitle>
          <CardDescription>Used on the membership application.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-4">
          {(["MONTHLY", "QUARTERLY", "SEMI_ANNUAL", "ANNUAL"] as const).map((k) => (
            <div key={k} className="space-y-2">
              <Label>{k.replace("_", " ")}</Label>
              <Input
                type="number"
                min={0}
                value={fee[k]}
                onChange={(e) => setFee({ ...fee, [k]: Number(e.target.value) })}
              />
            </div>
          ))}
          <div className="sm:col-span-4">
            <Button onClick={() => save("fees", "membership.fees", fee)} disabled={busy === "fees"}>
              {busy === "fees" ? "Saving…" : "Save fees"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment accounts */}
      <Card>
        <CardHeader>
          <CardTitle>Payment accounts</CardTitle>
          <CardDescription>Where members send manual payments.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>GCash name</Label>
            <Input
              value={pay.gcash?.name ?? ""}
              onChange={(e) => setPay({ ...pay, gcash: { ...pay.gcash, name: e.target.value } })}
            />
          </div>
          <div className="space-y-2">
            <Label>GCash number</Label>
            <Input
              value={pay.gcash?.number ?? ""}
              onChange={(e) => setPay({ ...pay, gcash: { ...pay.gcash, number: e.target.value } })}
            />
          </div>
          <div className="space-y-2">
            <Label>Bank name</Label>
            <Input
              value={pay.bank?.bankName ?? ""}
              onChange={(e) => setPay({ ...pay, bank: { ...pay.bank, bankName: e.target.value } })}
            />
          </div>
          <div className="space-y-2">
            <Label>Account name</Label>
            <Input
              value={pay.bank?.accountName ?? ""}
              onChange={(e) => setPay({ ...pay, bank: { ...pay.bank, accountName: e.target.value } })}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Account number</Label>
            <Input
              value={pay.bank?.accountNumber ?? ""}
              onChange={(e) =>
                setPay({ ...pay, bank: { ...pay.bank, accountNumber: e.target.value } })
              }
            />
          </div>
          <div className="sm:col-span-2">
            <Button
              onClick={() => save("pay", "payment.accounts", pay)}
              disabled={busy === "pay"}
            >
              {busy === "pay" ? "Saving…" : "Save payment accounts"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
