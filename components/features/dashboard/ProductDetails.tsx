"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useAppSelector } from "@/redux/hooks";
import { useDispatch } from "react-redux";
import { setIpAlert, setIpIssues } from "@/redux/slice/globalSlice";
import {
  useGetBuyboxDetailsQuery,
  useGetItemQuery,
  useLazyGetIpAlertQuery,
} from "@/redux/api/productsApi";
import dayjs from "dayjs";

import FinalLoader from "./loader";
import QuickInfo from "./product/quick-info";

const Nav = dynamic(() => import("./product/nav"), {
  loading: () => <div className="h-12" />,
});
const ProductOverview = dynamic(
  () => import("./product/product-overview")
);
const ProductEligibility = dynamic(
  () => import("./product/product-eligibility")
);
const TopSellers = dynamic(() => import("./product/top-sellers"));
const CalculationResults = dynamic(
  () => import("./product/calculation-results")
);
const BuyboxAnalysis = dynamic(
  () => import("./product/buybox-analysis")
);

const MarketAnalysis = dynamic(
  () => import("./product/market-analysis"),
  {
    loading: () => (
      <div className="rounded-xl bg-white p-4 lg:p-5">
        <div className="h-[300px] animate-pulse rounded-lg bg-[#F3F4F6]" />
      </div>
    ),
    ssr: false,
  }
);
const ProfitabilityCalculator = dynamic(
  () => import("./product/profitability-calculator"),
  {
    loading: () => (
      <div className="rounded-xl bg-white p-4">
        <div className="h-6 w-48 rounded-full bg-[#F3F4F6]" />
        <div className="mt-4 h-32 rounded-lg bg-[#F3F4F6]" />
      </div>
    ),
    ssr: false,
  }
);

interface ProductDetailsProps {
  asin: string;
  marketplaceId: number;
}

interface IpAlertState {
  setIpIssue: number;
  eligibility: boolean;
}

interface IpAlertData {
  amazon_share_buybox?: number;
  private_label?: string;
  size?: string;
  size_text?: string;
  is_meltable?: boolean;
  has_variations?: boolean;
  ip_analysis?: {
    description?: string;
    issues?: number;
  };
  eligible_to_sell?: boolean;
  is_hazardous_or_dangerous?: boolean;
}

