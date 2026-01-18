"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  useLazyGetProfileQuery,
  useUpdateConnectAmazonMutation,
} from "@/redux/api/auth";
import { DashNav, DashSider } from "./_components";
import { useEffect, useState } from "react";
import { message, Modal } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { setShowPackageRestrictionModal } from "@/redux/slice/authSlice";
import opxamazon from "@/public/assets/images/opXama.png";
import { GoAlert } from "react-icons/go";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import Link from "next/link";
import Image from "next/image";
import { HiMiniXMark } from "react-icons/hi2";
import { amazonAuthUrl } from "../(auth)/signUp/_components/Signup";
import package_restriction from "../../public/assets/svg/packageRestrivtion.svg";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [getProfile, {}] = useLazyGetProfileQuery();
  const [amazonConnect, { isLoading: isAmazonConnectLoading }] =
    useUpdateConnectAmazonMutation();
  const [messageApi, contextHolder] = message.useMessage();
  const dispatch = useDispatch();
  const router = useRouter();
  
  // Get modal state from Redux
  const showPackageRestrictionModal = useSelector(
    (state: any) => state.api.showPackageRestrictionModal
  );
  
  // State to manage modal visibility
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    // Clear the token cookie
    Cookies.remove("optisage-token");
    router.push("/");
  };

  const handleDontShowAgain = () => {
    amazonConnect({ notify_to_connect_amazon: false })
      .unwrap()
      .then(() => {
        setOpen(false);
        messageApi.success("Preference saved successfully");
      })
      .catch(() => {
        messageApi.error("Failed to update preference");
      });
  };

  const handleClosePackageRestrictionModal = () => {
    dispatch(setShowPackageRestrictionModal(false));
  };

  const handleUpgradeSubscription = () => {
    dispatch(setShowPackageRestrictionModal(false));
    router.push("/subscriptions");
  };

  useEffect(() => {
    getProfile({})
      .unwrap()
      .then((res) => {
        if (
          res?.data?.is_subscribed === false &&
          res?.data?.is_trial_expired === true
        ) {
          setIsModalVisible(true);
        }

        // Check if notify_to_connect_amazon is true
        if (res?.data?.notify_to_connect_amazon === true) {
          setOpen(true);
        }
      })
      .catch(() => {
        messageApi.error("failed to get Profile");
      });
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [setIsModalVisible, getProfile]);

  return (
    <div className="drawer lg:drawer-open text-black mx-auto max-w-screen-2xl">
      {contextHolder}
      <label htmlFor="my-drawer-2" className="sr-only">
        Toggle Drawer
      </label>
      <input id="my-drawer-2" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content bg-[#E7EBEE] max-h-dvh overflow-y-scroll">
        <div className="p-2">
          <DashNav />
        </div>
        <div className="p-2 pb-4">
          {children}

          {/**...........EXPIRED SUBSCRIPTION MODAL................*/}
          <Modal
            title="Subscription Alert"
            open={isModalVisible}
            footer={null}
            maskClosable={false}
            closable={false}
            centered={true}
          >
            <div className=" space-y-5">
              <div className=" flex justify-center">
                <GoAlert size={60} color="orange" />
              </div>

              <div className=" text-center">
                <h1 className=" font-semibold">
                  Please be informed that your subscription has expired. To
                  continue enjoying uninterrupted access to our services, please
                  renew your subscription as soon as possible.
                </h1>
              </div>
              <div className=" grid grid-cols-2 gap-10">
                <button
                  className="px-4 py-2 bg-gray-300 rounded-lg font-bold"
                  onClick={() => handleLogout()}
                >
                  Log Out
                </button>

                <Link
                  href={"/renewSubscription"}
                  className=" hover:text-white text-center px-4 py-2 bg-green-500 text-white rounded-lg font-bold"
                >
                  Subscribe Now
                </Link>
              </div>
            </div>
          </Modal>

          {/**...........AMAZON CONNECTION MODAL................*/}
          <Modal
            open={open}
            footer={null}
            closable={false}
            centered
            width={420}
            className="!p-0"
            styles={{ body: { padding: 0 }, content: { borderRadius: 30 } }}
          >
            <div className="bg-white rounded-3xl pt-10 overflow-hidden ">
              {/* Header with BG Color instead of image */}
              <div className=" flex flex-col items-center py-6">
                <Image src={opxamazon} alt="image" className=" h-[91px]" />
              </div>

              {/* Body */}
              <div className="p-6 text-center">
                <h2 className="text-lg font-semibold mb-3">
                  Your account is not yet connected to your Amazon seller
                  account.
                </h2>

                <p className="text-gray-600 mb-6 text-sm">
                  Please
                  <Link href={amazonAuthUrl} target="_blank">
                    <span className="text-primary underline cursor-pointer">
                      {" "}
                      log in{" "}
                    </span>
                  </Link>
                  to connect or{" "}
                  <Link
                    href={"https://sellercentral.amazon.com/"}
                    target="_blank"
                  >
                    <span className="text-primary underline cursor-pointer">
                      create an account{" "}
                    </span>
                  </Link>
                  if you do not have one, to ensure uninterrupted access to
                  optisage.
                </p>

                <button
                  onClick={handleDontShowAgain}
                  disabled={isAmazonConnectLoading}
                  className=" py-3 px-8 rounded-xl text-[#009F6D] border border-primary  hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAmazonConnectLoading
                    ? "Saving..."
                    : "Don't show this again"}
                </button>
              </div>

              {/* Custom Close Button */}
              <button
                onClick={() => setOpen(false)}
                className="absolute top-3 right-3  transition rounded-full p-1"
              >
                <HiMiniXMark size={26} />
              </button>
            </div>
          </Modal>

          {/**...........PACKAGE RESTRICTION MODAL................*/}
          <Modal
            open={showPackageRestrictionModal}
            footer={null}
            closable={false}
            centered
            width={400}
            className="!p-0"
            styles={{ body: { padding: 0 }, content: { borderRadius: 30 } }}
          >
            <div className="bg-white rounded-3xl pt-10 pb-5 overflow-hidden ">
              {/* Header with BG Color instead of image */}
              <div className=" flex flex-col items-center py-6">
                <Image
                  src={package_restriction}
                  alt="image"
                  className=" h-[91px]"
                />
              </div>

              {/* Body */}
              <div className="p-0 text-center">
                <h2 className="text-base font-normal mb-3 text-[#596375]">
                  Your current subscription package doesnt allow this feature.
                  To access, click the upgrade button to upgrade your
                  subscription package.
                </h2>

                <div className=" flex gap-3 px-5 justify-center mt-10">
                  <button
                    onClick={handleClosePackageRestrictionModal}
                    className=" w-[114px] bg-[#F2F2F2] text-[#676A75] rounded-lg py-2 hover:bg-[#F2F2F2]/40"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleUpgradeSubscription}
                    className=" 
                bg-[linear-gradient(170.84deg,#009F6D_26.22%,#128561_82.74%),linear-gradient(5.9deg,rgba(0,0,0,0)_48.66%,rgba(255,255,255,0.2)_95.01%)] hover:bg-[#128561] px-6
                bg-blend-normal text-white rounded-lg"
                  >
                    Upgrade subscription
                  </button>
                </div>
              </div>
            </div>
          </Modal>
        </div>
      </div>
      <DashSider />
    </div>
  );
}