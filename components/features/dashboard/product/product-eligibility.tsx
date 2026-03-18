"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState } from "react";
import { FiArrowRightCircle } from "react-icons/fi";
import { Drawer } from "antd";
import Link from "next/link";
import { Tooltip as AntTooltip } from "antd";

interface ProductEligibilityProps {
  product?: any;
  ipData?: any;
  eligibility?: boolean | string;
  setIpIssue?: number;
  asin: string;
  marketplaceId: number;
  isLoadingIpData?: boolean;
}

const ProductEligibility = ({
  product,
  ipData,
  eligibility = false,
  setIpIssue = 0,
  asin,
  marketplaceId,
  isLoadingIpData = false,
}: ProductEligibilityProps) => {
  const [open, setOpen] = useState(false);
 const amazonAuthUrl = `https://sellercentral.amazon.com/apps/authorize/consent?${new URLSearchParams(
    {
      application_id: process.env.NEXT_PUBLIC_AMAZON_CLIENT_ID!,
      state: "ourauth",
      version: "beta",
      response_type: "code",
      scope: "sellingpartnerapi::authorization",
      redirect_uri: process.env.NEXT_PUBLIC_AMAZON_REDIRECT_URI!,
    }
  ).toString()}`;

  if (isLoadingIpData) {
    return (
      <div className="h-[250px] w-full bg-[url(/assets/svg/product-eligibility.svg)] bg-cover bg-no-repeat bg-center p-4 lg:px-5 flex flex-col justify-center items-center">
        <div className="flex items-center gap-3">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
          </div>
          <span className="text-white font-medium text-sm">
            Analyzing product eligibility...
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="h-[250px] w-full bg-[url(/assets/svg/product-eligibility.svg)] bg-cover bg-no-repeat bg-center p-4 lg:px-5 flex flex-col justify-end">
        {eligibility === "unauthorized" ? (
          <AntTooltip
            title="✅ You need to connect your amazon account to see product eligibility"
            placement="top"
          >
            <p className="text-white text-sm font-medium cursor-help">
              Amazon seller not connected
            </p>
          </AntTooltip>
        ) : eligibility ? (
          <AntTooltip
            title="✅ You can list and sell this product! You have the necessary approvals and this product is not restricted (GATED) for your seller account."
            placement="top"
          >
            <p className="text-white text-sm font-medium cursor-help">
              This Product is eligible to sell
            </p>
          </AntTooltip>
        ) : (
          <AntTooltip
            title="⚠️ You can't list or sell this product yet because it's restricted (GATED) by the brand or category. You'll need approval first."
            placement="top"
          >
            <p className="text-white text-xs font-medium cursor-help max-w-[50%]">
              You are not authorized to sell this product
            </p>
          </AntTooltip>
        )}

        <div className="text-xs font-medium mt-4">
          <AntTooltip
            title={
              setIpIssue > 0
                ? "⚠️ Issues detected that prevent you from selling this product. Click 'See all alerts' below to see detailed information about each issue and potential solutions."
                : "✅ No restrictions found!"
            }
            placement="top"
          >
            <p
              className={`text-xs cursor-help ${
                setIpIssue ? "text-white" : "text-white/80"
              }`}
            >
              {setIpIssue === 1
                ? "There is 1 issue"
                : setIpIssue > 1
                ? `There are ${setIpIssue} issues`
                : "No issues found"}
            </p>
          </AntTooltip>

          <div className="mt-1.5">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="bg-white rounded-md py-1 px-2 text-[#0EAC7E] flex items-center gap-1.5 text-xs font-medium"
            >
              See all alerts
              <FiArrowRightCircle />
            </button>
          </div>
        </div>
      </div>

      <Drawer
        title="Alerts"
        placement="right"
        closable
        onClose={() => setOpen(false)}
        open={open}
        width={400}
        bodyStyle={{ padding: 0 }}
      >
        <div className="rounded-xl bg-white h-full">
          <div className="border-b border-[#E7EBEE] p-4 lg:p-5 flex items-center gap-6 justify-between">
            <span className="bg-[#F3F4F6] px-3 py-1.5 rounded-3xl text-[#676A75] font-semibold text-sm w-max">
              Alerts
            </span>

            <div className="flex items-center gap-1.5 text-white font-bold text-sm">
              <span className="bg-primary rounded-full size-8 flex items-center justify-center">
                {setIpIssue}
              </span>
              <span className="bg-[#FFC56E] opacity-15 rounded-full size-8 flex items-center justify-center" />
              <span className="bg-[#DF4740] opacity-15 rounded-full size-8 flex items-center justify-center" />
            </div>
          </div>

          <div className="p-4 lg:p-5">
            {eligibility === "unauthorized" ? (
             <div className="bg-[#FAF5EC] rounded-xl p-4 text-sm font-medium flex items-center gap-3 justify-between">
                <p className="text-[#CA7D09] max-w-[250px]">
                  Some alerts require you to be logged in to Seller Central
                </p>
                <Link
                  href={amazonAuthUrl}
                  target="_blank"
                  className="bg-white hover:bg-gray-50 transition-colors duration-200 text-black py-1.5 px-4 rounded-[10px]"
                >
                  Login
                </Link>
              </div>
              
            ) : eligibility ? (
               <h5 className=" text-primary font-semibold text-xl">
                You are authorized to sell this product
              </h5>
            ) : (
              <h5 className=" text-xl font-semibold  text-red-500">
                You are not authorized to sell this product
              </h5>
            )}

            <div className="mt-5 text-[#8C94A3] text-sm font-medium flex flex-col gap-4">
              <span className="flex gap-4 items-center justify-between">
                <p>Amazon Share Buy Box</p>
                <p className="text-[#008158]">
                  {ipData?.amazon_share_buybox
                    ? `${ipData.amazon_share_buybox}%`
                    : "Never on Listing"}
                </p>
              </span>
              <span className="flex gap-4 items-center justify-between">
                <p>Private Label</p>
                <p className="text-[#008158]">
                  {ipData?.private_label || "Unlikely"}
                </p>
              </span>
              <span className="flex gap-4 items-center justify-between">
                <p>IP Analysis</p>
                <p className="text-[#008158]">
                  {ipData?.ip_analysis?.description || "No known IP issues"}
                </p>
              </span>
              <span className="flex gap-4 items-center justify-between">
                <p>Size</p>
                <p className="text-[#008158]">
                  {ipData?.size || ipData?.size_text || "Standard Size"}
                </p>
              </span>
              <span className="flex gap-4 items-center justify-between">
                <p>Meltable</p>
                <p className="text-[#008158]">
                  {ipData?.is_meltable ? "Yes" : "No"}
                </p>
              </span>
              <span className="flex gap-4 items-center justify-between">
                <p>Variations</p>
                <p className="text-[#008158]">
                  {ipData?.has_variations ? "Yes" : "No"}
                </p>
              </span>
            </div>
          </div>
        </div>
      </Drawer>
    </>
  );
};

export default ProductEligibility;