const ProductDetails = ({ asin, marketplaceId }: ProductDetailsProps) => {
  const dispatch = useDispatch();
  const [getIpAlert] = useLazyGetIpAlertQuery();
  const [ipData, setIpData] = useState<IpAlertData | null>(null);
  const [isLoadingIpData, setIsLoadingIpData] = useState(false);
  const fetchedAtRef = useRef<Map<string, number>>(new Map());
  const prevAsinRef = useRef<string | null>(null);
  const [ipDataError, setIpDataError] = useState(false);
  const previousMarketplaceId = useRef(marketplaceId);
  const [profitabilityData, setProfitabilityData] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Add loader state
  const [currentStep, setCurrentStep] = useState(0);
  const [showLoader, setShowLoader] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Refs for triggering recalculation
  const profitCalculatorRef = useRef<{
    updateCostPrice: (value: string) => void;
    updateSalesPrice: (value: string) => void;
  } | null>(null);

  const { currencyCode } = useAppSelector((state) => state.global) || {
    currencyCode: "USD",
  };

  const quickInfoRef = useRef<{
    handleProfitabilityUpdate: (data: any) => void;
  } | null>(null);

  const { setIpIssue, eligibility } = useAppSelector(
    (state) =>
      (state?.global?.ipAlert as IpAlertState) || {
        setIpIssue: 0,
        eligibility: false,
      }
  );

  const [statStartDate, setStatStartDate] = useState(
    dayjs().format("YYYY-MM-DD")
  );
  const [statEndDate, setStatEndDate] = useState(
    dayjs().add(1, "month").format("YYYY-MM-DD")
  );

  // RTK Query hooks for fetching product data
  const { 
    data: buyboxDetailsData, 
    isLoading: isLoadingBuybox,
    error: buyboxError 
  } = useGetBuyboxDetailsQuery({
    marketplaceId,
    itemAsin: asin,
  });

  const {
    data,
    error,
    isLoading: isLoadingItem,
  } = useGetItemQuery({
    marketplaceId,
    itemAsin: asin,
  });

  // Calculate pricing data for Nav component
  const buyboxWinner = buyboxDetailsData?.data?.buybox?.find(
    (offer: any) => offer.is_buybox_winner
  );
  const buyboxWinnerPrice = buyboxWinner?.listing_price || 0;

  const fbaOffers = buyboxDetailsData?.data?.buybox?.filter(
    (offer: any) => offer.seller_type === "FBA"
  );
  const fbmOffers = buyboxDetailsData?.data?.buybox?.filter(
    (offer: any) => offer.seller_type === "FBM"
  );

  const lowestFBAPrice = fbaOffers?.length
    ? Math.min(...fbaOffers.map((o: any) => o.listing_price))
    : 0;
  const lowestFBMPrice = fbmOffers?.length
    ? Math.min(...fbmOffers.map((o: any) => o.listing_price))
    : 0;

  const monthlySales =
    data?.data?.sales_statistics?.estimated_sales_per_month?.amount;

  // Check for errors and stop loader
  useEffect(() => {
    if (error || buyboxError || ipDataError) {
      setHasError(true);
      setShowLoader(false);
    }
  }, [error, buyboxError, ipDataError]);

  // Safety net: never let the loader run for more than 30s
  useEffect(() => {
    if (!showLoader) return;
    const timer = setTimeout(() => setShowLoader(false), 30000);
    return () => clearTimeout(timer);
  }, [showLoader]);

  // Track loading progress and update steps
  useEffect(() => {
    // Don't update steps if there's an error
    if (hasError) return;

    let step = 0;
    
    if (asin && marketplaceId) {
      step = 0;
    }

    if (!isLoadingItem && data) {
      step = 1;
    }

    if (!isLoadingBuybox && buyboxDetailsData) {
      step = 2;
    }

    if (!isLoadingIpData && ipData) {
      step = 3;
    }

    if (!isLoadingItem && !isLoadingBuybox && !isLoadingIpData && data && buyboxDetailsData) {
      step = 4;
      const timer = setTimeout(() => {
        setShowLoader(false);
      }, 1000);
      return () => clearTimeout(timer);
    }

    setCurrentStep(step);
  }, [isLoadingItem, isLoadingBuybox, isLoadingIpData, data, buyboxDetailsData, marketplaceId, hasError]);

  // Track marketplace changes
  useEffect(() => {
    if (previousMarketplaceId.current !== marketplaceId) {
      previousMarketplaceId.current = marketplaceId;

      setIpData(null);
      setShowLoader(true);
      setCurrentStep(0);
      setHasError(false);
      setIpDataError(false);
      dispatch(
        setIpAlert({
          setIpIssue: 0,
          eligibility: false,
        })
      );
      dispatch(setIpIssues([] as any));
    }
  }, [marketplaceId, dispatch]);

  // Reset state when ASIN genuinely changes (guard prevents Strict Mode double-fire)
  useEffect(() => {
    if (prevAsinRef.current === asin) return;
    prevAsinRef.current = asin;

    setIpData(null);
    setShowLoader(true);
    setCurrentStep(0);
    setHasError(false);
    setIpDataError(false);
    dispatch(
      setIpAlert({
        setIpIssue: 0,
        eligibility: false,
      })
    );
    dispatch(setIpIssues([] as any));
    setIsLoadingIpData(true);
  }, [asin, dispatch]);

  // Fetch IP data
  useEffect(() => {
    const fetchIpData = async () => {
      // SWR gate: check how old the last successful fetch was
      const swrKey = `${asin}:${marketplaceId}`;
      const lastFetch = fetchedAtRef.current.get(swrKey);
      const ageMs = lastFetch ? Date.now() - lastFetch : Infinity;

      // Soft TTL (< 5 min): data is fresh — skip fetch, but ensure loading is cleared
      if (ageMs < 300_000) {
        setIsLoadingIpData(false);
        return;
      }

      // Between soft and hard TTL (5–10 min): revalidate silently, no loading spinner
      if (ageMs < 600_000 && ipData) {
        setIsLoadingIpData(false);
        getIpAlert({ itemAsin: asin, marketplaceId, statStartDate, statEndDate })
          .unwrap()
          .then((response) => {
            dispatch(setIpAlert({ setIpIssue: response?.data?.ip_analysis?.issues ?? 0, eligibility: response?.data?.eligible_to_sell ?? false }));
            dispatch(setIpIssues(response?.data?.ip_analysis?.issues ?? []));
            setIpData(response.data as IpAlertData);
            fetchedAtRef.current.set(swrKey, Date.now());
          })
          .catch(() => {});
        return;
      }

      // Expired or first fetch — normal flow
      setIsLoadingIpData(true);
      setIpDataError(false);
      try {
        const response = await getIpAlert({
          itemAsin: asin,
          marketplaceId,
          statStartDate,
          statEndDate,
        }).unwrap();

        dispatch(
          setIpAlert({
            setIpIssue: response?.data?.ip_analysis?.issues ?? 0,
            eligibility: response?.data?.eligible_to_sell ?? false,
          })
        );
        dispatch(setIpIssues(response?.data?.ip_analysis?.issues ?? []));
        setIpData(response.data as IpAlertData);
        fetchedAtRef.current.set(swrKey, Date.now());
      } catch (error) {
        console.error("Error fetching IP alert:", error);
        setIpDataError(true);
        setIpData({});
      } finally {
        setIsLoadingIpData(false);
      }
    };

    if (asin && marketplaceId) {
      fetchIpData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asin, marketplaceId, dispatch, getIpAlert, statStartDate, statEndDate]);

  // Handle profitability calculation completion
  const handleCalculationComplete = (data: any) => {
    setProfitabilityData(data);
    setIsCalculating(false);

    if (quickInfoRef.current) {
      quickInfoRef.current.handleProfitabilityUpdate(data);
    }
  };

  const handleCalculationStart = () => {
    setIsCalculating(true);
  };

  const handleNavigateToTotan = () => {};

  // Handle cost price change from QuickInfo
  const handleCostPriceChange = (value: string) => {
    if (profitCalculatorRef.current) {
      profitCalculatorRef.current.updateCostPrice(value);
    }
  };

  // Handle sales price change from QuickInfo
  const handleSalesPriceChange = (value: string) => {
    if (profitCalculatorRef.current) {
      profitCalculatorRef.current.updateSalesPrice(value);
    }
  };

  // Show error message if any API fails
  if (hasError || error || buyboxError || ipDataError) {
    return (
      <div className="h-[400px] flex flex-col items-center justify-center">
        <h2 className="font-semibold text-red-600">An error occurred</h2>
        <p className="text-sm text-gray-600">
          {error 
            ? "Failed to load product details" 
            : buyboxError 
            ? "Failed to load buybox information"
            : ipDataError
            ? "Failed to load IP alert data"
            : "An error occurred while loading data, confirm you are on the correct marketplace"}
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Please try again or select a different product
        </p>
      </div>
    );
  }

  if (showLoader) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <FinalLoader currentStep={currentStep} />
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-4 min-h-[50dvh] md:min-h-[80dvh]">
      <Nav
        product={data?.data}
        buyboxWinnerPrice={buyboxWinnerPrice}
        lowestFBAPrice={lowestFBAPrice}
        lowestFBMPrice={lowestFBMPrice}
        monthlySales={monthlySales}
        sellerCount={buyboxDetailsData?.data?.buybox?.length || 0}
        fbaSellers={fbaOffers?.length || 0}
        fbmSellers={fbmOffers?.length || 0}
        stockLevels={buyboxDetailsData?.data?.buybox?.reduce(
          (sum: number, seller: any) => sum + (seller.stock_quantity || 0),
          0
        )}
        asin={asin}
        marketplaceId={marketplaceId}
        profitabilityData={profitabilityData}
        onNavigateToTotan={handleNavigateToTotan}
      />

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
        {/* column 1 */}
        <div className="flex flex-col gap-4">
          <ProductOverview
            product={data?.data}
            asin={asin}
            marketplaceId={marketplaceId}
            isLoading={isLoadingItem}
          />
          <ProductEligibility
            product={data?.data}
            ipData={ipData}
            eligibility={eligibility}
            setIpIssue={setIpIssue}
            asin={asin}
            marketplaceId={marketplaceId}
            isLoadingIpData={isLoadingIpData}
          />
          <QuickInfo
            ref={quickInfoRef}
            product={data?.data}
            buyboxDetails={buyboxDetailsData?.data}
            asin={asin}
            marketplaceId={marketplaceId}
            onNavigateToTotan={handleNavigateToTotan}
            onCostPriceChange={handleCostPriceChange}
            onSalesPriceChange={handleSalesPriceChange}
          />
        </div>

        {/* column 2 */}
        <div className="flex flex-col gap-4 col-span-2">
          <TopSellers
           asin={asin}
            marketplaceId={marketplaceId} 
             buyboxPrice={buyboxDetailsData?.data?.extra?.buybox_price}
            />
          <CalculationResults
            profitabilityData={profitabilityData}
            currencyCode={currencyCode}
            isCalculating={isCalculating}
             rightColumn={<BuyboxAnalysis asin={asin} marketplaceId={marketplaceId} />}
          >
            <ProfitabilityCalculator
              ref={profitCalculatorRef}
              asin={asin}
              marketplaceId={marketplaceId}
              product={data?.data}
              isLoading={isLoadingItem}
              onCalculationComplete={handleCalculationComplete}
              onCalculationStart={handleCalculationStart}
              offers={buyboxDetailsData?.data?.buybox || []}
            />
         
          </CalculationResults>
       
        </div>
      </div>

      <div className="col-span-3">
        <MarketAnalysis
          asin={asin}
          marketplaceId={marketplaceId}
          isLoading={isLoadingItem}
        />
      </div>
    </section>
  );
};

export default ProductDetails;
