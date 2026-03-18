"use client";

import { useState, useEffect } from "react";
import { CustomPagination, SearchInput } from "@/components/ui";
import CircularLoader from "@/components/ui/CircularLoader";
import Image from "next/image";
import { useRouter } from "next/navigation";
import UFO from "@/public/assets/svg/ufo.svg";
import UFOIllustration from "@/components/ui/UFOIllustration";
import SalesStats from "./SalesStats";
import { useSearchItemsQuery } from "@/redux/api/productsApi";
import { useAppSelector } from "@/redux/hooks";

/* Skeleton for search result rows — matches 64px image + three text lines layout */
function ProductCardSkeleton() {
  return (
    <div className="px-4 py-3.5 flex flex-col sm:flex-row sm:items-center gap-4 animate-pulse">
      <div className="size-16 rounded-lg bg-gray-200 flex-shrink-0" />
      <div className="flex flex-col gap-2 flex-1">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="h-3 bg-gray-200 rounded w-2/5" />
      </div>
    </div>
  );
}
import { Product } from "@/types";

const Dashboard = () => {
  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [previousPageToken, setPreviousPageToken] = useState<string | null>(
    null
  );
  const [currentPageToken, setCurrentPageToken] = useState<string | null>(null);
  const [isPaginationLoading, setIsPaginationLoading] = useState(false);

  const router = useRouter();
  const { marketplaceId } = useAppSelector((state) => state?.global);

  // escapeRegExp function to handle special characters in search term
  function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  // Helper function to highlight search matches in text
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
    });
  };

  // Debounce input to prevent excessive API calls
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchValue), 500);
    return () => clearTimeout(handler);
  }, [searchValue]);

  // Fetch products
  const { data, error, isLoading, isFetching } = useSearchItemsQuery(
    debouncedSearch
      ? {
          q: debouncedSearch,
          marketplaceId: marketplaceId,
          //pageSize: itemsPerPage,
          pageToken: currentPageToken,
        }
      : undefined,
    { skip: !debouncedSearch }
  );

  // Reset pagination loading when data changes
  useEffect(() => {
    if (data || error) {
      setIsPaginationLoading(false);
    }
  }, [data, error]);
  //const totalResults = data?.data?.pagination?.total || 0;

  const products =
    debouncedSearch && data?.data?.items
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data.data.items.map((item: any) => ({
          asin: item.basic_details.asin,
          upc: item.basic_details.upc,
          image: item.basic_details.product_image,
          title: item.basic_details.product_name,
          rating: item.basic_details.rating.stars,
          reviews: item.basic_details.rating.count,
          category: item.basic_details.category || "N/A",
          vendor: item.basic_details.vendor,
          sales_statistics: item.sales_statistics,
          buybox_timeline: item.buybox_timeline,
        }))
      : [];

  // Update pagination tokens from API response
  useEffect(() => {
    if (data?.data?.pagination) {
      setNextPageToken(data.data.pagination.nextPageToken);
      setPreviousPageToken(data.data.pagination.previousPageToken);
    }
  }, [data]);

  // Reset pagination loading when data changes

  return (
    <section className="flex flex-col gap-8 min-h-[50dvh] md:min-h-[80dvh] rounded-xl bg-white p-4 lg:p-5">
      <SearchInput value={searchValue} onChange={setSearchValue} />
      {/* <h2>Selected Marketplace ID: {marketplaceId || "N/A"}</h2> */}

      {(isLoading || isFetching) && (
        <div className="p-2 rounded-lg border border-border flex flex-col divide-y divide-[#E4E4E7]">
          <span className="bg-[#FAFAFA] px-4 py-3.5">
            <div className="h-5 bg-gray-200 rounded w-24 animate-pulse" />
          </span>
          {Array.from({ length: 6 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      )}

      {error && (
        <div className="text-center text-red-500 mt-4">
          Failed to load products.
        </div>
      )}

      {(!debouncedSearch || products.length === 0) && !isLoading && !error && (
        <div className="flex flex-col gap-6 justify-center items-center my-auto">
          <UFOIllustration width={200} height={200} className="sm:size-[200px]" />
          <span className="text-center space-y-1">
            <h4 className="text-neutral-900 font-bold text-xl md:text-2xl">
              No products found
            </h4>
            <p className="text-[#52525B] text-sm">
              Try a different search term.
            </p>
          </span>
        </div>
      )}

      {products.length > 0 && (
        <main className="flex flex-col gap-20 justify-between h-full">
          <div className="p-2 rounded-lg border border-border flex flex-col divide-y divide-[#E4E4E7]">
            <span className="bg-[#FAFAFA] px-4 py-3.5">
              <h4 className="text-neutral-900 font-medium text-base md:text-lg">
                Product
              </h4>
            </span>

            {products.map((product: Product) => (
              <div
                key={product.asin}
                className="hover:bg-gray-50 duration-200 cursor-pointer px-4 py-3.5 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                <Image
                  onClick={() =>
                    router.push(`/dashboard/product/${product.asin}`)
                  }
                  src={product.image || UFO}
                  alt="product"
                  className="size-16 rounded-lg object-cover"
                  width={64}
                  height={64}
                  quality={90}
                  priority
                  unoptimized
                />
                <div className="flex flex-col gap-1 text-[#09090B]">
                  <p
                    onClick={() =>
                      router.push(`/dashboard/product/${product.asin}`)
                    }
                    className="font-bold hover:underline duration-100"
                  >
                    {highlightText(product.title, debouncedSearch)}
                  </p>
                  {/* <p>
                    {"⭐".repeat(product.rating || 0)}{" "}
                    <span className="font-bold">({product.reviews || 0})</span>
                  </p> */}
                  <p className="text-sm">
                    By ASIN: {highlightText(product.asin, debouncedSearch)},
                    UPC: {highlightText(product.upc || "N/A", debouncedSearch)}
                  </p>

                  <p className="text-sm">
                    {product.category} | <SalesStats product={product} />
                  </p>
                </div>
              </div>
            ))}
            {isPaginationLoading && (
              <CircularLoader
                duration={2000}
                color="#18CB96"
                size={64}
                strokeWidth={4}
              />
            )}
          </div>

          <CustomPagination
            onNext={() => {
              setIsPaginationLoading(true);
              setCurrentPageToken(nextPageToken);
            }}
            onPrevious={() => {
              setIsPaginationLoading(true);
              setCurrentPageToken(previousPageToken);
            }}
            hasNext={!!nextPageToken}
            hasPrevious={!!previousPageToken}
          />
        </main>
      )}
    </section>
  );
};

export default Dashboard;

