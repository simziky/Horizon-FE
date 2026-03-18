"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { BiChevronRight } from "react-icons/bi";
import {  BSRIcon, PriceTagIcon, ProductSalesIcon, MaximumCostIcon, ROIIcon } from "../icons";
import Image from "next/image";
import { Tooltip as AntTooltip, message } from "antd";
import { useState, forwardRef, useImperativeHandle, useEffect, useRef } from "react";
import { debounce } from "lodash";
import AmazonIcon from "@/public/assets/svg/amazon-icon.svg"
import { useAnalyzeMutation, useLazyPurchaseQuantityQuery } from "@/redux/api/totanAi"
import { useAppDispatch } from "@/redux/hooks"
import { 
  createNewSession, 
  updateCollectedData, 
  updateConversationState,
  addMessage,
  updateAnalysisData,
  updateSessionId
} from "@/redux/slice/chatSlice"
import Link from "next/link"
import SalesAnalytics from "./sales-analytics";

type Tab = "info" | "totan" | "analytics";

interface AnalysisData {
  session_id: string
  score: number
  category: string
  breakdown: {
    amazon_on_listing: number
    fba_sellers: number
    buy_box_eligible: number
    variation_listing: number
    sales_rank_impact: number
    estimated_demand: number
    offer_count: number
    profitability: number
  }
  roi: number
  profit_margin: number
  monthly_sales: number
}

interface PurchaseQuantityData {
  conservative_quantity: number
  aggressive_quantity: number
}

interface Product {
  last_profitability_calculation?: {
    fba?: any
  }
  extra?: any
}

interface BuyboxDetails {
  extra?: any
}

interface QuickInfoProps {
  product?: Product
  buyboxDetails?: BuyboxDetails
  asin: string
  marketplaceId: number
  onNavigateToTotan?: () => void
  onCostPriceChange?: (value: string) => void
  onSalesPriceChange?: (value: string) => void
}

