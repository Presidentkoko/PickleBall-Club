import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <Card className="shadow-elevated">
      <CardHeader className="items-center text-center">
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription>Sign in to your SVPC account</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>

        <div className="rounded-lg border border-dashed bg-muted/40 p-3 text-center text-xs text-muted-foreground">
          Demo admin — username{" "}
          <span className="font-semibold text-foreground">admin123</span> · password{" "}
          <span className="font-semibold text-foreground">admin123</span>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Join now
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
