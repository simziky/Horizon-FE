"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import Image from "next/image";
import Link from "next/link";
import { FC, ReactNode } from "react";
import { FaGoogle, FaHashtag } from "react-icons/fa6";
import { PiLightningFill } from "react-icons/pi";
import { HiMiniBell, HiMiniEye, HiMiniShoppingCart } from "react-icons/hi2";
import { TbCalculatorFilled } from "react-icons/tb";
import { IoPricetag } from "react-icons/io5";
import { AiOutlinePercentage } from "react-icons/ai";
import { Tooltip as AntTooltip, message } from "antd";
import AmazonIcon from "@/public/assets/svg/amazon-icon.svg";
import toatanAiIcon from "@/public/assets/svg/ai.svg";
import Tool1 from "@/public/assets/svg/tool-1.svg";
import Tool2 from "@/public/assets/svg/tool-2.svg";
import Tool3 from "@/public/assets/svg/tool-3.svg";
import Tool4 from "@/public/assets/svg/tool-4.svg";
import ExportToSheetsButton from "@/utils/exportGoogle";
import { useAnalyzeMutation, useLazyPurchaseQuantityQuery } from "@/redux/api/totanAi";
import { useAppDispatch } from "@/redux/hooks";
import { 
  createNewSession, 
  updateCollectedData, 
  updateConversationState,
  addMessage,
  updateAnalysisData,
  updateSessionId
} from "@/redux/slice/chatSlice";
import { DesktopIcon } from "./icons";

interface NavProps {
  product?: any;
  buyboxWinnerPrice?: number;
  lowestFBAPrice?: number;
  lowestFBMPrice?: number;
  monthlySales?: number;
  sellerCount?: number;
  fbaSellers?: number;
  fbmSellers?: number;
  stockLevels?: number;
  // New props for Totan AI functionality
  asin?: string;
  marketplaceId?: number;
  profitabilityData?: any;
  onNavigateToTotan?: () => void;
}

type NavItem = {
  href?: string;
  icon: ReactNode;
  external?: boolean;
  onClick?: () => void;
  tooltip?: string;
};

