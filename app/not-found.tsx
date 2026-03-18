import Image from "next/image";
import Link from "next/link";
import Logo from "@/public/assets/svg/Optisage Logo.svg";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <Link href="/" className="mb-10">
        <Image src={Logo} alt="Optisage Logo" width={140} height={40} priority />
      </Link>

      {/* Error badge */}
      <span className="text-xs font-semibold tracking-widest text-[#18CB96] uppercase mb-4">
        404 · Page Not Found
      </span>

      {/* Heading */}
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-3">
        We can&apos;t find that page
      </h1>

      {/* Sub-copy */}
      <p className="text-gray-500 text-sm sm:text-base text-center max-w-sm mb-10">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
        Head back to one of the links below.
      </p>

      {/* Navigation shortcuts */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/dashboard"
          className="px-5 py-2.5 rounded-lg bg-[#18CB96] text-white text-sm font-medium hover:bg-[#15b888] transition-colors"
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
