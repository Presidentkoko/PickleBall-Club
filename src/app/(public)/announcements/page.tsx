import type { Metadata } from "next";
import { format } from "date-fns";
import { Megaphone, Pin } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ANNOUNCEMENT_TYPE_LABELS } from "@/lib/validations/announcement";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Announcements" };

export default async function PublicAnnouncementsPage() {
  const items = await prisma.announcement.findMany({
    where: { isPublished: true },
    orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
    take: 30,
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Announcements</h1>
      <p className="mt-2 text-muted-foreground">News and highlights from San Vicente Pickleball Club.</p>

      <div className="mt-10 space-y-5">
        {items.length === 0 ? (
          <EmptyState icon={Megaphone} title="Nothing here yet" description="Check back soon for club news." />
        ) : (
          items.map((a) => (
            <article key={a.id} className="overflow-hidden rounded-2xl border bg-card">
              {a.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.imageUrl} alt="" className="aspect-[3/1] w-full object-cover" />
              )}
              <div className="space-y-2 p-6">
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
                <h2 className="font-heading text-xl font-semibold">{a.title}</h2>
                <p className="whitespace-pre-line text-muted-foreground">{a.content}</p>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
