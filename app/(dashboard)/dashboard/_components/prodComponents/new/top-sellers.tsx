/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState } from "react";
import { useGetBuyboxDetailsQuery } from "@/redux/api/productsApi";
import { useRouter } from "next/navigation";
import { Tooltip } from "antd";
import { HiOutlineUsers } from "react-icons/hi";
import { MdOutlineInsertChartOutlined } from "react-icons/md";
import { ImSpinner9 } from "react-icons/im";
import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";
import { GoDotFill } from "react-icons/go";
import OffersAndSellerFeedback from "./offers-and-seller-feedback";
import { CustomSelect as Select } from "@/lib/AntdComponents";
import ProductDatePicker from "./datePicker";
import { useAppSelector } from "@/redux/hooks";

type BuyboxItem = {
  seller: string;
  rating: number;
  review_count: number;
  stock_quantity: number;
  listing_price: number;
  weight_percentage: number;
  is_buybox_winner: boolean;
  seller_id: string;
  seller_type: "FBA" | "FBM" | "AMZ";
  seller_feedback?: {
    avg_price?: number;
    percentage_won?: number;
    last_won?: string;
  };
};

interface TopSellersProps {
  asin: string;
  marketplaceId: number;
  buyboxPrice?: number; // Add this prop
}

const TopSellers = ({ asin, marketplaceId, buyboxPrice }: TopSellersProps) => {
  const [active, setActive] = useState("offers");
  const [itemsToShow, setItemsToShow] = useState(3);
  const [loadingMore, setLoadingMore] = useState(false);
  const router = useRouter();

  const { data: buyboxDetailsData, isLoading } = useGetBuyboxDetailsQuery({
    marketplaceId,
    itemAsin: asin,
  });
  const { currencyCode, currencySymbol } = useAppSelector((state) => state.global) || { currencyCode: "USD" };

  const buyboxDetails: BuyboxItem[] = buyboxDetailsData?.data?.buybox ?? [];

  const sortedBuyboxDetails = [...buyboxDetails].sort(
    (a, b) => a.listing_price - b.listing_price
  );

  const offersData = {
    offers: sortedBuyboxDetails.map((offer, index) => ({
      id: index + 1,
      seller: offer.seller || "N/A",
      rating: typeof offer.rating === 'number' ? offer.rating : 0,
      review_count: offer.review_count || "N/A",
      stock: offer.stock_quantity ?? "N/A",
      price: offer.listing_price ? `${offer.listing_price.toFixed(2)}` : "N/A",
      buyboxShare:
        offer.weight_percentage != null ? `${offer.weight_percentage}%` : "N/A",
      leader: offer.is_buybox_winner || false,
      seller_id: offer.seller_id || "N/A",
      seller_type: offer.seller_type || "N/A",
    })),
  };

  const sellerFeedbackData = sortedBuyboxDetails.map((seller, index) => ({
    id: index + 1,
    seller: seller.seller,
    rating: seller.rating,
    review_count: seller.review_count,
    sellerId: seller.seller_id,
    seller_type: seller.seller_type,
    avgPrice: `${seller.seller_feedback?.avg_price?.toFixed(2) ?? "N/A"}`,
    won: `${seller.seller_feedback?.percentage_won ?? 0}%`,
    lastWon: seller.seller_feedback?.last_won
      ? new Date(seller.seller_feedback.last_won).toLocaleDateString()
      : "N/A",
  }));

  const displayedOffers = offersData.offers.slice(0, itemsToShow);
  const displayedFeedback = sellerFeedbackData.slice(0, itemsToShow);
  const fbaCount = offersData.offers.filter((o) => o.seller_type === "FBA").length;
  const fbmCount = offersData.offers.filter((o) => o.seller_type === "FBM").length;
  const amzCount = offersData.offers.filter((o) => o.seller_type === "AMZ").length;

  const handleLoadMore = () => {
    setLoadingMore(true);
    setTimeout(() => {
      setItemsToShow(itemsToShow + 5);
      setLoadingMore(false);
    }, 1500);
  };
  
  const getSellerColor = (type: string) => {
    switch (type) {
      case "FBA": return "#0F172A";
      case "FBM": return "#00E4E4";
      case "AMZ": return "#F97316";
      default: return "#6B7280";
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={`full-${i}`} />);
    }

    if (hasHalfStar) {
      stars.push(<FaStarHalfAlt key="half" />);
    }

    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<FaRegStar key={`empty-${i}`} />);
    }

    return <div className="flex text-yellow-400 mt-1 gap-0.5">{stars.map(star => ({...star, props: {...star.props, className: "size-3"}}))}</div>;
  };

  if (isLoading) {
    return (
      <div className="rounded-xl bg-white p-4 lg:p-5 h-64 flex justify-center items-center">
        <ImSpinner9 className="animate-spin size-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white p-4 lg:p-5">
      <div className="flex justify-between items-center flex-wrap gap-3">
        {/* TABS */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActive("offers")}
            className={`${
              active === "offers"
                ? "bg-primary text-white"
                : "bg-[#F3F4F6] text-[#676A75]"
            } px-3 py-1.5 rounded-3xl font-semibold text-sm w-max flex items-center gap-1.5`}
          >
            <HiOutlineUsers className="size-4" />
            Offers
          </button>
          <button
            type="button"
            className={`${
              active === "feedback"
                ? "bg-primary text-white"
                : "bg-[#F3F4F6] text-[#676A75]"
            } px-3 py-1.5 rounded-3xl font-semibold text-sm w-max flex items-center gap-1.5`}
            onClick={() => setActive("feedback")}
          >
            <MdOutlineInsertChartOutlined className="size-5" />
            Seller Feedback
          </button>
          
          {/* BUYBOX PRICE DISPLAY */}
          {buyboxPrice != null && (
            <div className="bg-[#F0FDF4] border border-[#10B981] px-3 py-1 rounded-3xl font-semibold text-sm flex items-center gap-1.5">
              <span className="text-[#10B981] text-xs">Buybox:</span>
              <span className="text-[#059669] text-sm">{currencySymbol}{buyboxPrice.toFixed(2)}</span>
            </div>
          )}
        </div>
        
        {/* FILTERS */}
        <div className="flex items-center gap-3">
          <ProductDatePicker />
        </div>
      </div>

      {active === "offers" ? (
        <div className="mt-5 max-h-[300px] overflow-y-scroll show-scrollbar">
          <table className="min-w-full text-left text-sm text-gray-700">
            <thead>
              <tr className="border-b bg-[#F7F7F7] font-medium">
                <th className="p-4 w-[70px]">#</th>
                <th className="p-4">Seller</th>
                <th className="p-4">Price</th>
                <th className="p-4">Stock</th>
                <th className="p-4">Buybox Share</th>
              </tr>
            </thead>
            <tbody>
              {displayedOffers.length > 0 ? (
                displayedOffers.map((offer) => (
                  <tr key={offer.id} className="border-b last:border-none text-[#252525] text-sm">
                    <td className="p-4 flex items-center gap-3">
                      {offer.id}
                      <GoDotFill color={getSellerColor(offer.seller_type)} />
                    </td>
                    <td className="p-4 min-w-[160px]">
                       <Tooltip title={`Rating: ${offer.rating} (${offer.review_count} reviews)`} placement="topLeft">
                          <div
                            onClick={() => router.push(`/seller/${offer.seller_id}`)}
                            className="cursor-pointer"
                          >
                            <div className="flex items-center gap-1.5">
                              <p className="truncate font-medium">{offer.seller} ({offer.review_count})</p>
                            </div>
                            {offer.leader && <span className="text-xs text-primary block mt-1">BuyBox Leader</span>}
                          </div>
                        </Tooltip>
                        {renderStars(offer.rating)}
                    </td>
                    <td className="p-4">{currencySymbol}{offer.price}</td>
                    <td className="p-4">{offer.stock}</td>
                    <td className="p-4">
                      <div className="flex gap-2 items-center">
                         <Tooltip title={`Wins the Buy Box ${offer.buyboxShare} of the time`} placement="top">
                            <span>{offer.buyboxShare}</span>
                         </Tooltip>
                         <div className="w-20 h-2 bg-gray-200 rounded-full">
                           <div
                             className="h-2 bg-green-500 rounded-full"
                             style={{ width: offer.buyboxShare && offer.buyboxShare !== "N/A" ? offer.buyboxShare : "0" }}
                           />
                         </div>
                       </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center p-6 text-gray-500">
                    No offers available for this product.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <OffersAndSellerFeedback feedbackData={displayedFeedback} router={router} />
      )}

      {/* FOOTER */}
      <div className="mt-5 px-5 flex justify-between items-center">
        <div className="flex items-start gap-3 flex-wrap">
          {fbaCount > 0 && <button className="h-[28px] px-3 bg-[#4D4D4D] text-white text-xs font-medium rounded-xl">FBA: {fbaCount}</button>}
          {fbmCount > 0 && <button className="h-[28px] px-3 bg-[#18CB96] text-white text-xs font-medium rounded-xl">FBM: {fbmCount}</button>}
          {amzCount > 0 && <button className="h-[28px] px-3 bg-orange-400 text-white text-xs font-medium rounded-xl">AMZ: {amzCount}</button>}
        </div>

        <div>
          {offersData.offers.length > itemsToShow && (
             <button
              onClick={handleLoadMore}
              className="text-[#18CB96] text-sm underline disabled:text-gray-400 disabled:no-underline"
              disabled={loadingMore}
            >
              {loadingMore ? "Loading..." : "View more"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopSellers;