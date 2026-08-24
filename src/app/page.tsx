import Link from "next/link";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  ChartNoAxesColumn,
  MapPin,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";

const STATS = [
  { label: "Active members", value: "500+" },
  { label: "Tournaments hosted", value: "40+" },
  { label: "Pro courts", value: "4" },
  { label: "Matches played", value: "12k+" },
];

const FEATURES = [
  {
    icon: Users,
    title: "Membership",
    description:
      "Join in minutes. Upload your payment, get verified, and unlock the full club experience.",
  },
  {
    icon: CalendarDays,
    title: "Open Play",
    description:
      "Reserve your spot in casual sessions, see who's coming, and hop on the waitlist when it's full.",
  },
  {
    icon: Trophy,
    title: "Tournaments",
    description:
      "Single & double elimination, round robin — auto-generated brackets with live scores and standings.",
  },
  {
    icon: MapPin,
    title: "Court Booking",
    description:
      "Request a court, get assigned a time, and receive an invoice — all without a single phone call.",
  },
  {
    icon: ChartNoAxesColumn,
    title: "Leaderboard",
    description:
      "Track wins, matches, and champions. Climb the rankings and earn your place at the top.",
  },
  {
    icon: Bell,
    title: "Announcements",
    description:
      "News, highlights, and events delivered straight to your dashboard so you never miss a beat.",
  },
];

export default function HomePage() {
  return (
    <>
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="bg-grid pointer-events-none absolute inset-0 opacity-60" />
          <div className="bg-radial-fade pointer-events-none absolute inset-0" />

          <div className="relative mx-auto max-w-7xl px-4 py-24 text-center sm:px-6 sm:py-32 lg:px-8">
            <Badge
              variant="secondary"
              className="mb-6 gap-1.5 rounded-full px-3.5 py-1.5 animate-in fade-in slide-in-from-bottom-2 duration-700"
            >
              <Sparkles className="size-3.5 text-primary" />
              Now open for the 2026 season
            </Badge>

            <h1 className="mx-auto max-w-4xl text-balance text-4xl font-bold tracking-tight animate-in fade-in slide-in-from-bottom-3 duration-700 sm:text-6xl lg:text-7xl">
              The modern home for <span className="text-gradient">pickleball</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground animate-in fade-in slide-in-from-bottom-4 duration-1000">
              Memberships, open play, tournaments, court bookings, and live leaderboards — everything
              your club needs, in one beautifully simple platform.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 animate-in fade-in slide-in-from-bottom-5 duration-1000 sm:flex-row">
              <Link href="/register" className={cn(buttonVariants({ size: "lg" }), "group w-full sm:w-auto")}>
                Join the club
                <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/open-play"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full sm:w-auto")}
              >
                Explore open play
              </Link>
            </div>

            {/* Stats */}
            <div className="mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
              {STATS.map((stat) => (
                <div key={stat.label} className="glass rounded-2xl px-4 py-5">
                  <div className="text-2xl font-bold sm:text-3xl">{stat.value}</div>
                  <div className="mt-1 text-xs text-muted-foreground sm:text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything the club needs
            </h2>
            <p className="mt-4 text-muted-foreground">
              Built for members and admins alike — fast, clean, and delightful on every device.
            </p>
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <Card
                key={title}
                className="group transition-all duration-300 hover:-translate-y-1 hover:ring-primary/30"
              >
                <CardContent className="flex flex-col gap-4">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="size-6" />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg font-semibold">{title}</h3>
                    <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section id="contact" className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
          <div className="glass-strong bg-radial-fade relative overflow-hidden rounded-3xl px-8 py-16 text-center shadow-elevated">
            <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to play your best season yet?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Become a member today and get instant access to open play, tournaments, and the
              full San Vicente Pickleball Club experience.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/register" className={cn(buttonVariants({ size: "lg" }), "group w-full sm:w-auto")}>
                Get started
                <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/login"
                className={cn(buttonVariants({ variant: "ghost", size: "lg" }), "w-full sm:w-auto")}
              >
                I already have an account
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
