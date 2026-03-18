"use client";

import * as Sentry from "@sentry/nextjs";
import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import Logo from "@/public/assets/svg/Optisage Logo.svg";

export default function Error({
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
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <Link href="/" className="mb-10">
        <Image src={Logo} alt="Optisage Logo" width={140} height={40} priority />
      </Link>

      {/* Error badge */}
      <span className="text-xs font-semibold tracking-widest text-red-500 uppercase mb-4">
        Something went wrong
      </span>

      {/* Heading */}
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-3">
        An unexpected error occurred
      </h1>

      {/* Sub-copy */}
      <p className="text-gray-500 text-sm sm:text-base text-center max-w-sm mb-10">
        Don&apos;t worry — your data is safe. You can try again or head back to
        a safe page.
      </p>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={reset}
          className="px-5 py-2.5 rounded-lg bg-[#18CB96] text-white text-sm font-medium hover:bg-[#15b888] transition-colors"
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="px-5 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Go to Dashboard
        </Link>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
