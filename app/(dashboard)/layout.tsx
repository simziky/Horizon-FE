"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  useLazyGetProfileQuery,
  useUpdateConnectAmazonMutation,
} from "@/redux/api/auth";
import dynamic from "next/dynamic";
import DashNav from "@/components/layout/DashNav";
import DashSider from "@/components/layout/DashSider";
import { Suspense, useEffect, useState } from "react";
import BrandLoader from "@/components/ui/BrandLoader";
import { message } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { setShowPackageRestrictionModal } from "@/redux/slice/authSlice";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { amazonAuthUrl } from "../(auth)/signUp/_components/Signup";

const ExpiredSubscriptionModal = dynamic(
  () => import("@/components/modals/ExpiredSubscriptionModal"),
  { ssr: false }
);
const AmazonConnectModal = dynamic(
  () => import("@/components/modals/AmazonConnectModal"),
  { ssr: false }
);
const PackageRestrictionModal = dynamic(
  () => import("@/components/modals/PackageRestrictionModal"),
  { ssr: false }
);

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
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline  = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online",  handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online",  handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

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

        {!isOnline && (
          <div className="mx-2 mb-2 flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-2.5 text-sm text-amber-800">
            <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <span>You&apos;re offline — data shown may be stale. Check your connection.</span>
          </div>
        )}
        <div className="p-2 pb-4">
          <Suspense fallback={<BrandLoader size={56} className="min-h-[60vh]" />}>
            {children}
          </Suspense>

          {isModalVisible && (
            <ExpiredSubscriptionModal
              open={isModalVisible}
              onLogout={handleLogout}
              subscribeHref="/renewSubscription"
            />
          )}

          {open && (
            <AmazonConnectModal
              open={open}
              onClose={() => setOpen(false)}
              onDontShowAgain={handleDontShowAgain}
              isSaving={isAmazonConnectLoading}
              amazonAuthUrl={amazonAuthUrl}
            />
          )}

          {showPackageRestrictionModal && (
            <PackageRestrictionModal
              open={showPackageRestrictionModal}
              onCancel={handleClosePackageRestrictionModal}
              onUpgrade={handleUpgradeSubscription}
            />
          )}
        </div>
      </div>
      <DashSider />
    </div>
  );
}