const QuickInfo = forwardRef<{ handleProfitabilityUpdate: (data: any) => void }, QuickInfoProps>(({ 
  product, 
  buyboxDetails, 
  asin, 
  marketplaceId, 
  onNavigateToTotan,
  onCostPriceChange,
  onSalesPriceChange
}, ref) => {
  const dispatch = useAppDispatch()
  const [activeTab, setActiveTab] = useState<Tab>("info");
  const [latestProfitCalc, setLatestProfitCalc] = useState<any>(product?.last_profitability_calculation?.fba)
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null)
  const [purchaseQuantityData, setPurchaseQuantityData] = useState<PurchaseQuantityData | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isLoadingQuantity, setIsLoadingQuantity] = useState(false)
  const [messageApi, contextHolder] = message.useMessage();

  // Local state for editable fields
  const [editableCostPrice, setEditableCostPrice] = useState<string>("")
  const [editableSalesPrice, setEditableSalesPrice] = useState<string>("")

  // RTK Query hooks
  const [analyzeMutation] = useAnalyzeMutation()
  const [getPurchaseQuantity] = useLazyPurchaseQuantityQuery()

  // Get the data from the correct sources
  const extra = buyboxDetails?.extra || product?.extra
  const profitabilityCalc = latestProfitCalc || product?.last_profitability_calculation?.fba

  // Create debounced handlers for triggering calculations
  const debouncedCostPriceUpdate = useRef(
    debounce((value: string) => {
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue > 0) {
        onCostPriceChange?.(value);
      }
    }, 500)
  ).current;

  const debouncedSalesPriceUpdate = useRef(
    debounce((value: string) => {
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue > 0) {
        onSalesPriceChange?.(value);
      }
    }, 500)
  ).current;

  // Initialize editable values when profitability calc changes
  useEffect(() => {
    if (profitabilityCalc?.costPrice) {
      setEditableCostPrice(profitabilityCalc.costPrice)
    }
    if (profitabilityCalc?.salesPrice || extra?.buybox_price) {
      setEditableSalesPrice(profitabilityCalc?.salesPrice || extra?.buybox_price)
    }
  }, [profitabilityCalc, extra])

  // Reset states when ASIN changes
  useEffect(() => {
    setAnalysisData(null)
    setPurchaseQuantityData(null)
  }, [asin])

  // Reset states when product changes
  useEffect(() => {
    setLatestProfitCalc(product?.last_profitability_calculation?.fba)
  }, [product])

  // Cleanup debounced functions on unmount
  useEffect(() => {
    return () => {
      debouncedCostPriceUpdate.cancel();
      debouncedSalesPriceUpdate.cancel();
    };
  }, [debouncedCostPriceUpdate, debouncedSalesPriceUpdate]);

  // Expose the update function to the parent component
  useImperativeHandle(ref, () => ({
    handleProfitabilityUpdate: (data: any) => {
      setLatestProfitCalc(data)
      // Update local editable values
      if (data?.costPrice) {
        setEditableCostPrice(data.costPrice)
      }
      if (data?.salesPrice) {
        setEditableSalesPrice(data.salesPrice)
      }
      // Trigger analysis when profitability is updated with the new data
      if (data && activeTab === "totan") {
        performAnalysis(data)
      }
    },
  }))

  // Handle cost price change with debounced calculation trigger
  const handleCostPriceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEditableCostPrice(value);
    
    // Trigger debounced calculation as user types
    debouncedCostPriceUpdate(value);
  }

  const handleCostPriceBlur = () => {
    const numValue = parseFloat(editableCostPrice);
    if (isNaN(numValue) || numValue <= 0) {
      messageApi.error("Please enter a valid cost price");
      // Reset to last valid value
      setEditableCostPrice(profitabilityCalc?.costPrice || "0");
    }
  }

  // Handle sales price change with debounced calculation trigger
  const handleSalesPriceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEditableSalesPrice(value);
    
    // Trigger debounced calculation as user types
    debouncedSalesPriceUpdate(value);
  }

  const handleSalesPriceBlur = () => {
    const numValue = parseFloat(editableSalesPrice);
    if (isNaN(numValue) || numValue <= 0) {
      messageApi.error("Please enter a valid sales price");
      // Reset to last valid value
      setEditableSalesPrice(profitabilityCalc?.salesPrice || extra?.buybox_price || "0");
    }
  }

  // Handle navigation to Totan with prefilled data
  const handleNavigateToTotanWithData = async () => {
    if (!profitabilityCalc?.costPrice || !asin || !marketplaceId) {
     messageApi.warning('Missing required data for navigation')
      return
    }

    try {
      // Create new session in Redux
      dispatch(createNewSession({ firstName: undefined }))
      
      // Update collected data with current profitability calculation
      dispatch(updateCollectedData({
        asin: asin,
        costPrice: Number(profitabilityCalc.costPrice),
        isAmazonFulfilled: profitabilityCalc.fulfillmentType === "FBA"
      }))

      // Add user messages to simulate the conversation flow
      dispatch(addMessage({ 
        sender: "user", 
        text: asin 
      }))
      dispatch(addMessage({ 
        sender: "user", 
        text: profitabilityCalc.costPrice.toString() 
      }))
      dispatch(addMessage({ 
        sender: "user", 
        text: profitabilityCalc.fulfillmentType === "FBA" ? "yes" : "no"
      }))

      // Set conversation state to analyzing
      dispatch(updateConversationState("analyzing"))

      // Add analyzing message
      dispatch(addMessage({
        sender: "ai",
        text: "Now analyzing your product... This may take a moment."
      }))

      // Perform the analysis
      const result = await analyzeMutation({
        asin: asin,
        costPrice: Number(profitabilityCalc.costPrice),
        marketplaceId: marketplaceId,
        isAmazonFulfilled: profitabilityCalc.fulfillmentType === "FBA"
      }).unwrap()

      if (result.success) {
        const analysis = result.data
        dispatch(updateAnalysisData(analysis))
        dispatch(updateSessionId(analysis.session_id))
        dispatch(updateConversationState("chat_ready"))

        // Add analysis result message
        const analysisMessage = `Analysis Complete!

Overall Score: ${analysis.score} (${analysis.category})

Now you can ask me any questions about this product!`

        dispatch(addMessage({
          sender: "ai",
          text: analysisMessage,
          type: "analysis"
        }))

        // Try to get purchase quantity as well
        try {
          const quantityResult = await getPurchaseQuantity(asin).unwrap()
          const quantityData = quantityResult.data
        } catch (error) {
          console.error("Failed to get purchase quantity:", error)
        }

        // Navigate to Totan component
        if (onNavigateToTotan) {
          onNavigateToTotan()
        }
      }
    } catch (error) {
      console.error("Failed to perform analysis for navigation:", error)
      // Handle error - could add error message to chat
      dispatch(addMessage({
        sender: "ai",
        text: "Sorry, I couldn't analyze this product. Please try again.",
        type: "error"
      }))
      
      if (onNavigateToTotan) {
        onNavigateToTotan()
      }
    }
  }

  // Perform analysis
  const performAnalysis = async (updatedProfitData?: any) => {
    if (!asin || !marketplaceId) {
      messageApi.warning('Missing asin or marketplaceId, skipping analysis')
      return
    }

    // Use updated profit data if provided, otherwise use existing profitability calc
    const currentProfitData = updatedProfitData || profitabilityCalc
    
    const costPrice = currentProfitData?.costPrice
    const fulfillmentType = currentProfitData?.fulfillmentType || "FBA"
    
    if (!costPrice) {
      messageApi.warning('No cost price available, skipping analysis')
      return
    }

    setIsAnalyzing(true)
    try {
      const payload = {
        asin,
        costPrice: Number(costPrice),
        marketplaceId,
        isAmazonFulfilled: fulfillmentType === "FBA"
      }

      const response = await analyzeMutation(payload).unwrap()
      
      if (response.success) {
        setAnalysisData(response.data)
        messageApi.success('Analysis completed successfully!')
      }
    } catch (error) {
      console.error("Analysis error:", error)
      messageApi.error('Failed to analyze product. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Fetch purchase quantity
  const fetchPurchaseQuantity = async () => {
    if (!asin) {
      messageApi.warning('No ASIN provided, skipping purchase quantity fetch')
      return
    }

    if (isLoadingQuantity) {
      messageApi.warning('Already loading purchase quantity, skipping')
      return
    }

    setIsLoadingQuantity(true)
    try {
      const response = await getPurchaseQuantity(asin).unwrap()
      
      if (response.success) {
        setPurchaseQuantityData(response.data)
        messageApi.success('Purchase quantity data loaded successfully!')
      } else {
        messageApi.error('Purchase quantity  unsuccessful response:', response)
      }
    } catch (error) {
      messageApi.error(`Purchase quantity error`)
    } finally {
      setIsLoadingQuantity(false)
    }
  }

  // Manual reload function for both analysis and purchase quantity
  const handleReload = async () => {
    if (!profitabilityCalc?.costPrice || !asin || !marketplaceId) {
      messageApi.warning('Missing required data for reload. Please ensure profitability calculation is completed.')
      return
    }

    messageApi.info('Refreshing analysis and purchase quantity data...')
    
    // Clear existing data first
    setAnalysisData(null)
    setPurchaseQuantityData(null)
    
    // Trigger both operations
    await Promise.all([
      performAnalysis(),
      fetchPurchaseQuantity()
    ])
  }

  // Trigger analysis and purchase quantity fetch when switching to totan tab
  useEffect(() => {
    if (activeTab === "totan" && asin && marketplaceId) {
      // Trigger analysis if profitability calculation exists
      if (profitabilityCalc?.costPrice) {
        performAnalysis()
      }
      
      // Always fetch purchase quantity when switching to totan tab (if not already loading)
      fetchPurchaseQuantity()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, asin, marketplaceId])

  // Re-run analysis when profitability calculation changes and totan tab is active
  useEffect(() => {
    if (activeTab === "totan" && latestProfitCalc?.costPrice) {
      performAnalysis(latestProfitCalc)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestProfitCalc, activeTab])

  // Get score circle properties
  const getScoreProperties = (score: number, category: string) => {
    const normalizedScore = Math.max(0, Math.min(10, score))
    const percentage = (normalizedScore / 10) * 100
    const strokeDasharray = `${percentage}, 100`
    
    let color = "#10B981"
    let bgColor = "#F0FDF4"
    
    if (category.toLowerCase() === "low") {
      color = "#EF4444"
      bgColor = "#FEF2F2"
    } else if (category.toLowerCase() === "medium" || category.toLowerCase() === "average") {
      color = "#F59E0B"
      bgColor = "#FFFBEB"
    } else if (category.toLowerCase() === "high" || category.toLowerCase() === "above average") {
      color = "#10B981"
      bgColor = "#F0FDF4"
    }

    return { strokeDasharray, color, bgColor }
  }

  // Get ROI text color based on roiIsOk
  const getRoiTextColor = () => {
    if (profitabilityCalc?.buying_criteria?.roiIsOk === true) {
      return "text-green-600"
    } else if (profitabilityCalc?.buying_criteria?.roiIsOk === false) {
      return "text-red-600"
    }
    return ""
  }

  // Get Profit text color based on profitIsOk
  const getProfitTextColor = () => {
    if (profitabilityCalc?.buying_criteria?.profitIsOk === true) {
      return "text-green-600"
    } else if (profitabilityCalc?.buying_criteria?.profitIsOk === false) {
      return "text-red-600"
    }
    return ""
  }

  // Get ROI tooltip message based on criteria
  const getRoiTooltipMessage = () => {
    const roi = profitabilityCalc?.roi ?? 0
    const minRoi = profitabilityCalc?.minRoi ?? 0
    
    if (profitabilityCalc?.buying_criteria?.roiIsOk === true) {
      return `Excellent ROI! This product's ${roi}% return exceeds your minimum requirement of ${minRoi}%, making it a profitable investment that meets your buying criteria.`
    } else if (profitabilityCalc?.buying_criteria?.roiIsOk === false) {
      return `ROI Below Target: This product's ${roi}% return is below your minimum requirement of ${minRoi}%. Consider finding a lower cost price or look for other products that meet your ROI criteria.`
    }
    return "Return on Investment - The percentage return you'll earn on your initial investment in this product."
  }

  // Get Profit tooltip message based on criteria
  const getProfitTooltipMessage = () => {
    const profitAmount = profitabilityCalc?.profitAmount ?? 0
    const profitMargin = profitabilityCalc?.profitMargin ?? 0
    const minProfit = profitabilityCalc?.minProfit ?? 0
    
    if (profitabilityCalc?.buying_criteria?.profitIsOk === true) {
      return `Great Profit! This product generates $${profitAmount.toFixed(2)} (${profitMargin.toFixed(0)}%) which exceeds your minimum profit requirement of $${minProfit.toFixed(2)}, making it a solid choice for your business.`
    } else if (profitabilityCalc?.buying_criteria?.profitIsOk === false) {
      return `Profit Below Target: This product's profit of $${profitAmount.toFixed(2)} (${profitMargin.toFixed(0)}%) is below your minimum requirement of $${minProfit.toFixed(2)}. Consider negotiating a better cost price or look for higher-margin products.`
    }
    return "The total profit amount in dollars and profit margin percentage you can expect from selling this product."
  }

  // Get Maximum Cost tooltip message based on criteria
  const getMaxCostTooltipMessage = () => {
    const maxCost = profitabilityCalc?.maxCost ?? 0
    const minRoi = profitabilityCalc?.minRoi ?? 0
    const minProfit = profitabilityCalc?.minProfit ?? 0
    
    if (maxCost > 0) {
      return `Smart Buying Guide: Based on your criteria (${minRoi}% min ROI, $${minProfit.toFixed(2)} min profit), don't pay more than $${maxCost.toFixed(2)} for this product. This ensures you'll meet your profit targets while maintaining your desired return on investment.`
    }
    return "The highest price you should pay for this product to maintain your target profit margin and ROI."
  }

  const scoreProperties = analysisData ? getScoreProperties(analysisData.score, analysisData.category) : null

  return (
    <>
      {contextHolder}
      <div className="rounded-xl bg-white h-full">
        <div className="border-b border-[#E7EBEE] py-4 px-3 lg:p-5 flex items-center gap-1.5">
          <span
            onClick={() => setActiveTab("info")}
            className={`${
              activeTab === "info"
                ? "bg-primary text-white"
                : "bg-[#F3F4F6] text-[#676A75]"
            } cursor-pointer px-2 py-1.5 rounded-3xl  font-semibold text-sm w-max`}
          >
            Quick Info
          </span>
          <span 
          onClick={() => setActiveTab("analytics")}
         className={`${
              activeTab === "analytics"
                ? "bg-primary text-white"
                : "bg-[#F3F4F6] text-[#676A75]"
            } cursor-pointer  px-2 py-1.5 rounded-3xl  font-semibold text-sm w-max`}>
            Sales Analytics
          </span>
          <span
            onClick={() => setActiveTab("totan")}
            className={`${
              activeTab === "totan"
                ? "bg-primary text-white"
                : "bg-[#F3F4F6] text-[#676A75]"
            } cursor-pointer  px-2 py-1.5 rounded-3xl  font-semibold text-sm w-max`}
          >
            Totan (AI)
          </span>
        </div>

        <div className="p-2 lg:p-2">
          {activeTab === "info" && (
            <div>
              {/* BSR, Est. Sales, Max Cost - 3 column grid */}
              <div className="mt-5 border border-[#E0E4EE] text-[#8E949F] rounded-[10px] text-xs flex divide-x divide-[#E0E4EE]">
                <div className="flex-1 flex flex-col gap-0.5 p-4">
                  <span className="flex items-center gap-1">
                    BSR
                    <span className="bg-[#FF8551] w-[12.5px] h-2 rounded-full" />
                  </span>
                  <p className="text-[#596375] font-bold text-base">{extra?.bsr ?? "0"}</p>
                </div>
                <div className="flex-1 flex flex-col gap-0.5 p-4 bg-[#FAFBFB]">
                  <span className="flex items-center gap-1">
                    Est. Sales
                    <span className="bg-[#3895F9] w-[12.5px] h-2 rounded-full" />
                  </span>
                  <p className="text-[#596375] font-bold text-base">
                    {extra?.monthly_est_product_sales?.toLocaleString() ?? "0"}/<span className="text-[#939EB2]">mo</span>
                  </p>
                </div>
                <div className="flex-1 flex flex-col gap-0.5 p-4">
                  <span className="flex items-center gap-1">
                    Max Cost
                    <span className="bg-primary w-[12.5px] h-2 rounded-full" />
                  </span>
                  <AntTooltip
                    title={getMaxCostTooltipMessage()}
                    placement="top"
                  >
                    <p className="text-[#596375] font-bold text-base cursor-help">
                      $ {profitabilityCalc?.maxCost?.toFixed(2) ?? "0.00"}
                    </p>
                  </AntTooltip>
                </div>
              </div>

              {/* Buy Box Price, Product Sales - 2 column grid */}
              <div className="mt-5 border border-[#E0E4EE] text-[#8E949F] rounded-[10px] text-xs flex divide-x divide-[#E0E4EE]">
                <div className="flex-1 flex flex-col gap-0.5 p-4">
                  <span className="flex items-center gap-1">
                    <PriceTagIcon  />
                    Buy Box Price
                  </span>
                  <p className="text-[#596375] font-bold text-base">$ {extra?.buybox_price ?? "0"}</p>
                </div>
                <div className="flex-1 flex flex-col gap-0.5 p-4 bg-[#FAFBFB]">
                  <span className="flex items-center gap-1">
                    <ProductSalesIcon  />
                    Product Sales
                  </span>
                  <p className="text-[#596375] font-bold text-base">
                    {extra?.monthly_est_product_sales?.toLocaleString() ?? "0"}/<span className="text-[#939EB2]">mo</span>
                  </p>
                </div>
              </div>

              {/* Cost Price and Sales Price inputs - NOW WITH AUTO-CALCULATION */}
              <div className="mt-5 text-[#676A75] font-medium text-xs grid grid-cols-2 gap-4">
                <span className="flex flex-col gap-2">
                  <label htmlFor="cost_price">Cost Price</label>
                  <input
                    id="cost_price"
                    type="number"
                    step="0.01"
                    value={editableCostPrice}
                    onChange={handleCostPriceInputChange}
                    onBlur={handleCostPriceBlur}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.currentTarget.blur()
                      }
                    }}
                    className="text-[#596375] text-sm font-normal border border-border focus:border-primary rounded-[10px] px-3 py-2 outline-none transition-colors"
                    placeholder="Enter cost price"
                  />
                </span>
                <span className="flex flex-col gap-2">
                  <label htmlFor="sales_price">Sales Price</label>
                  <input
                    id="sales_price"
                    type="number"
                    step="0.01"
                    value={editableSalesPrice}
                    onChange={handleSalesPriceInputChange}
                    onBlur={handleSalesPriceBlur}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.currentTarget.blur()
                      }
                    }}
                    className="text-[#596375] text-sm font-normal border border-border focus:border-primary rounded-[10px] px-3 py-2 outline-none transition-colors"
                    placeholder="Enter sales price"
                  />
                </span>
              </div>

              {/* Profit, Profit %, ROI - 3 column grid */}
              <div className="mt-5 bg-[#FAFBFB] border border-[#E0E4EE] text-[#8E949F] rounded-[10px] text-xs flex divide-x divide-[#E0E4EE]">
                <div className="flex-1 flex flex-col gap-0.5 p-4">
                  <span className="flex items-center gap-1">
                    Profit
                    <span className="bg-primary w-[12.5px] h-2 rounded-full" />
                  </span>
                  <AntTooltip
                    title={getProfitTooltipMessage()}
                    placement="top"
                  >
                    <p className={`font-bold text-base cursor-help ${getProfitTextColor()}`}>
                      $ {profitabilityCalc?.profitAmount?.toFixed(2) ?? "0.00"}
                    </p>
                  </AntTooltip>
                </div>
                <div className="flex-1 flex flex-col gap-0.5 p-4 ">
                  <span className="flex items-center gap-1">
                    Profit (%)
                    <span className="bg-[#3895F9] w-[12.5px] h-2 rounded-full" />
                  </span>
                  <AntTooltip
                    title={getProfitTooltipMessage()}
                    placement="top"
                  >
                    <p className={`font-bold text-base cursor-help ${getProfitTextColor()}`}>
                      {profitabilityCalc?.profitMargin?.toFixed(1) ?? "0.0"}%
                    </p>
                  </AntTooltip>
                </div>
                <div className="flex-1 flex flex-col gap-0.5 p-4">
                  <span className="flex items-center gap-1">
                    ROI
                    <span className="bg-[#FF8551] w-[12.5px] h-2 rounded-full" />
                  </span>
                  <AntTooltip
                    title={getRoiTooltipMessage()}
                    placement="top"
                  >
                    <p className={`font-bold text-base cursor-help ${getRoiTextColor()}`}>
                      {profitabilityCalc?.roi?.toFixed(1) ?? "0.0"}%
                    </p>
                  </AntTooltip>
                </div>
              </div>
            </div>
          )}

          {activeTab === "totan" && (
            <div className="flex flex-col gap-3">
              {!profitabilityCalc?.costPrice ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className=" rounded-lg p-6 max-w-md">
                    <div className="text-primary mb-3">
                      <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 14h.01M12 11h.01M12 7V4a1 1 0 00-1-1H9a1 1 0 00-1 1v3M5 7h14l-1 14H6L5 7z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Profitability Calculation Required
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      To access Totan AI analysis, please complete the profitability calculation first. 
                      Enter your cost price and other details in the calculator above.
                    </p>
                    <div className="bg-primary/20 border border-primary rounded-md p-3">
                      <p className="text-xs text-black">
                        The AI analysis uses your profitability data to provide personalized insights and recommendations.
                      </p>
                    </div>
                  </div>
                </div>
              ) : isAnalyzing ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-2 text-sm text-gray-600">Analyzing product...</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="relative size-32">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-[#F3F4F6]"
                          stroke="currentColor"
                          strokeWidth="3"
                          fill="none"
                          d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-xs">
                        <span className="text-[10px] text-[#676A75] font-medium uppercase text-center">
                          <p>{analysisData?.category.toUpperCase() || "ANALYZING"}</p>
                        </span>
                        <span className="text-lg font-semibold text-[#060606]">
                          {analysisData?.score?.toFixed(1) || "0.0"}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Link href={`/totan`}>
                        <div 
                          className="bg-[#F3F4F6] rounded-lg p-3 text-[#676A75] text-sm hover:bg-primary hover:text-white cursor-pointer transition-colors duration-200"
                          onClick={handleNavigateToTotanWithData}
                          title="Click to open detailed analysis in Totan chat"
                        >
                          <p className="font-semibold">Analysis</p>
                          <p>
                            {analysisData ? 
                              `Average Return On...` :
                              "Calculating metrics..."
                            }
                          </p>
                        </div>
                      </Link>

                      <div className="flex items-center gap-2 bg-muted rounded-md px-3 py-1 text-sm text-muted-foreground">
                        <span className="bg-[#F3F4F6] rounded-lg p-2">
                          <Image src={AmazonIcon || "/placeholder.svg"} alt="Amazon icon" width={32} height={32} />
                        </span>
                        <span className="bg-[#F3F4F6] rounded-lg p-3 text-[#676A75] text-xs">
                          {analysisData?.breakdown?.amazon_on_listing && analysisData.breakdown.amazon_on_listing > 0 ? 
                            "Amazon on listing" : 
                            "Amazon not on listing"
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

           {activeTab === "analytics" && (
            <SalesAnalytics asin={asin} />
           )}
        </div>
      </div>
    </>
  );
});

QuickInfo.displayName = "QuickInfo";

export default QuickInfo;