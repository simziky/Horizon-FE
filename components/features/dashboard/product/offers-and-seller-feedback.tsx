import { Tooltip } from 'antd';
import type { NextRouter } from 'next/router';
/* eslint-disable @typescript-eslint/no-explicit-any */

// Define the shape of the data it expects
type SellerFeedback = {
  id: number;
  seller: string;
  rating: number;
  review_count: number;
  sellerId: string;
  seller_type: string;
  avgPrice: string;
  won: string;
  lastWon: string;
};

interface OffersAndSellerFeedbackProps {
    feedbackData: SellerFeedback[];
    router: NextRouter | any; // Use a more specific type if available
}

const OffersAndSellerFeedback = ({ feedbackData, router }: OffersAndSellerFeedbackProps) => {
  return (
    <div className="mt-5 overflow-x-auto max-h-[300px] overflow-y-scroll show-scrollbar">
      <table className="min-w-full text-left text-sm text-gray-700">
        <thead>
          <tr className="border-b bg-[#F7F7F7] font-medium">
            <th className="p-4 w-[70px]">#</th>
            <th className="p-4">Seller</th>
            <th className="p-4">Avg. Price</th>
            <th className="p-4">Won</th>
            <th className="p-4">Last Won</th>
          </tr>
        </thead>
        <tbody>
          {feedbackData.length > 0 ? (
            feedbackData.map((seller) => (
              <tr key={seller.id} className="border-b last:border-none text-[#252525] text-sm">
                <td className="p-4">{seller.id}</td>
                <td className="p-4 min-w-[160px]">
                  <Tooltip title={`Rating: ${seller.rating} (${seller.review_count} reviews)`} placement="topLeft">
                    <div
                      onClick={() => router.push(`/seller/${seller.sellerId}`)}
                      className="cursor-pointer flex flex-col gap-0.5"
                    >
                      <span className="flex items-center gap-1.5">
                        <span
                          className={`size-2.5 rounded-sm ${
                            seller.seller_type === "FBA"
                              ? "bg-black"
                              : seller.seller_type === "FBM"
                                ? "bg-[#00E4E4]"
                                : "bg-orange-400"
                          }`}
                        />
                        <p className="truncate font-medium">{seller.seller}</p>
                      </span>
                    </div>
                  </Tooltip>
                </td>
                <td className="p-4">${seller.avgPrice}</td>
                <td className="p-4">{seller.won}</td>
                <td className="p-4 whitespace-nowrap">{seller.lastWon}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="text-center p-6 text-gray-500">
                No seller feedback available for this product.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default OffersAndSellerFeedback;