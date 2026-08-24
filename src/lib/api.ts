import { NextResponse } from "next/server";
import { ZodError } from "zod";

/** Standard success envelope. */
export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

/** Standard error envelope. */
export function fail(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ success: false, error: message, ...extra }, { status });
}

/** Convert thrown errors (incl. Zod) into a consistent JSON response. */
export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of error.issues) {
      const key = issue.path.join(".") || "_";
      (fieldErrors[key] ??= []).push(issue.message);
    }
    return NextResponse.json(
      { success: false, error: "Validation failed", issues: fieldErrors },
      { status: 422 },
    );
  }

  if (error instanceof ApiError) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status });
  }

  console.error("[API ERROR]", error);
  return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
}

/** Throwable error with an HTTP status, caught by handleApiError. */
export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}
