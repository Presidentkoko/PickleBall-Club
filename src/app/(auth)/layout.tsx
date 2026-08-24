import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center px-4 py-10">
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-50" />
      <div className="bg-radial-fade pointer-events-none absolute inset-0" />

      <div className="relative w-full max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" className="transition-opacity hover:opacity-90">
            <Logo />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Home
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
