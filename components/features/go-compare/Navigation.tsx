"use client"
import Link from "next/link"
import dynamic from "next/dynamic";
import { PiFolderPlus } from "react-icons/pi";
import { usePathname } from "next/navigation";

const CreateDropdown = dynamic(
    () => import("./CreateDropdown").then((mod) => mod.CreateDropdown),
    {
        ssr: false,
        loading: () => (
            <div className="h-[72px] rounded-lg border border-gray-200 bg-white animate-pulse" />
        ),
    }
);

export default function Navigation() {
    const pathname = usePathname();
    const isHistoryActive = pathname === "/go-compare/search-history"

    return (
        <div className="grid grid-cols-2 gap-4">
            <CreateDropdown />
            <Link href="/go-compare/search-history"
                className={`border-[#E1E0E5] border px-2 py-3 rounded-lg flex flex-col cursor-pointer gap-1.5 ${isHistoryActive ? 'bg-gray-100' : 'bg-white'}`}
            >
                <PiFolderPlus size={20} className="text-green-600" />
                <p className="text-sm text-[#2E2E37]">Quick Search History</p>
            </Link>
        </div>
    )
}

