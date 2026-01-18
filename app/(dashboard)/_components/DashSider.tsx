"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useLayoutEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import Logo from "@/public/assets/svg/Optisage Logo.svg";
import { UPCScannerIcon, TotanAIIcon } from "@/public/assets/svg/icons";
import { useAppSelector } from "@/redux/hooks";
// import { BsStars } from "react-icons/bs";
import {
  HiArrowPathRoundedSquare,
  HiOutlineChartBar,
  HiOutlineCog6Tooth,
  HiOutlineComputerDesktop,
  HiOutlineCreditCard,
  HiOutlineDocumentText,
  HiOutlineHome,
  HiOutlineChevronRight,
  HiMiniArrowTopRightOnSquare,
} from "react-icons/hi2";
import { TbLayoutSidebar } from "react-icons/tb";
import { Tooltip } from "antd";

// Sidebar data
const menuData = [
  { id: "1", path: "/dashboard", label: "Product Search", icon: HiOutlineHome },
  {
    id: "2",
    path: "/history",
    label: "History",
    icon: HiArrowPathRoundedSquare,
  },
  {
    id: "3",
    path: "/go-compare",
    label: "Go Compare",
    icon: HiOutlineComputerDesktop,
  },
  {
    id: "4",
    path: "/keepa",
    label: "Keepa",
    icon: HiOutlineChartBar,
    comingSoon: false,
  },
  {
    id: "5",
    path: "/totan",
    label: "Totan (AI)",
    icon: TotanAIIcon,
    comingSoon: false,
    beta: true,
  },
  { id: "6", path: "/upc-scanner", label: "UPC Scanner", icon: UPCScannerIcon },
];

const secondaryMenu = [
  { id: "7", path: "/settings", label: "Settings", icon: HiOutlineCog6Tooth },
  {
    id: "8",
    path: "",
    label: "Credit",
    icon: HiOutlineDocumentText,
    comingSoon: true,
  },
];

const billingMenu = [
  {
    id: "9",
    path: "/subscriptions",
    label: "Subscriptions",
    icon: HiOutlineCreditCard,
  },
];

