"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useDraggable } from "@dnd-kit/core"
import { useState, useMemo } from "react"
import Image from "next/image"
import placeholder from '../../../../public/assets/images/gocompare/placeholder.png'
import { ProductObj, QuickSearchResult } from "@/types/goCompare";
import TablePagination from "./TablePagination";
import { FaSort, FaSortUp, FaSortDown } from "react-icons/fa";

// Three-dot loading component
const ThreeDotLoader = () => (
  <div className="three-dot-loader">
    <div className="dot"></div>
    <div className="dot"></div>
    <div className="dot"></div>
  </div>
);

// Helper function to determine if data should show loading animation
const shouldShowLoading = (value: any): boolean => {
  return value === null || 
         value === undefined || 
         value === 'N/A' || 
         value === '' || 
         value === 0 ||
         (typeof value === 'string' && value.trim() === '');
};

interface ProductTableProps {
  products: ProductObj[] | QuickSearchResult[]
  onRowClick: (product: ProductObj | QuickSearchResult) => void
}


function DraggableRow({
  product,
  onRowClick,
  isQuickSearchResult = false,
  rowIndex,
}: {
  product: ProductObj | QuickSearchResult;
  onRowClick: (product: ProductObj | QuickSearchResult) => void;
  isQuickSearchResult?: boolean;
  rowIndex: number;
}) {
  // Always call hooks at the top level
  const [mouseDownTime, setMouseDownTime] = useState<number | null>(null);

  // Determine the draggable ID based on product type
  const draggableId = isQuickSearchResult 
    ? `${(product as QuickSearchResult).store_name}-${(product as QuickSearchResult).asin}-${rowIndex}`
    : (product as ProductObj).scraped_product.id;

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: draggableId,
    data: { 
      product,
      type: isQuickSearchResult ? 'quickSearchResult' : 'productObj'
    },
  });

  const handleMouseDown = () => {
    setMouseDownTime(Date.now());
  };

  const handleMouseUp = () => {
    if (mouseDownTime && Date.now() - mouseDownTime < 200) {
      onRowClick(product);
    }
    setMouseDownTime(null);
  };

  // Render different content based on product type
  const renderProductCell = () => {
    if (isQuickSearchResult) {
      const quickSearchProduct = product as QuickSearchResult;
      return (
        <td className="px-4 py-1.5 flex items-center gap-2">
          <div className="w-8 h-8 relative rounded overflow-hidden">
            <Image 
              src={quickSearchProduct.image_url} 
              alt={quickSearchProduct.store_name || 'Product'} 
              className="object-cover"
              width={32}
              height={32}
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://via.placeholder.com/32?text=No+Image";
              }}
            />
          </div>
          <span className="text-sm line-clamp-1">
            {quickSearchProduct.product_name && quickSearchProduct.product_name.length > 25
              ? `${quickSearchProduct.product_name.slice(0, 25)}...`
              : quickSearchProduct.product_name}
          </span>
        </td>
      );
    } else {
      const productObj = product as ProductObj;
      return (
        <td className="px-4 py-1.5 flex items-center gap-2">
          <div className="w-8 h-8 relative rounded overflow-hidden">
            <Image src={productObj.scraped_product?.image_url} alt={productObj.store.name} className="object-cover" width={32} height={32} />
          </div>
          <span className="text-sm line-clamp-1">
            {productObj.scraped_product.product_name.length > 25
              ? `${productObj.scraped_product.product_name.slice(0, 25)}...`
              : productObj.scraped_product.product_name}
          </span>
        </td>
      );
    }
  };

  const renderTableCells = () => {
    if (isQuickSearchResult) {
      const quickSearchProduct = product as QuickSearchResult;
      return (
        <>
          <td className="px-4 py-1.5">
            <div className="w-auto h-auto px-2 py-1 flex items-center">
              {quickSearchProduct.product_url ? (
                <a 
                  href={quickSearchProduct.product_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-sm font-medium hover:underline"
                >
                  {quickSearchProduct.store_name || 'Unknown Store'}
                </a>
              ) : (
                <span className="text-sm font-medium">{quickSearchProduct.store_name || 'Unknown Store'}</span>
              )}
            </div>
          </td>
          <td className="px-4 py-1.5 text-sm">{quickSearchProduct.price || quickSearchProduct.buybox_price || 'N/A'}</td>
          <td className="px-4 py-1.5 text-sm">
            {shouldShowLoading(quickSearchProduct.amazon_price) ? (
              <ThreeDotLoader />
            ) : (
              `${quickSearchProduct.amazon_price}`
            )}
          </td>
          <td className="px-4 py-1.5 text-sm">
            {shouldShowLoading(quickSearchProduct.profit_margin) ? (
              <ThreeDotLoader />
            ) : (
              `${quickSearchProduct.profit_margin}%`
            )}
          </td>
          <td className="px-4 py-1.5 text-sm">
            {shouldShowLoading(quickSearchProduct.gross_roi) ? (
              <ThreeDotLoader />
            ) : (
              `${quickSearchProduct.gross_roi}%`
            )}
          </td>
          <td className="px-4 py-1.5 text-sm">{quickSearchProduct.sales_rank || 'N/A'}</td>
          <td className="px-4 py-1.5 text-sm">{quickSearchProduct.number_of_sellers || 'N/A'}</td>
        </>
      );
    } else {
      const productObj = product as ProductObj;
      const amazonPrice = (productObj.scraped_product.price.amount + productObj.price_difference).toFixed(2);
      const formattedAmazonPrice = `${productObj.scraped_product.price.currency} ${amazonPrice}`;
      const formattedProfitMargin = `${productObj.profit_margin.toFixed(1)}%`;
      const formattedROI = `${productObj.roi_percentage.toFixed(1)}%`;

      return (
        <>
          <td className="px-4 py-1.5">
            <div className="w-auto h-auto px-2 py-1 flex items-center">
              {productObj.scraped_product?.product_url ? (
                <a 
                  href={productObj.scraped_product.product_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-sm font-medium hover:underline"
                >
                  {productObj.store?.name || 'Unknown Store'}
                </a>
              ) : (
                <span className="text-sm font-medium">{productObj.store?.name || 'Unknown Store'}</span>
              )}
            </div>
          </td>
          <td className="px-4 py-1.5 text-sm">{productObj.scraped_product.price?.formatted || productObj.buybox_price || 'N/A'}</td>
          <td className="px-4 py-1.5 text-sm">
            {shouldShowLoading(productObj.scraped_product.price.amount + productObj.price_difference) ? (
              <ThreeDotLoader />
            ) : (
              formattedAmazonPrice
            )}
          </td>
          <td className="px-4 py-1.5 text-sm">
            {shouldShowLoading(productObj.profit_margin) ? (
              <ThreeDotLoader />
            ) : (
              formattedProfitMargin
            )}
          </td>
          <td className="px-4 py-1.5 text-sm">
            {shouldShowLoading(productObj.roi_percentage) ? (
              <ThreeDotLoader />
            ) : (
              formattedROI
            )}
          </td>
          <td className="px-4 py-1.5 text-sm">{productObj.sales_rank || 'N/A'}</td>
          <td className="px-4 py-1.5 text-sm">{productObj.number_of_sellers || 'N/A'}</td>
        </>
      );
    }
  };

  return (
    <tr
      ref={setNodeRef}
      style={
        transform
          ? {
            transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
            zIndex: isDragging ? 1000 : 1,
            opacity: isDragging ? 0.5 : 1,
            position: isDragging ? "relative" : "static" as "static" | "relative",
          }
          : undefined
      }
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      className={`hover:bg-gray-50 cursor-pointer ${isDragging ? "opacity-50 bg-gray-100" : ""}`}
      {...listeners}
      {...attributes}
    >
      {renderProductCell()}
      {renderTableCells()}
    </tr>
  );
}

export default function QuickSearchTable({ products, onRowClick }: ProductTableProps) {
  const [currentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>(null);
  const itemsPerPage = 10;

  // Check if products are QuickSearchResult type
  const isQuickSearchResult = products.length > 0 && ('store_name' in products[0] || 'product_name' in products[0]);

  const handleSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
        direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnKey: string) => {
    if (sortConfig?.key === columnKey) {
        return sortConfig.direction === 'ascending' ? <FaSortUp className="inline ml-1" /> : <FaSortDown className="inline ml-1" />;
    }
    return <FaSort className="inline ml-1 text-gray-400" />;
  };

  // Sort products
  const sortedProducts = useMemo(() => {
    let sortableItems = [...products];

    if (sortConfig !== null) {
        sortableItems.sort((a: any, b: any) => {
            let aValue: number = 0;
            let bValue: number = 0;

            if (isQuickSearchResult) {
                const itemA = a as QuickSearchResult;
                const itemB = b as QuickSearchResult;

                switch (sortConfig.key) {
                    case 'storePrice':
                        aValue = parseFloat(itemA.price || itemA.buybox_price || '0');
                        bValue = parseFloat(itemB.price || itemB.buybox_price || '0');
                        break;
                    case 'amazonPrice':
                        aValue = parseFloat(itemA.amazon_price || '0');
                        bValue = parseFloat(itemB.amazon_price || '0');
                        break;
                    case 'profitMargin':
                        aValue = itemA.profit_margin;
                        bValue = itemB.profit_margin;
                        break;
                    case 'grossROI':
                        aValue = itemA.gross_roi;
                        bValue = itemB.gross_roi;
                        break;
                    case 'salesRank':
                        aValue = parseInt(itemA.sales_rank || '0');
                        bValue = parseInt(itemB.sales_rank || '0');
                        break;
                    case 'sellers':
                        aValue = parseInt(itemA.number_of_sellers || '0');
                        bValue = parseInt(itemB.number_of_sellers || '0');
                        break;
                    default:
                        return 0;
                }
            } else {
                const itemA = a as ProductObj;
                const itemB = b as ProductObj;

                switch (sortConfig.key) {
                    case 'storePrice':
                        aValue = itemA.scraped_product.price.amount;
                        bValue = itemB.scraped_product.price.amount;
                        break;
                    case 'amazonPrice':
                        aValue = itemA.scraped_product.price.amount + itemA.price_difference;
                        bValue = itemB.scraped_product.price.amount + itemB.price_difference;
                        break;
                    case 'profitMargin':
                        aValue = itemA.profit_margin;
                        bValue = itemB.profit_margin;
                        break;
                    case 'grossROI':
                        aValue = itemA.roi_percentage;
                        bValue = itemB.roi_percentage;
                        break;
                    case 'salesRank':
                        aValue = itemA.sales_rank || 0;
                        bValue = itemB.sales_rank || 0;
                        break;
                    case 'sellers':
                        aValue = itemA.number_of_sellers || 0;
                        bValue = itemB.number_of_sellers || 0;
                        break;
                    default:
                        return 0;
                }
            }

            if (aValue < bValue) {
                return sortConfig.direction === 'ascending' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'ascending' ? 1 : -1;
            }
            return 0;
        });
    } else if (!isQuickSearchResult) {
        // Default sort for ProductObj
        sortableItems = (sortableItems as ProductObj[]).sort((a, b) => b.roi_percentage - a.roi_percentage);
    }

    return sortableItems;
  }, [products, sortConfig, isQuickSearchResult]);

  // Only show first page (first 10 items)
  const currentData = sortedProducts.slice(0, itemsPerPage);
  const startIndex = 0;
  const totalPages = 1;

  const handlePageChange = () => {
    // No-op since we only have one page
  };

  return (
    <div className="border border-gray-200 rounded-lg">
      <div className="w-full bg-white rounded-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-4 py-3 text-left font-medium text-gray-600">Product name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Store</th>
                <th 
                  className="px-4 py-3 text-left font-medium text-gray-600 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('storePrice')}
                >
                  Store Price {getSortIcon('storePrice')}
                </th>
                <th 
                  className="px-4 py-3 text-left font-medium text-gray-600 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('amazonPrice')}
                >
                  Amazon Price {getSortIcon('amazonPrice')}
                </th>
                <th 
                  className="px-4 py-3 text-left font-medium text-gray-600 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('profitMargin')}
                >
                  Profit Margin {getSortIcon('profitMargin')}
                </th>
                <th 
                  className="px-4 py-3 text-left font-medium text-gray-600 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('grossROI')}
                >
                  Gross ROI {getSortIcon('grossROI')}
                </th>
                <th 
                  className="px-4 py-3 text-left font-medium text-gray-600 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('salesRank')}
                >
                  Sales Rank {getSortIcon('salesRank')}
                </th>
                <th 
                  className="px-4 py-3 text-left font-medium text-gray-600 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('sellers')}
                >
                  No. of Sellers {getSortIcon('sellers')}
                </th>
              </tr>
            </thead>
            <tbody>
              {currentData.map((product, index) => (
                <DraggableRow
                  key={`${isQuickSearchResult ? `${(product as any).store_name}-${(product as any).asin}` : (product as any).scraped_product.id}-${startIndex + index}`}
                  product={product}
                  onRowClick={onRowClick}
                  isQuickSearchResult={isQuickSearchResult}
                  rowIndex={startIndex + index}
                />
              ))}
            </tbody>
          </table>
        </div>
        <TablePagination
          page={currentPage}
          totalPages={totalPages}
          handlePageChange={handlePageChange}
        />
      </div>
    </div>
  )
}