import type { Metadata } from "next";
import { format } from "date-fns";
import { Megaphone, Pin } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/guards";
import { ANNOUNCEMENT_TYPE_LABELS } from "@/lib/validations/announcement";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Announcements" };

export default async function MemberAnnouncementsPage() {
  await requireUser();
  const announcements = await prisma.announcement.findMany({
    where: { isPublished: true },
    orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Announcements" description="The latest news and highlights from the club." />

      {announcements.length === 0 ? (
        <EmptyState icon={Megaphone} title="Nothing here yet" description="Check back soon for club news." />
      ) : (
        <div className="space-y-4">
          {announcements.map((a) => (
            <Card key={a.id} className={a.isPinned ? "ring-primary/30" : undefined}>
              {a.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.imageUrl} alt="" className="aspect-[3/1] w-full object-cover" />
              )}
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {ANNOUNCEMENT_TYPE_LABELS[a.type]}
                  </span>
                  {a.isPinned && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Pin className="size-3" /> Pinned
                    </span>
                  )}
                  <span className="ml-auto text-xs text-muted-foreground">
                    {a.publishedAt ? format(a.publishedAt, "MMM d, yyyy") : ""}
                  </span>
                </div>
                <h3 className="font-heading text-lg font-semibold">{a.title}</h3>
                <p className="whitespace-pre-line text-sm text-muted-foreground">{a.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
