"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useRef } from "react"
import { SearchInput } from "@/components/ui"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { GoArrowUpRight } from "react-icons/go"
import { FiCopy, FiCheck } from "react-icons/fi"
import UFOIllustration from "@/components/ui/UFOIllustration"
import { useGetSearchHistoryQuery, useSearchProductsHistoryQuery } from "@/redux/api/productsApi"
import { useAppSelector } from "@/redux/hooks"
import BrandLoader from "@/components/ui/BrandLoader"
import SalesStats from "@/components/features/dashboard/SalesStats"
import PaginationComponent from "@/utils/paginationNumber"

export interface HistoryProduct {
  asin: string;
  upc?: string;
  image?: string;
  title: string;
  rating?: number;
  reviews?: number;
  category?: string;
  timestamp?: string;
  searchTerm?: string;
  vendor?: string;
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const groupByDate = (items: HistoryProduct[]) => {
  const grouped: Record<string, HistoryProduct[]> = {};

  items.forEach((item) => {
    const date = item.timestamp ? new Date(item.timestamp) : new Date();
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let dateKey;
    if (date.toDateString() === today.toDateString()) {
      dateKey = "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      dateKey = "Yesterday";
    } else {
      dateKey = date.toLocaleDateString();
    }

    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(item);
  });

  return grouped;
};

const History = () => {
  const [searchValue, setSearchValue] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [isPaginationLoading, setIsPaginationLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [isMarketplaceLoading, setIsMarketplaceLoading] = useState(false)
  const [copiedAsin, setCopiedAsin] = useState<string | null>(null)
  const prevMarketplaceRef = useRef<string | number | null>(null)

  const router = useRouter();
  const { marketplaceId } = useAppSelector((state) => state?.global);

  const highlightText = (text: string, search: string) => {
    if (!search.trim()) return text;

    const regex = new RegExp(`(${escapeRegExp(search)})`, "gi");
    const parts = text.split(regex);

    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return (
          <span key={index} className="bg-green-200">
            {part}
          </span>
        );
      } else {
        return part;
      }
    })
  }

  const copyToClipboard = async (asin: string) => {
    try {
      await navigator.clipboard.writeText(asin)
      setCopiedAsin(asin)
      setTimeout(() => setCopiedAsin(null), 2000) // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy ASIN:', err)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = asin
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
        setCopiedAsin(asin)
        setTimeout(() => setCopiedAsin(null), 2000)
      } catch (fallbackErr) {
        console.error('Fallback copy failed:', fallbackErr)
      }
      document.body.removeChild(textArea)
    }
  }

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchValue.trim() || "");
    }, 500);
    return () => clearTimeout(handler);
  }, [searchValue]);

  useEffect(() => {
    if (
      prevMarketplaceRef.current !== null &&
      prevMarketplaceRef.current !== marketplaceId
    ) {
      setIsMarketplaceLoading(true);
    }
    prevMarketplaceRef.current = marketplaceId;
  }, [marketplaceId]);

  const {
    data: historyData,
    error: historyError,
    isLoading: historyLoading,
    isFetching: historyFetching,
  } = useGetSearchHistoryQuery(
    {
      marketplaceId: marketplaceId || "1",
      page: currentPage,
      pageSize: itemsPerPage,
    },
    { skip: false }
  );

  const {
    data: productsData,
    error: productsError,
    isLoading: productsLoading,
    isFetching: productsFetching,
  } = useSearchProductsHistoryQuery(
    {
      q: debouncedSearch || "",
      marketplaceId: marketplaceId || "1",
      page: currentPage,
      perPage: itemsPerPage,
    },
    { skip: !debouncedSearch }
  );

  useEffect(() => {
    if (isMarketplaceLoading && !historyFetching && !productsFetching) {
      setIsMarketplaceLoading(false);
    }
  }, [historyFetching, productsFetching, isMarketplaceLoading]);

  useEffect(() => {
    const data = debouncedSearch ? productsData : historyData;

    if (data) {
      if (data.meta) {
        setCurrentPage(data.meta.current_page || 1);
        setTotalPages(data.meta.last_page || 1);
        setTotalItems(data.meta.total || 0);
        setItemsPerPage(data.meta.per_page || 10);
      }
    }
  }, [historyData, productsData, debouncedSearch, itemsPerPage]);

  useEffect(() => {
    if (historyData || productsData || historyError || productsError) {
      setIsPaginationLoading(false);
    }
  }, [historyData, productsData, historyError, productsError]);

  const isLoading = historyLoading || productsLoading || isMarketplaceLoading;
  const error = historyError || productsError;

  const handlePageNumberChange = (page: number) => {
    if (page === currentPage) return;
    setIsPaginationLoading(true);
    setCurrentPage(page);
  };

  const historyItems: HistoryProduct[] = historyData?.data
    ? historyData.data.map((item: any) => ({
        asin: item.asin || "N/A",
        upc: item.upc || "N/A",
        image: item.product_image,
        title: item.product_name || item.search_term || "Unknown search",
        rating: item.rating?.stars || 0,
        reviews: item.rating?.count || 0,
        category: item.category || "N/A",
        timestamp: item.timestamp || new Date().toISOString(),
        vendor: item.vendor,
      }))
    : [];

  const productItems: HistoryProduct[] = productsData?.data
    ? productsData.data.map((item: any) => ({
        asin: item.asin || "N/A",
        upc: item.upc || "N/A",
        image: item.product_image,
        title: item.product_name || "Unknown product",
        rating: item.rating?.stars || 0,
        reviews: item.rating?.count || 0,
        category: item.category || "N/A",
        timestamp: item.timestamp || new Date().toISOString(),
        vendor: item.vendor,
      }))
    : [];

  const displayItems = debouncedSearch ? productItems : historyItems;
  const groupedItems = groupByDate(displayItems);

  const marketplaceMap: Record<string, { name: string; flag: string }> = {
    "1": { name: "US", flag: "us" },
    "6": { name: "Canada", flag: "ca" },
    "11": { name: "Mexico", flag: "mx" },
  };

  return (
    <section className="flex flex-col gap-8 min-h-[50dvh] md:min-h-[80dvh] rounded-xl bg-white p-4 lg:p-5">
      <div className="flex flex-col gap-4">
        <h1 className="text-[#171717] font-medium text-xl md:text-2xl">
          Search History
        </h1>
        <SearchInput
          placeholder="Search your history..."
          value={searchValue}
          onChange={setSearchValue}
        />
      </div>

      {isLoading && !isPaginationLoading && (
        <div className="p-2 rounded-lg border border-border flex flex-col divide-y divide-[#E4E4E7]">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="px-4 py-3.5 flex flex-col sm:flex-row sm:items-center gap-4 animate-pulse">
              <div className="size-16 rounded-lg bg-gray-200 flex-shrink-0" />
              <div className="flex flex-col gap-2 flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-200 rounded w-2/5" />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="text-center text-red-500 mt-4">
          Failed to load search history.
        </div>
      )}

      {displayItems.length === 0 && !isLoading && !error && (
        <div className="flex flex-col gap-6 justify-center items-center my-auto">
          <UFOIllustration width={200} height={200} className="sm:size-[200px]" />
          <span className="text-center space-y-1">
            <h4 className="text-neutral-900 font-bold text-xl md:text-2xl">
              No search history found
            </h4>
            <p className="text-[#52525B] text-sm">
              Your search history will appear here.
            </p>
          </span>
        </div>
      )}

      {displayItems.length > 0 && (
        <main className="flex flex-col gap-10 justify-between h-full">
          {isPaginationLoading && (
            <div className="flex justify-center items-center py-16 bg-white rounded-lg border border-border">
              <BrandLoader size={56} />
            </div>
          )}

          {!isPaginationLoading && (
            <div className="p-2 rounded-lg border border-border flex flex-col divide-y divide-[#E4E4E7]">
              {Object.entries(groupedItems).map(([date, items]) => (
                <div key={date} className="flex flex-col">
                  <span className="py-2 text-[#95A4B7] border-b border-gray-50 uppercase font-bold text-sm">
                    {date}
                  </span>

                  {items.map((item, index) => (
                    <div
                      key={`${item.asin}-${index}`}
                      className="hover:bg-gray-50 duration-200 cursor-pointer px-4 py-3.5 flex flex-col sm:flex-row sm:items-center gap-4"
                    >
                      {item.image ? (
                        <Image
                          src={item.image || "/placeholder.svg"}
                          alt="product"
                          className="size-16 rounded-lg object-cover"
                          width={64}
                          height={64}
                          quality={90}
                          priority
                          unoptimized
                        />
                      ) : (
                        <div className="rounded-full size-16 bg-[#F7F7F7] flex items-center justify-center">
                          <GoArrowUpRight className="size-8" />
                        </div>
                      )}
                      <div className="flex flex-col gap-1 text-[#09090B]">
                        <p
                          onClick={() =>
                            router.push(`/dashboard/product/${item.asin}`)
                          }
                          className="font-bold hover:underline duration-100"
                        >
                          {highlightText(item.title, debouncedSearch)}
                        </p>
                        {item.rating !== undefined && item.rating > 0 && (
                          <p>
                            {"⭐".repeat(Math.min(item.rating, 5))}{" "}
                            <span className="font-bold">
                              ({item.reviews || 0})
                            </span>
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-sm">
                          <span>By ASIN: {highlightText(item.asin, debouncedSearch)}</span>
                          {item.asin !== "N/A" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                copyToClipboard(item.asin)
                              }}
                              className="inline-flex items-center justify-center p-1 rounded hover:bg-gray-200 transition-colors duration-200"
                              title="Copy ASIN"
                            >
                              {copiedAsin === item.asin ? (
                                <FiCheck className="size-3 text-green-600" />
                              ) : (
                                <FiCopy className="size-3 text-gray-600 hover:text-gray-800" />
                              )}
                            </button>
                          )}
                          <span>, UPC: {highlightText(item.upc || "N/A", debouncedSearch)}</span>
                        </div>
                        {item.category && (
                          <p className="text-sm">
                            {item.category === "NaN" ? "N/A" : item.category} |{" "}
                            <SalesStats product={item} />
                          </p>
                        )}
                        {item.vendor && (
                          <p className="text-sm">Store: {item.vendor}</p>
                        )}

                        <div className="flex gap-2 items-center">
                          {marketplaceId &&
                            marketplaceMap[String(marketplaceId)] && (
                              <p className="text-sm flex items-center gap-2">
                                <Image
                                  src={`https://flagcdn.com/w40/${
                                    marketplaceMap[String(marketplaceId)].flag
                                  }.png`}
                                  alt={
                                    marketplaceMap[String(marketplaceId)].name
                                  }
                                  className="w-5 h-auto object-cover"
                                  width={20}
                                  height={24}
                                  quality={90}
                                  priority
                                  unoptimized
                                />
                                {marketplaceMap[String(marketplaceId)].name}
                              </p>
                            )}

                          <span className="size-2 bg-black rounded-full" />

                          {item.timestamp && (
                            <p className="text-sm">
                              {new Intl.DateTimeFormat("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                                hour12: true,
                                timeZone: "UTC",
                              }).format(new Date(item.timestamp))}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col-reverse md:flex-row sm:gap-4 items-center">
            <div className="flex-1 flex justify-center">
              <PaginationComponent
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageNumberChange}
                isLoading={isPaginationLoading}
                itemsPerPage={itemsPerPage}
                totalItems={totalItems}
              />
            </div>
          </div>
        </main>
      )}
    </section>
  );
};

export default History;
