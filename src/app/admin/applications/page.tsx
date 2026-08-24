import type { Metadata } from "next";
import { format } from "date-fns";
import { ClipboardCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guards";
import { MEMBERSHIP_TYPE_LABELS } from "@/lib/validations/membership";
import { WEEKDAY_LABELS } from "@/lib/validations/register";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ApplicationReviewDialog } from "@/components/admin/application-review-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = { title: "Applications" };

function peso(amount: unknown) {
  return `₱${Number(amount ?? 0).toLocaleString("en-PH")}`;
}

function cap(v?: string | null) {
  return v ? v.charAt(0) + v.slice(1).toLowerCase().replace(/_/g, " ") : null;
}

export default async function AdminApplicationsPage() {
  await requireAdmin();
  const apps = await prisma.membership.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    include: {
      user: true,
      payments: {
        where: { purpose: "MEMBERSHIP" },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { method: true, referenceNumber: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Membership Applications"
        description="Review and approve pending membership applications."
      />

      {apps.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No pending applications"
          description="New applications will appear here for review."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Applicant</TableHead>
                <TableHead>Membership</TableHead>
                <TableHead>Fee</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apps.map((a) => {
                const u = a.user;
                const payment = a.payments[0];
                const fullName = [u.firstName, u.middleName, u.lastName].filter(Boolean).join(" ");
                return (
                  <TableRow key={a.id}>
                    <TableCell>
                      <div className="font-medium">{fullName}</div>
                      <div className="text-xs text-muted-foreground">{u.email}</div>
                    </TableCell>
                    <TableCell>{MEMBERSHIP_TYPE_LABELS[a.type]?.label ?? a.type}</TableCell>
                    <TableCell>{peso(a.fee)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(a.createdAt, "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <ApplicationReviewDialog
                        application={{
                          membershipId: a.id,
                          name: fullName,
                          email: u.email,
                          phone: u.phone,
                          address: u.address,
                          gender: cap(u.gender),
                          birthdate: u.birthdate ? format(u.birthdate, "MMM d, yyyy") : null,
                          skillLevel: cap(u.skillLevel),
                          playingExperience: u.playingExperience,
                          preferredDays:
                            u.preferredDays.map((d) => WEEKDAY_LABELS[d]).join(", ") || null,
                          preferredTime: cap(u.preferredTime),
                          emergency:
                            [u.emergencyContact, u.emergencyContactPhone, u.emergencyContactRelation]
                              .filter(Boolean)
                              .join(" · ") || null,
                          membershipType: MEMBERSHIP_TYPE_LABELS[a.type]?.label ?? a.type,
                          fee: peso(a.fee),
                          paymentMethod: cap(payment?.method),
                          referenceNumber: payment?.referenceNumber,
                        }}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