const Nav: FC<NavProps> = ({
  product,
  buyboxWinnerPrice = 0,
  lowestFBAPrice = 0,
  lowestFBMPrice = 0,
  monthlySales = 0,
  sellerCount = 0,
  fbaSellers = 0,
  fbmSellers = 0,
  stockLevels = 0,
  asin,
  marketplaceId,
  profitabilityData,
  onNavigateToTotan
}) => {
  const dispatch = useAppDispatch();
  const [analyzeMutation] = useAnalyzeMutation();
  const [getPurchaseQuantity] = useLazyPurchaseQuantityQuery();
  const [messageApi, contextHolder] = message.useMessage();

  const handleFindSupplier = () => {
    if (product?.product_name) {
      const query = encodeURIComponent(`${product.product_name} supplier`);
      window.open(`https://www.google.com/search?q=${query}`, "_blank");
    }
  };

  const handleViewOnAmazon = () => {
    if (product?.amazon_link) {
      window.open(product.amazon_link, "_blank");
    }
  };

  // Handle navigation to Totan with prefilled data (same logic as in quick-info)
  const handleNavigateToTotanWithData = async () => {
    if (!profitabilityData?.costPrice || !asin || !marketplaceId) {
      messageApi.warning('Missing required data for navigation. Please complete profitability calculation first.');
      return;
    }

    try {
      // Create new session in Redux
      dispatch(createNewSession({ firstName: undefined }));
      
      // Update collected data with current profitability calculation
      dispatch(updateCollectedData({
        asin: asin,
        costPrice: Number(profitabilityData.costPrice),
        isAmazonFulfilled: profitabilityData.fulfillmentType === "FBA"
      }));

      // Add user messages to simulate the conversation flow
      dispatch(addMessage({ 
        sender: "user", 
        text: asin 
      }));
      dispatch(addMessage({ 
        sender: "user", 
        text: profitabilityData.costPrice.toString() 
      }));
      dispatch(addMessage({ 
        sender: "user", 
        text: profitabilityData.fulfillmentType === "FBA" ? "yes" : "no"
      }));

      // Set conversation state to analyzing
      dispatch(updateConversationState("analyzing"));

      // Add analyzing message
      dispatch(addMessage({
        sender: "ai",
        text: "📊 Now analyzing your product... This may take a moment."
      }));

      // Perform the analysis
      const result = await analyzeMutation({
        asin: asin,
        costPrice: Number(profitabilityData.costPrice),
        marketplaceId: marketplaceId,
        isAmazonFulfilled: profitabilityData.fulfillmentType === "FBA"
      }).unwrap();

      if (result.success) {
        const analysis = result.data;
        dispatch(updateAnalysisData(analysis));
        dispatch(updateSessionId(analysis.session_id));
        dispatch(updateConversationState("chat_ready"));

        // Add analysis result message
        const analysisMessage = `🎉 **Analysis Complete!**

📊 **Overall Score**: ${analysis.score} (${analysis.category})


Now you can ask me any questions about this product! 💬`;

        dispatch(addMessage({
          sender: "ai",
          text: analysisMessage,
          type: "analysis"
        }));

        // Try to get purchase quantity as well
        try {
          const quantityResult = await getPurchaseQuantity(asin).unwrap();
          const quantityData = quantityResult.data;
          const quantityMessage = `📦 **Purchase Quantity Recommendations:**
• **Conservative Approach**: ${Math.round(quantityData.conservative_quantity)} units
• **Aggressive Approach**: ${Math.round(quantityData.aggressive_quantity)} units`;
          
         
        } catch (error) {
          console.error("Failed to get purchase quantity:", error);
        }

        // Navigate to Totan component
        if (onNavigateToTotan) {
          onNavigateToTotan();
        }

        messageApi.success('Analysis complete! Navigating to Totan AI...');
      }
    } catch (error) {
      console.error("Failed to perform analysis for navigation:", error);
      // Handle error - could add error message to chat
      dispatch(addMessage({
        sender: "ai",
        text: "⚠️ Sorry, I couldn't analyze this product. Please try again.",
        type: "error"
      }));
      
      if (onNavigateToTotan) {
        onNavigateToTotan();
      }
    }
  };

   const handleDuplicatePage = () => {
    try {
      // Open the current page in a new tab/window
      const currentUrl = window.location.href;
      const newWindow = window.open(currentUrl, '_blank');
      
      if (newWindow) {
        message.success("Page duplicated in new tab!");
      } else {
        // Fallback if popup is blocked
        message.warning("Please allow popups to duplicate the page");
      }
    } catch (err) {
      console.error("Error duplicating page:", err);
      message.error("Failed to duplicate page");
    }
  };

  const navItems: NavItem[] = [
    { 
      icon: <FaGoogle className="size-6 text-[#0F172A]" />,
      onClick: handleFindSupplier,
      tooltip: "Search Google for suppliers of this product to explore sourcing options"
    },
    { 
      icon: <TbCalculatorFilled className="size-6 text-[#0F172A]" />,
      tooltip: "Export this product's information to a Google Sheet for further analysis or record keeping"
    },
    {
      icon: (
        <Image
          src={AmazonIcon}
          alt="Amazon icon"
          width={32}
          height={32}
          className="size-6"
        />
      ),
      external: true,
      onClick: handleViewOnAmazon,
      tooltip: "Visit the product's Amazon page to see listings, reviews, and more details"
    },
  ];

  const NavIcon: FC<NavItem & { isCalculator?: boolean }> = ({ 
    href, 
    icon, 
    external = false, 
    onClick,
    tooltip,
    isCalculator = false
  }) => {
    const content = (
      <div
        onClick={onClick}
        className="size-12 flex items-center justify-center rounded-lg bg-[#F3F4F6] cursor-pointer hover:bg-gray-200 transition-colors"
      >
        {isCalculator && product ? (
          <ExportToSheetsButton
            productData={{
              asin: product?.asin,
              title: product?.product_name,
              brand: product?.vendor,
              category: product?.category,
              upcEan: product?.upc || product?.ean,
              buyBoxPrice: buyboxWinnerPrice,
              lowestFBAPrice: lowestFBAPrice,
              lowestFBMPrice: lowestFBMPrice,
              monthlySales: monthlySales,
              sellerCount: sellerCount,
              fbaSellers: fbaSellers,
              fbmSellers: fbmSellers,
              stockLevels: stockLevels,
            }}
            currencySymbol="$"
          />
        ) : (
          icon
        )}
      </div>
    );

    if (tooltip) {
      return (
        <AntTooltip title={tooltip} placement="top">
          {content}
        </AntTooltip>
      );
    }

    return content;
  };

  return (
    <>
      {contextHolder}
      <div className="rounded-xl bg-white p-4 lg:p-5 flex flex-col lg:flex-row justify-between gap-4 md:gap-8">
        <div>
          <p className="mb-2 text-[#676A75] text-xs font-medium">Navigation</p>
          <div className="flex items-center gap-2 flex-wrap">
            {navItems.map((item, idx) => (
              <NavIcon 
                key={idx} 
                {...item} 
                isCalculator={idx === 1} // TbCalculatorFilled is at index 1
              />
            ))}
            
            {/* Totan AI Icon with same functionality as analysis box */}
            <AntTooltip
              title={
                profitabilityData?.costPrice 
                  ? "Launch Totan AI analysis with your profitability data to get detailed insights and recommendations"
                  : "Complete profitability calculation first to access Totan AI analysis"
              }
              placement="top"
            >
              <Link href={profitabilityData?.costPrice ? "/totan" : "#"}>
                <div
                  onClick={profitabilityData?.costPrice ? handleNavigateToTotanWithData : undefined}
                  className={`size-12 flex items-center justify-center rounded-lg transition-colors ${
                    profitabilityData?.costPrice 
                      ? "bg-[#F3F4F6] cursor-pointer hover:bg-primary hover:brightness-110" 
                      : "bg-gray-100 cursor-not-allowed opacity-50"
                  }`}
                  title={
                    profitabilityData?.costPrice 
                      ? "Click to open detailed analysis in Totan chat"
                      : "Complete profitability calculation to enable AI analysis"
                  }
                >
                  <Image
                    src={toatanAiIcon}
                    alt="Totan AI icon"
                    width={32}
                    height={32}
                    className="size-6"
                  />
                </div>
              </Link>
               
            </AntTooltip>
             <AntTooltip title="Duplicate page in new tab" placement="top">
          <button
            type="button"
            onClick={handleDuplicatePage}
            className="bg-[#F4F5F7] rounded-lg p-3 hover:bg-[#E7EBEE] transition-colors"
            aria-label="Duplicate page"
          >
            <DesktopIcon />
          </button>
        </AntTooltip>
          </div>
        </div>

        <div className="bg-[#FAFBFC] flex flex-col md:flex-row md:items-center justify-between gap-4 w-full max-w-[327px] p-4 pr-9 bg-[url(/assets/svg/worktools-bg.svg)] bg-cover bg-no-repeat bg-center rounded-lg shadow-sm">
          <div className="flex flex-col gap-2">
            <p className="text-[#676A75] font-semibold text-xs">
              Your WorkTools:
            </p>
            <div className="flex gap-1">
              <Image
                src={Tool1}
                alt="Tool"
                className="size-8"
                width={24}
                height={23}
                quality={90}
                unoptimized
              />
              <Image
                src={Tool2}
                alt="Tool"
                className="size-8"
                width={24}
                height={24}
                quality={90}
                unoptimized
              />
              <Image
                src={Tool3}
                alt="Tool"
                className="size-8"
                width={31}
                height={28}
                quality={90}
                unoptimized
              />
              <Image
                src={Tool4}
                alt="Tool"
                className="size-8"
                width={22}
                height={21}
                quality={90}
                unoptimized
              />
            </div>
          </div>

          <span className="flex gap-3 items-center">
            {/** 
            <Link href="" className="text-[10px] text-[#5B656C] hover:underline">
              How to use <br />
              Watch Tutorial
            </Link>
            */}
            <svg
              width="17"
              height="17"
              viewBox="0 0 17 17"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="8.5" cy="8.5" r="8.5" fill="#F5473F" />
              <path
                d="M11.25 8.06699C11.5833 8.25944 11.5833 8.74056 11.25 8.93301L7.5 11.0981C7.16667 11.2905 6.75 11.05 6.75 10.6651L6.75 6.33494C6.75 5.95004 7.16667 5.70947 7.5 5.90192L11.25 8.06699Z"
                fill="white"
              />
            </svg>
          </span>
        </div>
      </div>
    </>
  );
};

export default Nav;