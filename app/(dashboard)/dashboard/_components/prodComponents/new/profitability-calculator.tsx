"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { JSX, useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from "react";
import { message, Skeleton, Tooltip as AntTooltip } from "antd";
import { debounce } from "lodash";
import { evaluate } from "mathjs";
import { CustomSlider as Slider } from "@/lib/AntdComponents";
import { useCalculateProfitablilityMutation, useGetBuyboxDetailsQuery } from "@/redux/api/productsApi";
import { useAppSelector } from "@/redux/hooks";
import type { BuyboxItem, Product, ProfitabilityData } from "../types";

interface ProfitabilityCalculatorProps {
  asin: string;
  marketplaceId: number;
  product: Product | undefined;
  isLoading?: boolean;
  onCalculationComplete?: (data: ProfitabilityData) => void;
  offers: BuyboxItem[];
  onCalculationStart?: () => void;
}

interface FeesState {
  referralFee: number;
  fulfillmentType: string;
  fullfillmentFee: number;
  closingFee: number;
  storageFee: number;
  prepFee: number;
  shippingFee: number;
  digitalServicesFee: number;
  miscFee: number;
}

interface ResponseData {
  fba: ProfitabilityData | null;
  fbm: ProfitabilityData | null;
}

interface CalculationBody {
  asin: string;
  marketplaceId: string;
  isAmazonFulfilled: boolean;
  currencyCode: string;
  storage: number;
  costPrice: string;
  salePrice: number | string;
  pointsNumber: number;
  pointsAmount: number;
}

type TabKey = "maximumCost" | "totalFees";

const tabLabels: Record<TabKey, string> = {
  maximumCost: "Maximum Cost",
  totalFees: "Total Fees",
};

const ProfitabilityCalculator = forwardRef<
  { updateCostPrice: (value: string) => void; updateSalesPrice: (value: string) => void },
  ProfitabilityCalculatorProps
