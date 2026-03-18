"use client";

import { useState, useEffect } from "react";
import { BiChevronDown } from "react-icons/bi";
import { Dropdown, MenuProps } from "antd";
import { useRouter } from "next/navigation";
import LogoutModal from "@/components/layout/LogoutModal";
import Cookies from "js-cookie";
import { useDispatch } from "react-redux";
import { logout } from "@/redux/slice/authSlice";
import { useAppSelector } from "@/redux/hooks";

const UserProfile = () => {
  const router = useRouter();
  const [openModal, setOpenModal] = useState(false);
  const dispatch = useDispatch();
  const { first_name } = useAppSelector((state) => state.api?.user) || {};
  const initials = first_name ? first_name.charAt(0).toUpperCase() : "U";

  
  useEffect(() => {
    router.prefetch("/settings");
    router.prefetch("/monitor-list");
  }, [router]);

  const handleLogout = () => {
    Cookies.remove("optisage-token");
    router.push("/");
    dispatch(logout());
  };

  const handleMenuClick: MenuProps["onClick"] = ({ key }) => {
    if (key === "settings") {
      router.push("/settings");
    } else if (key === "logout") {
      setOpenModal(true);
    } else if (key === "monitor-list") {
      router.push("/monitor-list");
    }
  };

  const items: MenuProps["items"] = [
    {
      label: "Settings",
      key: "settings",
    },
    {
      label: "Monitor List",
      key: "monitor-list",
    },
    {
      label: "Logout",
      key: "logout",
      danger: true,
    },
  ];

  return (
    <>
      <Dropdown
        menu={{ items, onClick: handleMenuClick }}
        trigger={["click"]}
        placement="bottomRight"
      >
        <button
          type="button"
          aria-label="Profile"
          className="flex gap-1 md:gap-2 items-center"
        >
          <div className="size-10 rounded-full bg-[#18CB96] flex items-center justify-center shrink-0">
            <span className="text-white text-sm font-semibold">{initials}</span>
          </div>
          <BiChevronDown className="size-5 text-[#616977]" />
        </button>
      </Dropdown>

      <LogoutModal
        openModal={openModal}
        setOpenModal={setOpenModal}
        handleLogout={handleLogout}
      />
    </>
  );
};

export default UserProfile;
