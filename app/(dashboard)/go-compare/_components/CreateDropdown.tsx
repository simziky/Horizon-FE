import { useEffect, useRef, useState } from "react";
import { BsPlus } from "react-icons/bs";
import { IoCloseOutline } from "react-icons/io5";
import { CiImport, CiSearch } from "react-icons/ci";
import { GoChevronRight } from "react-icons/go";
import { LuScanSearch } from "react-icons/lu";
import { ScanBrandsIcon } from "./icons";
import wanted from '../../../../public/assets/svg/gocompare/wanted.svg';
import Image from "next/image";
import { MdOutlineHistory } from "react-icons/md";
import { usePathname, useRouter } from "next/navigation";
import { SearchModal } from "./SearchModal";

export function CreateDropdown() {
    const [isOpen, setIsOpen] = useState(false)
    const [showModal, setShowModal] = useState<"quickSearch" | "reverseSearch" | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const toggleDropdown = () => setIsOpen(prev => !prev);
    const pathname = usePathname();
    const router = useRouter();
    const isCreateActive = pathname === "/go-compare/quick-search"
    const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
            setIsOpen(false);
        }
    };
    const toggleModal = (modalType: "quickSearch" | "reverseSearch" | null) => {
        setShowModal(prev => (prev === modalType ? null : modalType));
        toggleDropdown();
        setIsOpen(false);
    };
    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <>
            <div className="bg-white border border-gray-200 rounded-lg z-20">
                <div
                    onClick={() => setIsOpen(true)}
                    className={`border px-2 py-3 rounded-lg flex flex-col cursor-pointer gap-1.5 ${isCreateActive ? 'bg-gray-100' : 'bg-white'} `}
                >
                    <BsPlus size={20} className="text-green-600" />
                    <p className="text-sm text-[#2E2E37]">Create</p>
                </div>

                {isOpen && (
                    <div className="absolute z-10 bg-white rounded-lg shadow-2xl w-[290px] mt-1" ref={dropdownRef}>
                        <div className="px-5 pt-2">
                            <button onClick={toggleDropdown}>
                                <IoCloseOutline size={22} className="text-gray-500" />
                            </button>
                            <p className="text-gray-500 text-xs mt-1">Create</p>
                        </div>

                        <div className="p-2 pt-0">
                            <DropdownItem onClick={() => toggleModal("quickSearch")} icon={CiSearch} label="Quick Search" />
                            <DropdownItem onClick={() => toggleModal("reverseSearch")} icon={CiSearch} label="Tactical Reverse Search" />
                            <DropdownItem onClick={() => { }} icon={LuScanSearch} label="Search with Filter" disabled />
                            <DropdownItem onClick={() => { }} icon={ScanBrandsIcon} label="Scan Brands" disabled />
                            <DropdownItem onClick={() => { }} icon={WantedIcon} label="Scan Most Wanted" disabled />
                        </div>

                        <div className="py-1 px-2 border-t border-[#e1e0e5]">
                            <div className="pt-2 px-3 text-xs text-gray-500">Add</div>
                            <DropdownItem onClick={() => { }} icon={CiImport} label="Import Product Codes" disabled />
                        </div>

                        <div className="py-1 px-2 border-t border-[#e1e0e5]">
                            <div className="pt-2 px-3 text-xs text-gray-500">Modify</div>
                            <DropdownItem
                                onClick={() => {
                                    router.push("/go-compare/search-history");
                                    setIsOpen(false);
                                }}
                                icon={MdOutlineHistory} label="Search History"
                            />

                        </div>
                    </div>
                )}
            </div>

            {/* {showModal === "quickSearch" && <QuickSearchModal isOpen={true} onClose={() => toggleModal(null)} />} */}
            {/* {showModal === "reverseSearch" && <ReverseSearchModal isOpen={true} onClose={() => toggleModal(null)} />} */}
            {showModal === "quickSearch" && <SearchModal
                isOpen={true} onClose={() => toggleModal(null)}
                title="Quick Search" inputLabel="Enter ASIN or UPC"
            />}

            {showModal === "reverseSearch" && <SearchModal
                isOpen={true} onClose={() => toggleModal(null)}
                title="Tactical Reverse Search" inputLabel="Seller Id's"
            />}
        </>
    )
}

const DropdownItem = ({ onClick, icon: Icon, label, disabled }: { onClick: () => void; icon: React.ElementType; label: string; disabled?: boolean }) => (
    <button onClick={onClick}
        className={`flex items-center justify-between rounded-md w-full p-2 hover:bg-gray-100 ${disabled ? 'text-gray-300' : 'text-gray-500'}`}
    >
        <div className="flex items-center gap-2.5">
            <Icon size={20} />
            <span className="text-sm">{label}</span>
        </div>
        <GoChevronRight />
    </button>
);
const WantedIcon = () => <Image src={wanted} alt="icon" width={20} height={20} />;