>(({
  asin,
  marketplaceId,
  product,
  isLoading,
  onCalculationComplete,
  offers,
  onCalculationStart
}, ref) => {
  const [costPrice, setCostPrice] = useState<string>("");
  const [costPriceInput, setCostPriceInput] = useState<string>("");
  const [salePrice, setSalePrice] = useState<string>("");
  const [storageMonths, setStorageMonths] = useState(0);
  const [fulfillmentType, setFulfillmentType] = useState("FBA");
  const [activeTab, setActiveTab] = useState<TabKey>("maximumCost");
  const [isCalculating, setIsCalculating] = useState(false);
  const [isValidExpression, setIsValidExpression] = useState(true);

  const { currencyCode, currencySymbol } = useAppSelector((state) => state.global) || { currencyCode: "USD" };
  const [calculateProfitability] = useCalculateProfitablilityMutation();

  const { data: buyboxDetailsData, isLoading: isLoadingBuyboxDetails } = useGetBuyboxDetailsQuery({
    marketplaceId,
    itemAsin: asin,
  });

  const buyboxDetails = (buyboxDetailsData?.data?.buybox as BuyboxItem[]) ?? [];
  const buyboxWinnerPrice = buyboxDetails.find((offer) => offer.is_buybox_winner)?.listing_price ?? 0;

  const lastProfitabilityCalc = product?.last_profitability_calculation;
  const lastCostPrice = lastProfitabilityCalc?.fba?.costPrice;

  const [fees, setFees] = useState<FeesState>({
    referralFee: lastProfitabilityCalc?.fba?.referralFee || 0,
    fulfillmentType: lastProfitabilityCalc?.fba?.fulfillmentType || "FBA",
    fullfillmentFee: lastProfitabilityCalc?.fba?.fullfillmentFee || 0,
    closingFee: lastProfitabilityCalc?.fba?.closingFee || 0,
    storageFee: lastProfitabilityCalc?.fba?.storageFee || 0,
    prepFee: Number(lastProfitabilityCalc?.fba?.prepFee || 0),
    shippingFee: Number(lastProfitabilityCalc?.fba?.shippingFee || 0),
    digitalServicesFee: Number(lastProfitabilityCalc?.fba?.digitalServicesFee || 0),
    miscFee: Number(lastProfitabilityCalc?.fba?.miscFee || 0),
  });

  const [totalFees, setTotalFees] = useState(lastProfitabilityCalc?.fba?.totalFees || 0);
  const [minROI, setMinROI] = useState(lastProfitabilityCalc?.fba?.minRoi || 0);
  const [ROI, setROI] = useState(lastProfitabilityCalc?.fba?.roi || 0);
  const [minProfit, setMinProfit] = useState(lastProfitabilityCalc?.fba?.minProfit || 0);
  const [profitAmount, setProfitAmount] = useState(lastProfitabilityCalc?.fba?.profitAmount || 0);
  const [maxCost, setMaxCost] = useState(lastProfitabilityCalc?.fba?.maxCost || 0);
  const [vatOnFees, setVatOnFees] = useState(lastProfitabilityCalc?.fba?.vatOnFees || 0);
  const [discount, setDiscount] = useState(lastProfitabilityCalc?.fba?.discount || 0);
  const [profitMargin, setProfitMargin] = useState(lastProfitabilityCalc?.fba?.profitMargin || 0);
  const [breakEvenPrice, setBreakEvenPrice] = useState(lastProfitabilityCalc?.fba?.breakevenSalePrice || 0);
  const [estimatedPayout, setEstimatedPayout] = useState(lastProfitabilityCalc?.fba?.estimatedAmzPayout || 0);

  const [responseData, setResponseData] = useState<ResponseData>({
    fba: lastProfitabilityCalc?.fba || null,
    fbm: lastProfitabilityCalc?.fbm || null,
  });

  // Calculate cheapest price from offers
  const cheapestPrice = offers.length > 0 
    ? Math.min(...offers.map(offer => offer.listing_price)) 
    : 0;

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    updateCostPrice: (value: string) => {
      const { isValid, result } = evaluateExpression(value);
      if (isValid) {
        setCostPriceInput(result);
        setCostPrice(result);
        setIsValidExpression(true);
      } else {
        setCostPriceInput(value);
        setCostPrice(value);
        setIsValidExpression(false);
      }
    },
    updateSalesPrice: (value: string) => {
      setSalePrice(value);
    }
  }));

  useEffect(() => {
    if (lastCostPrice) {
      setCostPrice(lastCostPrice);
      setCostPriceInput(lastCostPrice);
    }
  }, [lastCostPrice]);

  useEffect(() => {
    // Use buybox winner price if available, otherwise use cheapest offer price
    const initialSalePrice = buyboxWinnerPrice > 0 ? buyboxWinnerPrice : cheapestPrice;
    setSalePrice(initialSalePrice.toString());
  }, [buyboxWinnerPrice, cheapestPrice]);

  useEffect(() => {
    if (lastProfitabilityCalc) {
      const data = fulfillmentType === "FBA" ? lastProfitabilityCalc.fba : lastProfitabilityCalc.fbm;
      if (data) {
        updateUIWithData(data);
      }
    }
  }, [fulfillmentType, lastProfitabilityCalc]);

  const updateUIWithData = (data: ProfitabilityData) => {
    if (!data) return;

    setFees({
      referralFee: data.referralFee,
      fulfillmentType: data.fulfillmentType,
      fullfillmentFee: data.fullfillmentFee,
      closingFee: data.closingFee,
      storageFee: data.storageFee,
      prepFee: Number(data.prepFee),
      shippingFee: Number(data.shippingFee),
      digitalServicesFee: data.digitalServicesFee,
      miscFee: Number(data.miscFee),
    });
    setROI(data.roi);
    setMinROI(data.minRoi);
    setMinProfit(data.minProfit);
    setProfitAmount(data.profitAmount);
    setMaxCost(data.maxCost);
    setTotalFees(data.totalFees);
    setVatOnFees(data.vatOnFees);
    setDiscount(data.discount);
    setProfitMargin(data.profitMargin);
    setBreakEvenPrice(data.breakevenSalePrice);
    setEstimatedPayout(data.estimatedAmzPayout);
  };

  const evaluateExpression = (expression: string): { isValid: boolean; result: string } => {
    try {
      const result = evaluate(expression);
      return { isValid: true, result: result.toString() };
    } catch (error) {
      console.error("Invalid mathematical expression", error);
      return { isValid: false, result: expression };
    }
  };

  const handleCalculateProfitability = useCallback(async () => {
    if (!costPrice || !buyboxDetails) return;

    if (isNaN(Number(costPrice))) {
      message.error("Please enter a valid number for Cost Price");
      return;
    }
    
    onCalculationStart?.();
    setIsCalculating(true);
    try {
      const body: CalculationBody = {
        asin: asin,
        marketplaceId: `${marketplaceId}`,
        isAmazonFulfilled: fulfillmentType === "FBA",
        currencyCode: currencyCode,
        storage: storageMonths,
        costPrice: costPrice,
        salePrice: salePrice ? Number(salePrice) : buyboxWinnerPrice,
        pointsNumber: 0,
        pointsAmount: 0,
      };

      const response = await calculateProfitability({ body }).unwrap();
      if (response.status === 200) {
        setResponseData({
          fba: response.data.fba,
          fbm: response.data.fbm,
        });
        const data = fulfillmentType === "FBA" ? response.data.fba : response.data.fbm;
        updateUIWithData(data);

        if (onCalculationComplete && data) {
          onCalculationComplete(data);
        }
      }
    } catch (error: any) {
      console.error("Calculation error:", error);
      message.error(error?.data?.message as string);
    } finally {
      setIsCalculating(false);
    }
  }, [
    costPrice,
    salePrice,
    storageMonths,
    fulfillmentType,
    asin,
    marketplaceId,
    currencyCode,
    buyboxWinnerPrice,
    calculateProfitability,
    buyboxDetails,
    onCalculationComplete,
  ]);

  const debouncedCalculationRef = useRef(
    debounce(() => handleCalculateProfitability(), 500)
  );

  useEffect(() => {
    debouncedCalculationRef.current = debounce(
      () => handleCalculateProfitability(), 
      500
    );
  }, [handleCalculateProfitability]);

  useEffect(() => {
    if (costPrice && !isNaN(Number(costPrice))) {
      debouncedCalculationRef.current();
    }
    
    return () => {
      debouncedCalculationRef.current.cancel();
    };
  }, [costPrice, salePrice, storageMonths, fulfillmentType]);

  const handleCostPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setCostPriceInput(inputValue);

    const { isValid, result } = evaluateExpression(inputValue);
    setIsValidExpression(isValid);

    if (isValid) {
      setCostPrice(result);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const { isValid, result } = evaluateExpression(costPriceInput);
      if (isValid) {
        setCostPriceInput(result);
        setCostPrice(result);
        setIsValidExpression(true);
      } else {
        setIsValidExpression(false);
        message.error("Invalid mathematical expression");
      }
    }
  };

  const handleSalePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSalePrice(e.target.value);
  };

  const formatValue = (value: string | number | null | undefined): string => {
    if (value === null || value === undefined) return "N/A";
    if (typeof value === "number") return `${currencySymbol}${value.toFixed(2)}`;
    return value;
  };

  const StrikethroughIfNull = ({ value, children }: { value: any; children: React.ReactNode }) => {
    if (value === null) {
      return <span style={{ textDecoration: "line-through" }}>{children}</span>;
    }
    return <>{children}</>;
  };

  if (isLoading || isLoadingBuyboxDetails) {
    return (
      <div className="rounded-xl bg-white p-3">
        <div className="p-4">
          <span className="bg-[#F3F4F6] px-3 py-1.5 rounded-3xl text-[#676A75] font-semibold text-sm w-max">
            Profitability Calculator
          </span>
        </div>
        <Skeleton active paragraph={{ rows: 6 }} />
      </div>
    );
  }

  const tabContent: Record<TabKey, JSX.Element> = {
    maximumCost: (
      <div className="px-2 flex flex-col gap-3">
        <div className="flex gap-4 items-center justify-between text-[#8C94A3] text-sm font-medium">
          <StrikethroughIfNull value={minROI}>
            <AntTooltip
              title="Minimum Return on Investment - The lowest acceptable percentage return on your investment for this product to be considered profitable."
              placement="top"
            >
              <span>Min. ROI</span>
            </AntTooltip>
          </StrikethroughIfNull>
          <StrikethroughIfNull value={minROI}>
            <span className="text-[#596375]">{minROI || 0}%</span>
          </StrikethroughIfNull>
        </div>
        <div className="flex gap-4 items-center justify-between text-[#8C94A3] text-sm font-medium">
          <StrikethroughIfNull value={minProfit}>
            <AntTooltip
              title="Minimum Profit - The smallest dollar amount of profit you should accept when selling this product."
              placement="top"
            >
              <span>Min. Profit</span>
            </AntTooltip>
          </StrikethroughIfNull>
          <StrikethroughIfNull value={minProfit}>
            <span className="text-[#596375]">{currencySymbol}{minProfit.toFixed(2)}</span>
          </StrikethroughIfNull>
        </div>
        <div className="border-t pt-2 font-semibold flex gap-4 items-center justify-between text-[#8C94A3] text-sm">
          <AntTooltip
            title="The highest price you should pay for this product to maintain your target profit margin and ROI."
            placement="top"
          >
            <span>Maximum Cost</span>
          </AntTooltip>
          <span className="text-[#596375]">{currencySymbol}{maxCost.toFixed(2)}</span>
        </div>

        {/* Additional metrics */}
        <div className="flex gap-4 items-center justify-between text-[#8C94A3] text-sm font-medium">
          <StrikethroughIfNull value={vatOnFees}>
            <AntTooltip
              title="Tax charged on the sale of your product that you need to collect and remit to tax authorities."
              placement="top"
            >
              <span>VAT on Fees</span>
            </AntTooltip>
          </StrikethroughIfNull>
          <span className="flex items-center gap-2">
            <span className="w-[33px] h-2.5 rounded-3xl bg-gradient-to-r from-[#C4B5FD] to-[#7A5FE0]" />
            <StrikethroughIfNull value={vatOnFees}>
              <span className="text-[#596375]">{formatValue(vatOnFees)}</span>
            </StrikethroughIfNull>
          </span>
        </div>
        <div className="flex gap-4 items-center justify-between text-[#8C94A3] text-sm font-medium">
          <StrikethroughIfNull value={discount}>
            <AntTooltip
              title="Any price reduction applied to the product, which reduces your overall revenue."
              placement="top"
            >
              <span>Discount</span>
            </AntTooltip>
          </StrikethroughIfNull>
          <span className="flex items-center gap-2">
            <span className="w-[45px] h-2.5 rounded-3xl bg-gradient-to-r from-[#FF8551] to-[#E94F0E]" />
            <StrikethroughIfNull value={discount}>
              <span className="text-[#596375]">{formatValue(discount)}</span>
            </StrikethroughIfNull>
          </span>
        </div>
        <div className="flex gap-4 items-center justify-between text-[#8C94A3] text-sm font-medium">
          <StrikethroughIfNull value={profitMargin}>
            <AntTooltip
              title="The percentage of profit relative to the sale price after all costs have been deducted."
              placement="top"
            >
              <span>Profit Margin</span>
            </AntTooltip>
          </StrikethroughIfNull>
          <span className="flex items-center gap-2">
            <span className="w-[68px] h-2.5 rounded-3xl bg-gradient-to-r from-[#18CB96] to-[#0D8D67]" />
            <StrikethroughIfNull value={profitMargin}>
              <span className="text-[#596375]">{profitMargin.toFixed(2)}%</span>
            </StrikethroughIfNull>
          </span>
        </div>
        <div className="flex gap-4 items-center justify-between text-[#8C94A3] text-sm font-medium">
          <StrikethroughIfNull value={breakEvenPrice}>
            <AntTooltip
              title="The minimum price you need to sell the product for to cover all costs without making or losing money."
              placement="top"
            >
              <span>Breakeven Sale Price</span>
            </AntTooltip>
          </StrikethroughIfNull>
          <span className="flex items-center gap-2">
            <span className="w-[45px] h-2.5 rounded-3xl bg-gradient-to-r from-[#1499FF] to-[#0C5C99]" />
            <StrikethroughIfNull value={breakEvenPrice}>
              <span className="text-[#596375]">{currencySymbol}{breakEvenPrice.toFixed(2)}</span>
            </StrikethroughIfNull>
          </span>
        </div>
        <div className="flex gap-4 items-center justify-between text-[#8C94A3] text-sm font-medium">
          <StrikethroughIfNull value={estimatedPayout}>
            <AntTooltip
              title="The approximate amount Amazon will pay you after deducting all fees and commissions."
              placement="top"
            >
              <span className="underline">Estimated Amz. Payout</span>
            </AntTooltip>
          </StrikethroughIfNull>
          <span className="flex items-center gap-2">
            <span className="w-16 h-2.5 rounded-3xl bg-gradient-to-r from-[#6AD8DE] to-[#397578]" />
            <StrikethroughIfNull value={estimatedPayout}>
              <span className="text-[#596375]">{currencySymbol}{estimatedPayout.toFixed(2)}</span>
            </StrikethroughIfNull>
          </span>
        </div>
      </div>
    ),
    
    totalFees: (
      <div className="px-2 flex flex-col gap-3">
        {Object.entries(fees).map(([key, value]) => {
          const feeTooltips: Record<string, string> = {
            referralFee: "Amazon's commission for selling your product on their platform, usually a percentage of the sale price.",
            fulfillmentType: "The method used to fulfill orders (FBA: Fulfilled by Amazon, FBM: Fulfilled by Merchant).",
            fullfillmentFee: "Fee charged by Amazon for picking, packing, and shipping your product (FBA only).",
            closingFee: "Fixed fee applied to certain product categories.",
            storageFee: "Fee charged for storing your product in Amazon's warehouses.",
            prepFee: "Fee for any product preparation services provided by Amazon.",
            shippingFee: "Cost to ship the product to the customer (primarily for FBM).",
            digitalServicesFee: "Fee related to digital services or content.",
            miscFee: "Any additional or miscellaneous fees not covered by other categories.",
          };

          const formattedKey = key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());

          return (
            <div key={key} className="flex gap-4 items-center justify-between text-[#8C94A3] text-sm font-medium">
              <StrikethroughIfNull value={value}>
                {feeTooltips[key] ? (
                  <AntTooltip title={feeTooltips[key]} placement="top">
                    <span className="cursor-help border-b border-dotted border-gray-400">
                      {formattedKey}
                    </span>
                  </AntTooltip>
                ) : (
                  <span>{formattedKey}</span>
                )}
              </StrikethroughIfNull>
              <StrikethroughIfNull value={value}>
                <span className="text-[#596375]">{formatValue(value)}</span>
              </StrikethroughIfNull>
            </div>
          );
        })}
        <div className="border-t pt-2 font-semibold flex gap-4 items-center justify-between text-[#8C94A3] text-sm">
          <AntTooltip
            title="The sum of all Amazon fees and expenses associated with selling this product."
            placement="top"
          >
            <span>Total Fees</span>
          </AntTooltip>
          <span className="text-[#596375]">{currencySymbol}{totalFees.toFixed(2)}</span>
        </div>
      </div>
    ),
  };

  return (
    <div className="rounded-xl bg-white">
      <div className="p-4">
        <span className="bg-[#F3F4F6] px-3 py-1.5 rounded-3xl text-[#676A75] font-semibold text-sm w-max">
          Profitability Calculator
        </span>
      </div>

      <div className="p-4 lg:p-5 text-sm flex items-center gap-5 justify-between">
        <p className="font-semibold">Fulfilment Type</p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFulfillmentType("FBA")}
            className={`rounded-3xl border px-3 py-1 text-xs font-semibold ${
              fulfillmentType === "FBA"
                ? "bg-[#FF8551] border-transparent text-white"
                : "bg-transparent border-[#D2D2D2] text-[#B0B0B1]"
            }`}
          >
            FBA
          </button>
          <button
            type="button"
            onClick={() => setFulfillmentType("FBM")}
            className={`rounded-3xl border px-3 py-1 text-xs font-semibold ${
              fulfillmentType === "FBM"
                ? "bg-[#FF8551] border-transparent text-white"
                : "bg-transparent border-[#D2D2D2] text-[#B0B0B1]"
            }`}
          >
            FBM
          </button>
        </div>
      </div>

      <div className="p-4 lg:p-5">
        <div className="text-[#676A75] text-sm flex flex-col gap-4">
          <span className="flex gap-4 items-center justify-between">
            <label htmlFor="cost_price">Cost Price</label>
            <input
              id="cost_price"
              type="text"
              placeholder={`${lastCostPrice || "0"} (e.g., 10+5*2)`}
              value={costPriceInput}
              onChange={handleCostPriceChange}
              onBlur={() => {
                const { isValid, result } = evaluateExpression(costPriceInput);
                if (isValid) {
                  setCostPriceInput(result);
                  setCostPrice(result);
                  setIsValidExpression(true);
                } else {
                  setIsValidExpression(false);
                  message.error("Invalid mathematical expression");
                }
              }}
              onKeyDown={handleKeyDown}
              className={`text-[#596375] text-sm font-normal border rounded-[10px] px-3 py-2 outline-none transition-colors ${
                isValidExpression ? "border-border focus:border-primary" : "border-red-500 focus:border-red-500"
              }`}
            />
          </span>
          {!isValidExpression && (
            <p className="text-xs text-red-500 mt-1">Please enter a valid mathematical expression</p>
          )}
          <span className="flex gap-4 items-center justify-between">
            <label htmlFor="sales_price">Sales Price</label>
            <input
              id="sales_price"
              type="number"
              value={salePrice}
              onChange={handleSalePriceChange}
              className="text-[#596375] text-sm font-normal border border-border focus:border-primary rounded-[10px] px-3 py-2 outline-none transition-colors"
            />
          </span>
        </div>

        {/* Storage Slider */}
        <div className="mt-4 flex flex-col gap-2">
          <label className="text-sm text-[#676A75]">Storage (Months): {storageMonths}</label>
          <Slider 
            value={storageMonths} 
            onChange={(value: number) => setStorageMonths(value)} 
            max={12} 
            step={1} 
          />
          <div className="flex justify-between text-sm text-gray-500">
            <span>0</span>
            <span>12</span>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-6">
          <div className="bg-[#F3F4F6] rounded-3xl p-1.5 grid grid-cols-2 gap-2">
            {Object.entries(tabLabels).map(([key, label]) => {
              const isActive = key === activeTab;

              const baseClasses =
                "text-sm font-semibold px-4 py-2 rounded-3xl transition-colors";
              const activeClasses =
                "bg-white shadow-md shadow-[#00000008] text-[#333333]";
              const inactiveClasses = "bg-transparent text-[#676A75]";

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTab(key as TabKey)}
                  className={`${baseClasses} ${
                    isActive ? activeClasses : inactiveClasses
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          {isCalculating ? (
            <div className="px-2">
              <Skeleton active paragraph={{ rows: 4 }} />
            </div>
          ) : (
            tabContent[activeTab]
          )}
        </div>
      </div>
    </div>
  );
});

ProfitabilityCalculator.displayName = "ProfitabilityCalculator";

export default ProfitabilityCalculator;