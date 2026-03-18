import { ReactNode, useState, useEffect } from "react";
/* eslint-disable @typescript-eslint/no-unused-vars */
interface ProfitabilityData {
  profitAmount: number;
  costPrice: string;
  salePrice: number;
  totalFees: number;
  vatOnFees: number;
  estimatedAmzPayout: number;
  fulfillmentType: string;
  roi: number;
  profitMargin: number;
}

interface CalculationResultsProps {
  children?: ReactNode;
  rightColumn?: ReactNode;
  profitabilityData?: ProfitabilityData | null;
  currencyCode?: string;
  isCalculating?: boolean;
}

const CalculationResults = ({ 
  children, 
  rightColumn,
  profitabilityData,
  currencyCode = "USD",
  isCalculating = false 
}: CalculationResultsProps) => {
  const [displayData, setDisplayData] = useState<ProfitabilityData | null>(null);
  const [fulfillmentType, setFulfillmentType] = useState("FBA");

  useEffect(() => {
    if (profitabilityData) {
      setDisplayData(profitabilityData);
      setFulfillmentType(profitabilityData.fulfillmentType || "FBA");
    }
  }, [profitabilityData]);

  const formatCurrency = (value: number | string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    const symbol = currencyCode === 'CAD' ? 'C$' : currencyCode === 'USD' ? '$' : currencyCode;
    return `${symbol} ${numValue.toFixed(2)}`;
  };

  const getStatusColor = (profit: number) => {
    if (profit > 5) return "#10B981";
    if (profit > 0) return "#F59E0B";
    return "#EF4444";
  };

  const defaultData = {
    profitAmount: 0,
    costPrice: "0",
    salePrice: 0,
    totalFees: 0,
    vatOnFees: 0,
    estimatedAmzPayout: 0,
    fulfillmentType: "FBA",
    roi: 0,
    profitMargin: 0
  };

  const data = displayData || defaultData;
  const profitColor = getStatusColor(data.profitAmount);

  return (
    <div className="rounded-xl h-full bg-white lg:col-span-2 grid grid-cols-1 md:grid-cols-2 min-h-[610px] font-semibold text-sm">
      {/* left column */}
      <div className="min-h-[610px]">
        {children || (
          <div className="p-4">
            <span className="bg-[#F3F4F6] px-3 py-1.5 rounded-3xl text-[#676A75] font-semibold text-sm w-max">
              Profitability Calculator
            </span>
          </div>
        )}
      </div>

      {/* right column */}
      <div className="p-2 lg:p-3 flex flex-col gap-3 min-h-[610px] h-full">
        {/* Calculation Summary */}
        <div className="text-[#828995] bg-[#FAFBFB] w-full p-3 rounded-xl flex flex-col">
            {/* Right Column Content (BuyBox Analysis) */}
        {rightColumn && (
          <div className="flex-1">
            {rightColumn}
          </div>
        )}

          {/* Profit Section */}
          <div className="mb-6 flex items-center gap-5 justify-between mt-5 pt-5 border-t">
            <span className="flex items-center gap-2">
              <p className="text-[#8E949F] text-lg">Profit</p>
              <span 
                className="size-4 rounded-full" 
                style={{ backgroundColor: profitColor }}
              />
            </span>
            {isCalculating ? (
              <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
            ) : (
              <h5 className="text-[#3C485C] font-bold text-2xl lg:text-3xl xl:text-[32px]">
                {formatCurrency(data.profitAmount)}
              </h5>
            )}
          </div>

          {/* Breakdown Section */}
          <div className="py-4 flex flex-col gap-3">
            {isCalculating ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-5 justify-between items-center">
                  <div className="h-4 bg-gray-200 animate-pulse rounded w-20"></div>
                  <div className="h-4 bg-gray-200 animate-pulse rounded w-16"></div>
                </div>
              ))
            ) : (
              <>
                <span className="flex gap-5 justify-between items-center">
                  <p>Sales Price</p>
                  <p>{formatCurrency(data.salePrice)}</p>
                </span>
                <span className="flex gap-5 justify-between items-center">
                  <p>Cost Price</p>
                  <p>{formatCurrency(data.costPrice)}</p>
                </span>
                <span className="flex gap-5 justify-between items-center">
                  <p>Total Fees</p>
                  <p>{formatCurrency(data.totalFees)}</p>
                </span>
                <span className="flex gap-5 justify-between items-center">
                  <p>Sales Tax</p>
                  <p>{formatCurrency(data.vatOnFees)}</p>
                </span>
                <span className="flex gap-5 justify-between items-center">
                  <p>Est. Amazon Payout</p>
                  <p>{formatCurrency(data.estimatedAmzPayout)}</p>
                </span>
              </>
            )}
          </div>
         
        </div>

       
      </div>
    </div>
  );
};

export default CalculationResults;