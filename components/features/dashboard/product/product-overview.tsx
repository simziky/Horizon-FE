"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import Image from "next/image";
import { useState } from "react";
import { Tooltip as AntTooltip, message } from "antd";
import {
  CopyIcon,
  DesktopIcon,
  GoogleIcon,
  JustifyIcon,
  RobotIcon,
  SubtitleIcon,
} from "./icons";
import AmazonIcon from "@/public/assets/svg/amazon.svg";
import Sneakers from "@/public/assets/svg/sneakers.svg";
import ProductThumbnail from "@/public/assets/images/women-shoes.png";
import { CustomSelect as Select } from "@/components/ui/AntdComponents";
import { useProductVariation } from "@/hooks/use-product-variation";

interface ProductOverviewProps {
  product?: any;
  asin: string;
  marketplaceId: number;
  isLoading?: boolean;
}

const ProductOverview = ({ product, asin, marketplaceId, isLoading }: ProductOverviewProps) => {
  const { handleVariationChange } = useProductVariation(asin, marketplaceId);
  const [copyText, setCopyText] = useState("copy");

  const handleCopyAsin = async () => {
    try {
      const textToCopy = product?.asin || asin;
      await navigator.clipboard.writeText(textToCopy);
      
      // Visual feedback
      setCopyText("copied!");
      message.success("ASIN copied to clipboard!");
      
      // Reset text after 2 seconds
      setTimeout(() => {
        setCopyText("copy");
      }, 2000);
    } catch (err) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement("textarea");
      textArea.value = product?.asin || asin;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        setCopyText("copied!");
        message.success("ASIN copied to clipboard!");
        setTimeout(() => {
          setCopyText("copy");
        }, 2000);
      } catch (fallbackErr) {
        message.error("Failed to copy ASIN");
      }
      document.body.removeChild(textArea);
    }
  };

 

  if (isLoading || !product) {
    return (
      <div className="rounded-xl bg-white">
        <div className="p-4 lg:p-5">
          <span className="bg-[#F3F4F6] px-3 py-1.5 rounded-3xl text-[#676A75] font-semibold text-sm flex items-center gap-2 w-max">
            Product Overview
            
          </span>
          <div className="mt-4 h-[200px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  // Generate options for the select dropdown
  const variationOptions =
    product?.variations?.map((variation: any) => {
      const attributeLabels = variation.attributes.map((attr: any) => `${attr.dimension}: ${attr.value}`).join(", ");

      return {
        value: variation.asin,
        label: attributeLabels || variation.asin,
      };
    }) || [];

  return (
    <div className="rounded-xl bg-white">
      <div className="p-4 lg:p-5">
        <span className="bg-[#F3F4F6] px-3 py-1.5 rounded-3xl text-[#676A75] font-semibold text-sm flex items-center gap-2 w-max">
          Product Overview
        
        </span>

        <div className="mt-4 flex flex-col sm:grid sm:grid-cols-1 lg:grid-cols-[auto_1fr] gap-4">
          <div className="bg-[#F3F4F6] w-[143px] h-[136px] flex items-center justify-center rounded-xl overflow-hidden mx-auto sm:mx-0">
            <Image
              src={product?.product_image || ProductThumbnail}
              alt="Product"
              className="size-[105px] object-cover"
              width={105}
              height={105}
              quality={90}
              unoptimized
            />
          </div>
          <div className="flex flex-col gap-3 min-w-0 flex-1">
            <AntTooltip title="Product name as displayed on Amazon marketplace." placement="top">
              <h3 className="text-[#5B656C] font-semibold text-sm cursor-help break-words line-clamp-3 overflow-hidden">
                {product?.product_name || "Product name not available"}
              </h3>
            </AntTooltip>
            
            {product?.rating && (
              <AntTooltip
                title="Average customer rating out of 5 stars. Higher ratings typically indicate better customer satisfaction and product quality."
                placement="top"
              >
                <div className="flex items-center gap-1 text-[#858F96] text-xs font-medium cursor-help flex-wrap">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`size-4 flex-shrink-0 ${
                          i < Math.floor(product.rating.stars) ? "fill-[#FFB951]" : "fill-gray-300"
                        }`}
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                      >
                        <polygon points="10,1.5 12.59,7.36 18.9,7.97 14,12.14 15.45,18.36 10,15.1 4.55,18.36 6,12.14 1.1,7.97 7.41,7.36" />
                      </svg>
                    ))}
                  </div>
                  <span className="whitespace-nowrap">{product.rating.stars}/5</span>
                  <span className="text-gray-500 whitespace-nowrap">({product.rating.count?.toLocaleString()})</span>
                </div>
              </AntTooltip>
            )}
            
            {/* Product variations dropdown */}
            <div className="w-full">
              {product?.variations?.length > 0 ? (
                <Select
                  value={asin}
                  onChange={handleVariationChange}
                  options={variationOptions}
                  style={{ width: "100%", borderRadius: 13 }}
                  placeholder="Product variations"
                  loading={isLoading}
                />
              ) : (
                <Select
                  options={[
                    {
                      value: "no_variations",
                      label: "No variations available",
                    },
                  ]}
                  style={{ width: "100%", borderRadius: 13 }}
                  placeholder="Product variations"
                  disabled
                />
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-5 bg-[#F3F4F6E0] p-4 rounded-xl relative">
          <span className="bg-[#DDE0E5] h-[45px] w-[6.8px] rounded-3xl" />
          <span className="flex-1">
            <h5 className="text-[#595959] font-medium text-sm">
              {product?.category || "Category not available"}
            </h5>
            <p className="text-xs text-[#9E9D9D]">
              <AntTooltip
                title="Amazon Standard Identification Number - A unique product identifier assigned by Amazon."
                placement="top"
              >
                <span className="cursor-help border-b border-dotted border-gray-400">
                  ASIN: {product?.asin || asin}
                </span>
              </AntTooltip>
            </p>
          </span>

          <span className="absolute bottom-3 right-3">
            <AntTooltip title="Copy ASIN to clipboard" placement="top">
              <button
                type="button"
                onClick={handleCopyAsin}
                className="bg-white text-primary text-xs flex items-center gap-1 px-2 py-1 rounded-full hover:bg-gray-50 transition-colors active:scale-95 duration-200"
              >
                <CopyIcon />
                {copyText}
              </button>
            </AntTooltip>
          </span>
        </div>
      </div>


      <div className="border-t border-[#E7EBEE] p-5 lg:px-5 flex items-center gap-2 flex-wrap">
        {/** 
        <button
          type="button"
          className="bg-[#18CB96] rounded-lg p-2"
          aria-label="Details"
        >
          <SubtitleIcon />
        </button>
        <button
          type="button"
          className="bg-[#F4F5F7] rounded-lg p-2"
          aria-label="Details"
        >
          <JustifyIcon />
        </button>

        <button
          type="button"
          className="bg-[#F4F5F7] rounded-lg p-2"
          aria-label="Details"
        >
          <Image
            src={AmazonIcon}
            alt="Amazon icon"
            className="size-5"
            unoptimized
          />
        </button>

        <button
          type="button"
          className="bg-[#F4F5F7] rounded-lg p-2"
          aria-label="Details"
        >
          <GoogleIcon />
        </button>

      */}

      
      </div>
    </div>
  );
};

export default ProductOverview;