import { NextResponse } from "next/server";

// Server-side proxy to call the Cloud Run service and bypass browser CORS.
// Reads dates from query params and forwards them as headers expected by the upstream.

const UPSTREAM_URL = process.env.CLOUD_RUN_EXPORT_URL ||
  "https://transfer-argentina-request-633589706319.us-central1.run.app";

const PRIVATE_KEY = process.env.CLOUD_RUN_PRIVATE_KEY || "";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!startDate || !endDate) {
      return NextResponse.json(
        { message: "Missing required query params: startDate, endDate" },
        { status: 400 }
      );
    }

    if (!PRIVATE_KEY) {
      return NextResponse.json(
        { message: "Server misconfiguration: CLOUD_RUN_PRIVATE_KEY is not set" },
        { status: 500 }
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60_000);

    const upstreamResponse = await fetch(UPSTREAM_URL, {
      method: "GET",
      headers: {
        "Private-Key": PRIVATE_KEY,
        "Start-Date": startDate,
        "End-Date": endDate,
      },
      signal: controller.signal,
      // Important for Next.js to avoid caching in edge runtimes
      cache: "no-store",
    });
    clearTimeout(timeout);

    const contentType = upstreamResponse.headers.get("content-type") || "";
    const traceHeader =
      upstreamResponse.headers.get("x-cloud-trace-context") ||
      upstreamResponse.headers.get("x-request-id") ||
      undefined;

    let body: any;
    try {
      if (contentType.includes("application/json")) {
        body = await upstreamResponse.clone().json();
      } else {
        body = await upstreamResponse.clone().text();
      }
    } catch {
      body = "<failed to read upstream body>";
    }

    if (!upstreamResponse.ok) {
      const errorPayload = {
        message: "Upstream request failed",
        status: upstreamResponse.status,
        statusText: upstreamResponse.statusText,
        trace: traceHeader,
        upstreamBody: typeof body === "string" ? body.slice(0, 2000) : body,
      };
      return NextResponse.json(errorPayload, { status: 502 });
    }

    // Forward JSON as-is; if it's text, return text
    if (typeof body === "string") {
      return new NextResponse(body, {
        status: 200,
        headers: { "content-type": contentType || "text/plain; charset=utf-8" },
      });
    }
    return NextResponse.json(body);
  } catch (error: any) {
    const isAbort = error?.name === "AbortError";
    return NextResponse.json(
      {
        message: isAbort
          ? "Timed out contacting upstream service"
          : "Unexpected server error",
        error: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}


