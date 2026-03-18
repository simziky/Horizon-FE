"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { message } from "antd";
//import { HiOutlineEye, HiOutlineEyeSlash } from "react-icons/hi2";
import { 
  useMonitorSellerMutation, 
  useUnmonitorSellerMutation, 
  useGetMonitoredSellersQuery 
} from "@/redux/api/monitorApi";
import MonitorIcon from "@/public/assets/svg/icons/monitor";

interface MonitorButtonProps {
  sellerId: string;
  marketplaceId: number;
}

const MonitorButton: React.FC<MonitorButtonProps> = ({ sellerId, marketplaceId }) => {
  const [messageApi, contextHolder] = message.useMessage();
  const [isMonitored, setIsMonitoring] = useState(false);
// Query to check if seller is already monitored
  const { data: monitoredSellers, isLoading: isLoadingMonitored } = useGetMonitoredSellersQuery({});


  useEffect(()=>{
    if(monitoredSellers && monitoredSellers?.data?.length > 0) {
      const isAlreadyMonitored = monitoredSellers.data.some(
        (seller) => seller.seller_id.toString() === sellerId.toString() && seller.marketplace.id === marketplaceId
      );
      setIsMonitoring(isAlreadyMonitored);
    }

  },[ monitoredSellers, sellerId, marketplaceId ]);
  
  
  
  // Mutations for monitoring/unmonitoring
  const [monitorSeller, { isLoading: isMonitoring }] = useMonitorSellerMutation();
  const [unmonitorSeller, { isLoading: isUnmonitoring }] = useUnmonitorSellerMutation();
  
  // Check if current seller is being monitored
   
  
  const isLoading = isLoadingMonitored || isMonitoring || isUnmonitoring;
  
  const handleMonitorToggle = async () => {
    try {
      if (isMonitored) {
        const result = await unmonitorSeller({ sellerId, marketplaceId }).unwrap();
        messageApi.success(result.message || "Seller unmonitored successfully");
        setIsMonitoring(false);
      } else {
        const result = await monitorSeller({ sellerId, marketplaceId }).unwrap();
        messageApi.success(result.message || "Seller is now being monitored");
        setIsMonitoring(true);
      }
    } catch (error: any) {
      const errorMessage = error?.data?.message || "An error occurred";
      messageApi.error(errorMessage);
    }
  };
  
  return (
    <>
      {contextHolder}
      <button
        onClick={handleMonitorToggle}
        disabled={isLoading}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200
          ${isMonitored 
            ? ' text-red-600 border border-red-200 hover:bg-red-100' 
            : ' text-white border-primary border'
          }
          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        {isLoading ? (
          <div className=" text-primary flex items-center gap-4">
            <div className="w-4 h-4 border-2 text-primary border-current border-t-transparent rounded-full animate-spin" />
            Loading...
          </div>
        ) : isMonitored ? (
          <>
            <MonitorIcon className="w-6 h-6" stroke="#DC2626" />
            
          </>
        ) : (
          <>
            <MonitorIcon className="w-6 h-6" stroke="#292D32" />
            
          </>
        )}
      </button>
    </>
  );
};

export default MonitorButton;