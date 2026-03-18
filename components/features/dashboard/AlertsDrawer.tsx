"use client";
import { useState, useEffect } from "react";
import { Drawer } from "antd";
import { RxArrowTopRight } from "react-icons/rx";
import { IoClose } from "react-icons/io5";
/* eslint-disable @typescript-eslint/no-explicit-any */
interface AlertDrawerProps {
  itemAsin: string;
  productName: string;
  eligibility: boolean;
  ipIssuesCount: number;
  ipData: any; // Added prop for pre-fetched IP data
}

const AlertsDrawer = ({
  itemAsin,
  productName,
  eligibility,
  ipIssuesCount,
  ipData, // Receive IP data from parent
}: AlertDrawerProps) => {
  const [open, setOpen] = useState(false);
  const [additionalData, setAdditionalData] = useState({
    amazonShareBuyBox: 0,
    privateLabel: "No",
    size: "N/A",
    isMeltable: false,
    hasVariations: false,
    ipDescription: "No known IP issues",
    ipHarzadous: "N/A"
  });

  useEffect(() => {
    if (ipData) {
      setAdditionalData({
        amazonShareBuyBox: ipData?.amazon_share_buybox ?? 0,
        privateLabel: ipData?.private_label ?? "No",
        size: ipData?.size ?? ipData?.size_text ?? "N/A",
        isMeltable: ipData?.is_meltable ?? false,
        hasVariations: ipData?.has_variations ?? false,
        ipDescription: getFirstDescription(ipData?.ip_analysis?.description),
        ipHarzadous: ipData?.is_hazardous_or_dangerous,
      });
    }
  }, [ipData]); // Update when IP data changes

  const showDrawer = () => setOpen(true);
  const onClose = () => setOpen(false);

  const getFirstDescription = (description: string) => {
    if (!description) return "No known IP issues";
    if (typeof description === "object") {
      const descriptions = Object.values(description);
      return descriptions[0]?.toString() || "No known IP issues";
    }
    return description.toString();
  };

  return (
    <>
      <button
        type="button"
        onClick={showDrawer}
        className="border border-border bg-white px-3 py-2 rounded-xl flex gap-1 items-center font-semibold active:scale-95 duration-200 text-sm md:text-base"
      >
        See all alerts
        <RxArrowTopRight className="size-5" />
      </button>

      <Drawer
        onClose={onClose}
        open={open}
        closable={false}
        width={500}
        styles={{ body: { padding: 0 } }}
      >
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Alerts</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 border border-border"
          >
            <IoClose className="size-5 text-gray-600" />
          </button>
        </div>

        <div className="p-6">
          <div className="border border-border rounded-xl shadow-sm p-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {productName || "Product Name Not Available"}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              ASIN: <span className="font-medium">{itemAsin || "N/A"}</span>
            </p>

            {eligibility ? (
              <h4 className="text-lg font-semibold mt-4 text-green-500">
                You are authorised to sell this product
              </h4>
            ) : (
              <div className="mt-4 flex flex-col gap-4">
                <h4 className="text-lg font-semibold text-[#FF0000]">
                  You are not authorized to sell this product
                </h4>
                {ipIssuesCount > 0 && (
                  <p className="text-red-500 text-sm hidden">
                    There {ipIssuesCount === 1 ? "is" : "are"} {ipIssuesCount}{" "}
                    IP issue{ipIssuesCount !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
            )}

            <div className="mt-4 space-y-3">
              {[
                {
                  label: "Amazon Share Buy Box",
                  value: `${additionalData.amazonShareBuyBox}%`,
                },
                {
                  label: "Private Label",
                  value: additionalData.privateLabel,
                },
                {
                  label: "IP Analysis",
                  value: additionalData.ipDescription,
                },
                {
                  label: "Size",
                  value: additionalData.size,
                },
                {
                  label: "Meltable",
                  value: additionalData.isMeltable ? "Yes" : "No",
                },
                {
                  label: "Variations",
                  value: additionalData.hasVariations ? "Yes" : "No",
                },
                {
                  label: "Hazardous or Dangerous",
                  value: additionalData.ipHarzadous ? "Yes" : "No",
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className="text-sm font-medium flex flex-col gap-1"
                >
                  <p className="text-[#525252]">{item.label}</p>
                  <p className="text-[#0A0A0A] rounded-lg p-4 bg-[#FAFAFA]">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Drawer>
    </>
  );
};

export default AlertsDrawer;