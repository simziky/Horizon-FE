"use client";
import React, { JSX, useState } from "react";
import { Search } from "lucide-react";
import { MdOutlineInsertChartOutlined } from "react-icons/md";
import { useGetMonitoredSellersQuery, useUnmonitorSellerMutation } from "@/redux/api/monitorApi";
import { useAppSelector } from "@/redux/hooks";

import { message, Skeleton } from "antd";
import CustomPagination from "../../_components/CustomPagination";

interface SellerData {
  id: number;
  seller_id: string;
  seller_name: string;
  seller_amazon_link: string;
  rating: {
    count: number;
    stars: number;
    percentage_change: number | null;
    change_type: string | null;
  };
  marketplace: {
    id: number;
    name: string;
    currency_symbol: string;
    currency_code: string;
  };
  products_count: number;
  monitoring_since: string;
  last_updated: string;
}

const MonitorSellersList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [removingSellerId, setRemovingSellerId] = useState<string | null>(null);
  const { marketplaceId } = useAppSelector((state) => state?.global);
  
  const { data: monitoredSellers, isLoading: isLoadingMonitored } = useGetMonitoredSellersQuery({
    id: marketplaceId,
    page: currentPage,
    per_page: 20
  });

  const [unmonitorSeller] = useUnmonitorSellerMutation();

  const handleRemove = async (sellerId: string, sellerName: string): Promise<void> => {
    setRemovingSellerId(sellerId);
    
    // Show loading message
    const hideLoading = message.loading(`Removing ${sellerName}...`, 0);
    
    try {
      const result = await unmonitorSeller({
        sellerId,
        marketplaceId
      }).unwrap();
      
      // Hide loading message
      hideLoading();
      
      if (result.success) {
        message.success({
          content: result.message || `${sellerName} has been successfully removed from monitoring`,
          duration: 3,
        });
      } else {
        message.warning({
          content: result.message || "Something went wrong while removing the seller",
          duration: 3,
        });
      }
    } catch (error) {
      // Hide loading message
      hideLoading();
      
      const err = error as { 
        data?: { message?: string; error?: string };
        status?: number;
      };
      
      // Show detailed error message
      message.error({
        content: err?.data?.message || err?.data?.error || `Failed to remove ${sellerName}. Please try again.`,
        duration: 4,
      });
      
      console.error("Error removing seller:", error);
    } finally {
      setRemovingSellerId(null);
    }
  };

  const handleNextPage = (): void => {
    if (monitoredSellers?.meta?.pagination?.has_next_page) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePreviousPage = (): void => {
    if (monitoredSellers?.meta?.pagination?.has_previous_page) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: '2-digit', 
      day: '2-digit', 
      year: '2-digit' 
    });
  };

  const getSellerTypeColor = (rating: number): string => {
    if (rating >= 4.5) return "bg-black";
    if (rating >= 4.0) return "bg-[#00E4E4]";
    return "bg-orange-400";
  };

  const renderStars = (rating: number): JSX.Element[] => {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={i < Math.floor(rating) ? "text-yellow-400" : "text-gray-300"}
      >
        ★
      </span>
    ));
  };

  const filteredSellers: SellerData[] = monitoredSellers?.data?.filter(
    (seller) =>
      seller.seller_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seller.seller_id.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoadingMonitored) {
    return (
      <div className="w-full max-w-7xl mx-auto p-6 bg-white">
        <div className="flex items-center justify-between mb-6">
          <Skeleton.Button active size="large" style={{ width: 200 }} />
          <Skeleton.Input active size="default" style={{ width: 256 }} />
        </div>
        <div className="space-y-4">
          <Skeleton active paragraph={{ rows: 8 }} />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6 bg-white">
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          className="px-3 py-1.5 rounded-3xl font-semibold text-sm w-max flex items-center gap-1.5 bg-primary text-white"
        >
          <MdOutlineInsertChartOutlined className="size-5" />
          Monitor sellers list
        </button>

        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-3xl pl-10 pr-4 py-2 border border-gray-200 text-sm focus:outline-none focus:border-gray-300"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b bg-[#F7F7F7]">
              <th className="p-4 font-medium text-gray-700 w-[60px]">#</th>
              <th className="p-4 font-medium text-gray-700">Seller</th>
              <th className="p-4 font-medium text-gray-700">Store Name</th>
              <th className="p-4 font-medium text-gray-700">No. of items</th>
              <th className="p-4 font-medium text-gray-700">Last Seen</th>
              <th className="p-4 font-medium text-gray-700">Last Uploaded</th>
              <th className="p-4 font-medium text-gray-700">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredSellers.length > 0 ? (
              filteredSellers.map((seller, index) => (
                <tr
                  key={seller.id}
                  className="border-b last:border-none hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-2 text-gray-700">
                    {(currentPage - 1) * 20 + index + 1}
                  </td>
                  <td className="px-4 py-2 min-w-[200px]">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${getSellerTypeColor(
                            seller.rating.stars
                          )}`}
                        />
                        <span className="font-medium text-gray-900">
                          {seller.seller_name} ({seller.rating.count})
                        </span>
                        {seller.rating.percentage_change !== null && (
                          <span
                            className={`text-xs ${
                              seller.rating.change_type === "increase"
                                ? "text-green-500"
                                : "text-red-500"
                            }`}
                          >
                            {seller.rating.change_type === "increase" ? "↑" : "↓"}
                            {seller.rating.percentage_change}%
                          </span>
                        )}
                      </div>
                      <div className="flex items-center text-xs">
                        {renderStars(seller.rating.stars)}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <a 
                      href={seller.seller_amazon_link} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      {seller.seller_name}
                    </a>
                  </td>
                  <td className="px-4 py-2 text-gray-700">{seller.products_count}</td>
                  <td className="px-4 py-2 text-gray-700">{formatDate(seller.monitoring_since)}</td>
                  <td className="px-4 py-2 text-gray-700">{formatDate(seller.last_updated)}</td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => handleRemove(seller.seller_id, seller.seller_name)}
                      disabled={removingSellerId === seller.seller_id}
                      className="px-3.5 py-1.5 border border-[#FB583E] font-medium text-[#FB583E] rounded-md text-sm hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {removingSellerId === seller.seller_id ? "Removing..." : "Remove"}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="text-center p-6 text-gray-500">
                  No sellers found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {monitoredSellers?.data && monitoredSellers.data.length > 0 && (
        <CustomPagination
          onNext={handleNextPage}
          onPrevious={handlePreviousPage}
          hasNext={monitoredSellers?.meta?.pagination?.has_next_page || false}
          hasPrevious={monitoredSellers?.meta?.pagination?.has_previous_page || false}
        />
      )}
    </div>
  );
};

export default MonitorSellersList;