import { Metadata } from "next";
import dynamic from "next/dynamic";

const Navigation = dynamic(() => import("@/components/features/go-compare/Navigation"), {
  loading: () => (
    <div className="h-16 w-full animate-pulse rounded-lg bg-[#F3F4F6]" />
  ),
});

export const metadata: Metadata = {
  title: "Go Compare",
  description: "Go Compare",
};

export default function GoCompareLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="flex flex-col gap-5 rounded-xl bg-white p-4 lg:p-5">
      <Navigation />
      {children}
    </main>
  );
}

