"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "sans-serif", background: "#F9FAFB" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            textAlign: "center",
          }}
        >
          {/* Inline SVG wordmark — no Next.js Image available here */}
          <div style={{ marginBottom: 40 }}>
            <svg width="140" height="36" viewBox="0 0 140 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="36" height="36" rx="8" fill="#18CB96" />
              <text x="8" y="26" fontSize="20" fontWeight="700" fill="white">O</text>
              <text x="44" y="26" fontSize="18" fontWeight="700" fill="#111827">ptisage</text>
            </svg>
          </div>

          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#EF4444",
              marginBottom: 16,
            }}
          >
            Critical Error
          </span>

          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#111827", marginBottom: 12 }}>
            Something went wrong
          </h1>

          <p style={{ fontSize: 14, color: "#6B7280", maxWidth: 360, marginBottom: 36 }}>
            A critical error occurred. Clicking &ldquo;Try again&rdquo; will
            reload the page. If the problem persists, please contact support.
          </p>

          <button
            onClick={reset}
            style={{
              padding: "10px 24px",
              borderRadius: 8,
              border: "none",
              background: "#18CB96",
              color: "white",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