const DashSider = () => {
  const pathName = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [activePath, setActivePath] = useState("");
  const router = useRouter();
  const { first_name, email } =
    useAppSelector((state) => state.api?.user) || {};

  useLayoutEffect(() => {
    setActivePath(pathName);
  }, [pathName]);

  const renderMenu = (menu: typeof menuData) =>
    menu.map((item) => {
      const isActive = activePath === item.path;

      const content = (
        <Link
          href={item.path}
          key={item.id}
          className={`flex items-center rounded-md text-base cursor-pointer relative ${
            isActive
              ? "bg-[#18CB960A] text-[#18CB96]"
              : "text-[#0F172A] hover:bg-[#F7F7F7]"
          } ${collapsed ? "justify-center px-2 py-3" : "px-4 py-3"}`}
        >
          <item.icon
            className={`size-6 ${
              isActive ? "text-[#18CB96]" : "text-inherit"
            } ${collapsed ? "mr-0" : "mr-3"} ${
              item.id === "6" ? "size-5" : ""
            }`}
          />

          {!collapsed && (
            <>
              <span className={isActive ? "text-[#18CB96]" : "text-[#787891]"}>
                {item.label}
              </span>

              {item.comingSoon && (
                <span className="ml-auto bg-primary text-white text-xs px-1.5 py-0.5 rounded-md">
                  Coming Soon
                </span>
              )}

              {item.beta && !item.comingSoon && (
                <span className="ml-auto bg-primary text-white text-xs px-1.5 py-0.5 rounded-md">
                  Beta
                </span>
              )}
            </>
          )}

          {isActive && !collapsed && (
            <HiOutlineChevronRight className="absolute right-4 text-[#18CB96] size-4" />
          )}
        </Link>
      );

      return collapsed ? (
        <Tooltip title={item.label} placement="right" key={item.id}>
          {content}
        </Tooltip>
      ) : (
        content
      );
    });

  return (
    <div className="drawer-side z-50 lg:p-2 lg:bg-[#E7EBEE]">
      <label htmlFor="my-drawer-2" className="drawer-overlay" />
      <aside
        className={`flex flex-col justify-between h-dvh overflow-y-scroll rounded-xl bg-white transition-[width] duration-300 ease-in-out ${
          collapsed ? "w-[80px]" : "w-[270px]"
        }`}
      >
        <div>
          {/* Logo + Collapse Button */}
          <div
            className={`flex items-center justify-between py-6 mx-auto ${
              collapsed ? "px-2" : "max-w-[231px]"
            }`}
          >
            {!collapsed && (
              <Link href="/dashboard">
                <Image
                  src={Logo}
                  alt="Logo"
                  className="w-[143px] h-[37px]"
                  width={187}
                  height={49}
                  quality={90}
                  priority
                />
              </Link>
            )}
            <button
              type="button"
              aria-label="Collapse Sidebar"
              // className="p-2 hover:bg-gray-100 rounded-full"
              className={`p-2 hover:bg-gray-100 rounded-full ${
                collapsed ? "mx-auto" : "mx-0"
              }`}
              onClick={() => setCollapsed((prev) => !prev)}
            >
              <TbLayoutSidebar className="size-6 text-[#0F172A]" />
            </button>
          </div>

          {/* Menu Sections */}
          <div
            className={`px-4 pb-2 pt-4 text-sm text-[#4B4B62] ${
              collapsed ? "text-transparent h-0 p-0 overflow-hidden" : ""
            }`}
          >
            Dashboard
          </div>
          <ul className="space-y-1 px-4 !text-[#787891]">{renderMenu(menuData)}</ul>

          <div
            className={`px-4 pb-2 pt-4 text-sm text-[#4B4B62] ${
              collapsed ? "text-transparent h-0 p-0 overflow-hidden" : ""
            }`}
          >
            Preferences
          </div>
          <ul className="space-y-1 px-4">{renderMenu(secondaryMenu)}</ul>

          <div
            className={`px-4 pb-2 pt-4 text-sm text-[#4B4B62] ${
              collapsed ? "text-transparent h-0 p-0 overflow-hidden" : ""
            }`}
          >
            Billing
          </div>
          <ul className="space-y-1 px-4">{renderMenu(billingMenu)}</ul>
        </div>


          {/* Support */}
          <div className="p-4 border-t border-gray-200 mt-6">
            <p className="text-sm font-medium">
              Need Help? Contact Support
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Get assistance with your account, technical issues, or any questions about optisage.
            </p>
            <button
              onClick={() => window.open("https://crm.optisage.ai/forms/ticket?styled=1", "_blank")}
              className="bg-primary hover:bg-primary-hover duration-200 text-white text-sm font-medium px-4 py-2 rounded-md w-full mt-3 active:scale-95"
            >
              Contact Support
            </button>
          </div>

        {/* Bottom Section */}
        {!collapsed && (
          <div className="p-4 mt-6">
            {/* Invite */}
            <div className="p-4 rounded-3xl border border-border h-[286px] flex flex-col justify-between">
              <span>
                <p className="bg-[#FF855126] text-[#F86425] text-xs font-semibold rounded-full px-3 py-1.5 w-max">
                  Invite & Earn
                </p>
                <h4 className="text-xl md:text-2xl font-semibold text-black mt-2">
                  Share optisage!
                </h4>
                <p className="text-sm text-[#767676] mt-6">
                  Invite other sellers to optisage & help them succeed and
                  unlock exclusive perks too!
                </p>
              </span>
              <button
                onClick={() => router.push("/referral")}
                className="bg-primary hover:bg-primary-hover duration-200 text-white text-sm font-medium px-4 py-2 rounded-xl w-full mt-3 active:scale-95"
              >
                Refer and Earn
              </button>
            </div>

            {/* Upgrade */}
            <div className="mt-10 flex flex-col justify-end bg-[#48D9AE] bg-[url(/assets/images/upgrade-bg-group-pattern.png)] bg-cover bg-no-repeat bg-center rounded-lg h-[277px] p-4">
              <Link
                href="/subscriptions"
                className="text-[#0F172A] text-lg md:text-xl xl:text-[22px] font-bold flex items-center gap-2"
              >
                Upgrade Plans
                <HiMiniArrowTopRightOnSquare size={20} />
              </Link>
              <p className="text-white font-medium text-sm mt-1">
                Plans $35 upwards
              </p>
            </div>

            {/* Profile */}
            <div className="mt-6 bg-[#E7EBEE4A] rounded-3xl flex gap-3 items-center px-4 h-[68px]">
              <div className="size-10 rounded-full overflow-hidden">
                <Image
                  src="https://avatar.iran.liara.run/public/38"
                  alt="Avatar"
                  className="size-10 object-cover rounded-full"
                  width={40}
                  height={40}
                  quality={90}
                  priority
                  unoptimized
                />
              </div>

              <div>
                <p className="text-sm font-medium text-[#0D0D0D]">
                  {first_name}
                </p>
                <p className="text-[#595959] text-xs">{email}</p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
};

export default DashSider;