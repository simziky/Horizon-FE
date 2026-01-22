"use client"

import Image from "next/image"
import { useParams, useRouter } from "next/navigation"
import { useLazyGetSellerDetailsQuery, useLazyGetSellerProductsQuery } from "@/redux/api/sellerApi"
import { useCallback, useEffect, useState } from "react"
import { useAppSelector } from "@/redux/hooks"
import { message } from "antd"
import CustomPagination from "../../_components/CustomPagination"
import Link from "next/link"

import { FaGoogle } from "react-icons/fa6"
import AmazonIcon from "@/public/assets/svg/amazon-icon.svg"
import { SearchInput } from "@/app/(dashboard)/_components"
import FilterPopup from "./filter-popup"
import { HiOutlineUsers } from "react-icons/hi2"
import KeepaChart from "./keepa-chart"
import { debounce } from "@/utils/debounce"
import FinalLoader from "../../dashboard/_components/loader"
import MonitorButton from "./MonitorButton"

// Define the Product interface
export interface Product {
  basic_details: {
    product_image: string
    product_name: string
    rating: {
      stars: number
      count: number
    }
    vendor: string
    asin: string
    upc: string
    category: string
  }
  buybox_details: {
    bsr: number
    est_sales: number
    max_cost: number | null
    offers_count: {
      amz: number
      fba: number
      fbm: number
    }
    buybox_price: number
    store_stock: number | null
    currency: string
  }
  top_five_offers: Array<{
    seller_id: string
    seller_name: string
    rating: number
    review_count: number
    listing_price: number
    shipping: number
    avg_price: number
    weight_percentage: number
    percentage_won: number
    last_won: string
    stock_quantity: number
    is_buybox_winner: boolean
    seller_type: string
    currency: string
  }>
  amazon_link: string
  chart: {
    [key: string]: {
      amazon: Array<{ date: string; price: number }>
      sales_rank: Array<{ date: string; price: number }>
      new_fba: Array<{ date: string; price: number }>
    }
  }
}

// Define the Brand interface
interface Brand {
  amazon_link: string
  brand_name: string
  count: number
}

// Define the Category interface
interface Category {
  amazon_link: string
  category_name: string
  count: number
  category_id: number
}

interface FilterParams {
  estimatedSale?: string
  buyboxAmount?: number
  offer?: string
  minBsr?: number
  maxBsr?: number
  brandName?: string
  categoryId?:string|number
}

interface SellerProductsParams {
  marketplaceId: number
  sellerId: string | number
  perPage: number
  pageToken?: string
  q?: string
  estimatedSale?: string
  buyboxAmount?: number
  offer?: string
  minBsr?: number
  maxBsr?: number
  brandName?: string
  categoryId?:string | number
}

const Seller = () => {
  const router = useRouter()
  const params = useParams()
  const sellerId = Array.isArray(params?.sellerId) ? params.sellerId[0] : params?.sellerId
  const { marketplaceId } = useAppSelector((state) => state?.global)
  const [nextPageToken, setNextPageToken] = useState<string | null>(null)
  const [previousPageToken, setPreviousPageToken] = useState<string | null>(null)
  const [currentPageToken, setCurrentPageToken] = useState<string | null>(null)
  const [getSellerDetails, { data, isLoading: detailsLoading }] = useLazyGetSellerDetailsQuery()
  const [getSellerProducts, { data: productsData, isLoading: productLoading }] = useLazyGetSellerProductsQuery()
  const [loading, setLoading] = useState(true)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [messageApi, contextHolder] = message.useMessage()
  const [searchValue, setSearchValue] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState<FilterParams>({})

  useEffect(() => {
    if (sellerId && marketplaceId) {
      getSellerDetails({ seller_id: sellerId, id: marketplaceId })
    }
  }, [sellerId, marketplaceId, getSellerDetails])

  useEffect(() => {
    if (sellerId && marketplaceId) {
      setLoading(true)

      const params: SellerProductsParams = {
        marketplaceId,
        sellerId,
        perPage: 10,
      }

      // Only add pageToken if it exists
      if (currentPageToken) {
        params.pageToken = currentPageToken
      }

      // Add search query if present
      if (searchQuery) {
        params.q = searchQuery
      }

      // Add filters only if they exist
      if (filters.estimatedSale) params.estimatedSale = filters.estimatedSale
      if (filters.buyboxAmount) params.buyboxAmount = filters.buyboxAmount
      if (filters.offer) params.offer = filters.offer
      if (filters.minBsr) params.minBsr = filters.minBsr
      if (filters.maxBsr) params.maxBsr = filters.maxBsr
      if (filters.brandName) params.brandName = filters.brandName
      if (filters.categoryId) params.categoryId = filters.categoryId

      getSellerProducts(params)
        .unwrap()
        .catch((error) => {
          // Handle API validation errors
          if (error.data?.errors?.maxBsr) {
            message.error(error.data.errors.maxBsr[0])
          }
        })
        .finally(() => setLoading(false))
    }
  }, [currentPageToken, sellerId, marketplaceId, getSellerProducts, filters, searchQuery])

  useEffect(() => {
    if (productsData?.data?.pagination) {
      setNextPageToken(productsData.data.pagination.nextPageToken)
      setPreviousPageToken(productsData.data.pagination.previousPageToken)
    }
  }, [productsData])

  // Extract seller details safely
  const seller = data?.data
  const products: Product[] = productsData?.data?.items || []

  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setSearchQuery(value)
      setCurrentPageToken(null)
    }, 500),
    [setSearchQuery, setCurrentPageToken],
  )

  const handleSearch = (value: string) => {
    setSearchValue(value)
    debouncedSearch(value)
  }

  useEffect(() => {
    return () => {
      debouncedSearch.cancel()
    }
  }, [debouncedSearch])

  const onSearchChange = (value: string) => {
    setSearchValue(value)
    handleSearch(value)
  }

  // Add this handler for filters
  const handleFilterApply = (newFilters: FilterParams) => {
    setFilters(newFilters)
    setCurrentPageToken(null)
  }
const handleBrandClick = (brandName: string) => {
  // Clear category filter when selecting a brand
  const newFilters = { ...filters, brandName, categoryId: undefined }
  setFilters(newFilters)
  setCurrentPageToken(null)
}
const handleCategoryClick = (categoryId: number) => {
  // Clear brand filter when selecting a category
  const newFilters = { ...filters, categoryId, brandName: undefined }
  setFilters(newFilters)
  setCurrentPageToken(null)
}

  const isLoading = detailsLoading || productLoading

  // Track loader steps
  const [currentStep, setCurrentStep] = useState(0)

  // Update steps based on loading progress
  useEffect(() => {
    if (!isLoading) return

    let step = 0
    if (!detailsLoading) step += 2
    if (!productLoading) step += 2
    setCurrentStep(Math.min(step, 4))
  }, [detailsLoading, productLoading, isLoading])

  return (
    <section className="flex flex-col gap-8 min-h-[50dvh] md:min-h-[80dvh] bg-white p-2 rounded-lg">
      {contextHolder}

      {isLoading ? (
        <FinalLoader currentStep={currentStep} />
      ) : (
        <>
          {/* nav */}
          <div className="rounded-xl border border-border p-4 flex flex-col gap-2">
            <p className="text-[#676A75] text-xs font-medium">Navigation</p>

            <div className="flex items-center gap-4">
              <Link
                href={seller?.google_link || ""}
                className="size-12 flex items-center justify-center rounded-lg bg-[#F3F4F6]"
              >
                <FaGoogle className="size-6 text-[#0F172A]" />
              </Link>

              <Link
                href={seller?.amazon_link || ""}
                target="_blank"
                className="size-12 flex items-center justify-center rounded-lg bg-[#F3F4F6]"
              >
                <Image src={AmazonIcon || "/placeholder.svg"} alt="Amazon icon" width={32} height={32} />
              </Link>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 gap-y-6">
            {/* store details */}
            <div className="rounded-lg border border-border flex flex-col divide-y divide-[#EDEDED] text-[#252525] text-sm">
              <span className="p-4 border-b border-border mb-2 flex justify-between items-center">
                <p className="bg-primary rounded-2xl py-2 px-4 text-white font-semibold w-max">Store Details</p>
                {sellerId && marketplaceId && (
                  <MonitorButton sellerId={sellerId} marketplaceId={marketplaceId} />
                )}
              </span>
              <span className="p-4 bg-[#F7F7F7] flex justify-between items-center font-medium">
                <p>Seller Name</p>
                <p>{seller?.name || "N/A"}</p>
              </span>
              <span className="p-4 flex justify-between items-center">
                <p>Seller ID</p>
                <p>{seller?.id || "N/A"}</p>
              </span>
              <span className="p-4 bg-[#F7F7F7] flex justify-between items-center">
                <p>Rating</p>
                <p>
                  {seller?.rating_percentage}% ({seller?.rating})
                </p>
              </span>
              <span className="p-4 flex justify-between items-center">
                <p>ASIN Count</p>
                <p>{seller?.asin_count || 0}</p>
              </span>
              <span className="p-4">
                <p className="bg-[#F3F4F6] rounded-lg py-1 px-2">
                  ASIN, brand and category counts are a guide and not exact
                </p>
              </span>
            </div>

            {/* top brands */}
            <div className="rounded-lg border border-border flex flex-col divide-y divide-[#EDEDED] text-[#252525] text-sm">
              <span className="p-4 border-b border-border mb-2">
                <p className="bg-[#F3F4F6] rounded-2xl py-2 px-4 text-[#676A75] font-semibold w-max">Top Brands</p>
              </span>
              <span className="flex items-center justify-between p-4 bg-[#F7F7F7] font-medium">
                <p className="">Brand Name</p>
                <p className="">Product Count</p>
              </span>

              {seller?.top_brands?.map((brand: Brand, index: number) => (
                <div key={index} className="flex items-center justify-between p-4 hover:bg-gray-50">
                  <button
                    onClick={() => handleBrandClick(brand.brand_name)}
                    className="underline text-left hover:text-primary transition-colors"
                  >
                    {brand.brand_name}
                  </button>
                  <p>{brand.count}</p>
                </div>
              ))}
            </div>

            {/* top category */}
            <div className="rounded-lg border border-border flex flex-col divide-y divide-[#EDEDED] text-[#252525] text-sm">
              <span className="p-4 border-b border-border mb-2">
                <p className="bg-[#F3F4F6] rounded-2xl py-2 px-4 text-[#676A75] font-semibold w-max">Top Categories</p>
              </span>
              <span className="flex items-center justify-between p-4 bg-[#F7F7F7] font-medium">
                <p className="">Category Name</p>
                <p className="">Product Count</p>
              </span>
              <div className="">
                {seller?.top_categories?.map((category: Category, index: number) => (
                  <div key={index} className="flex items-center justify-between p-4 hover:bg-gray-50">
                    <button onClick={()=> handleCategoryClick(category.category_id)}
                    className="underline">
                      {category.category_name}
                    </button>
                    <p>{category.count}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-2 rounded-lg border border-border flex items-center gap-6">
            <SearchInput
              value={searchValue}
              onChange={onSearchChange}
              placeholder="Search for Products on Amazon (For best results use specific keywords, UPC code, ASIN or ISBN code)"
              className="!max-w-screen-md"
            />

            <FilterPopup onApply={handleFilterApply} />
          </div>

          {/* Show loading spinner only for products */}
          {productLoading || loading ? (
            <div className="mx-auto animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
          ) : (
            /* seller's products */
            <main className="flex flex-col gap-20 justify-between h-full">
              <div className="flex flex-col gap-6">
                {/* No results message */}
                {!loading && !productLoading && products.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-lg font-medium text-gray-500">No products found matching your criteria</p>
                    <p className="text-sm text-gray-400 mt-2">Try adjusting your search or filters</p>
                  </div>
                )}

                {products?.map((product, index) => {
                  const basicDetails = product?.basic_details || {}

                  return (
                    <div key={index}>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-[3fr_2fr_2fr] xl:grid-cols-[4fr_2fr_2fr] gap-2 gap-y-4 items-stretch">
                        {/* Product Image and Basic Info */}
                        <div className="flex flex-col divide-y divide-border rounded-xl border border-border h-full">
                          <div className="flex flex-col sm:flex-row items-center gap-4 p-3">
                            <div
                              className="relative w-full max-w-[166px] h-[197px] bg-[#F3F4F6]"
                              onClick={() => router.push(`/dashboard/product/${basicDetails?.asin}`)}
                            >
                              <Image
                                src={basicDetails.product_image || "/placeholder.svg"}
                                alt={basicDetails.product_name}
                                className="size-full object-cover cursor-pointer rounded-lg"
                                fill
                                priority
                                quality={90}
                                unoptimized
                              />
                            </div>

                            <div className="flex flex-col gap-1.5 text-[#5B656C]">
                              <div className="flex items-center gap-4">
                                <button
                                  type="button"
                                  aria-label="Search on Google"
                                  onClick={() => {
                                    const query = encodeURIComponent(`${basicDetails.product_name} supplier`)
                                    window.open(`https://www.google.com/search?q=${query}`, "_blank")
                                  }}
                                  className="size-12 flex items-center justify-center rounded-lg bg-[#F3F4F6]"
                                >
                                  <FaGoogle className="size-6 text-[#0F172A]" />
                                </button>

                                <Link
                                  href={product?.amazon_link || "#"}
                                  {...(product?.amazon_link && {
                                    target: "_blank",
                                  })}
                                  className="size-12 flex items-center justify-center rounded-lg bg-[#F3F4F6]"
                                >
                                  <Image
                                    src={AmazonIcon || "/placeholder.svg"}
                                    alt="Amazon icon"
                                    width={32}
                                    height={32}
                                  />
                                </Link>
                              </div>

                              <p
                                onClick={() => router.push(`/dashboard/product/${basicDetails?.asin}`)}
                                className="font-bold hover:underline duration-100 cursor-pointer"
                              >
                                {basicDetails.product_name}
                              </p>
                              <div className="flex items-center gap-1 mt-1">
                                <div className="flex">{"⭐".repeat(Math.floor(basicDetails.rating?.stars || 0))}</div>
                                <span className="text-sm text-gray-600">
                                  {basicDetails.rating?.stars}/5
                                  {/* ({basicDetails.rating?.count} reviews) */}
                                </span>
                              </div>

                              <p className="text-sm mt-1">
                                ASIN: {basicDetails.asin}, UPC: {basicDetails.upc || "N/A"}
                              </p>
                              <p className="text-sm">Category: {basicDetails.category}</p>

                              <p className="text-lg font-bold mt-2">
                                {product.buybox_details.currency}
                                {product.buybox_details.buybox_price.toFixed(2)}
                              </p>
                            </div>
                          </div>

                          {/* Product stats */}
                          <div className="text-sm p-3">
                            <div className="bg-[#F3F4F6E0] text-[#596375] text-xs p-2 px-3 rounded-lg flex items-center gap-4 flex-wrap justify-between">
                              <div className="flex flex-col">
                                <span className="text-gray-500">BSR</span>
                                <span className="font-semibold text-[#8E949F] text-sm">
                                  {product.buybox_details.bsr.toLocaleString()}
                                </span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-gray-500">Est. Sales</span>
                                <span className="font-semibold text-[#8E949F] text-sm">
                                  {product.buybox_details.est_sales.toLocaleString()}
                                </span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-gray-500">Max Cost</span>
                                <span className="font-semibold text-[#8E949F] text-sm">
                                  {product.buybox_details.max_cost || "N/A"}
                                </span>
                              </div>
                              <div className="flex flex-col">
                                <div className="text-gray-500">
                                  Offer:{" "}
                                  {product.buybox_details.offers_count.amz +
                                    product.buybox_details.offers_count.fba +
                                    product.buybox_details.offers_count.fbm}
                                </div>
                                <div className="font-semibold flex gap-2">
                                  <span className="text-[#FF9B06] bg-white p-1 rounded-lg">
                                    AMZ: {product.buybox_details.offers_count.amz}
                                  </span>
                                  <span className="text-black bg-white p-1 rounded-lg">
                                    FBA: {product.buybox_details.offers_count.fba}
                                  </span>
                                  <span className="text-[#009F6D] bg-white p-1 rounded-lg">
                                    FBM: {product.buybox_details.offers_count.fbm}
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-gray-500">Buy Box</span>
                                <span className="font-semibold text-[#8E949F] text-sm">
                                  {product.buybox_details.currency}
                                  {product.buybox_details.buybox_price.toFixed(2)}
                                </span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-gray-500">Store Stock</span>
                                <span className="font-semibold text-[#8E949F] text-sm">
                                  {product.buybox_details.store_stock ?? "N/A"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Top 5 Offers */}
                        <div className="rounded-xl border border-border overflow-hidden h-full">
                          <div className="p-4">
                            <p className="bg-primary flex items-center gap-1 rounded-2xl py-2 px-4 text-white font-semibold w-max text-xs">
                              <HiOutlineUsers className="size-4" />
                              Top 5 Offers
                            </p>
                          </div>

                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-[#F7F7F7] text-[#252525]">
                                  <th className="p-4 text-left">S/N</th>
                                  <th className="p-4 text-left">Seller</th>
                                  <th className="p-4 text-left">Price</th>
                                  <th className="p-4 text-left">Stock</th>
                                </tr>
                              </thead>
                              <tbody>
                                {product.top_five_offers.map((offer, idx) => (
                                  <tr
                                    key={idx}
                                    className={`border-t border-gray-100 hover:bg-gray-50 ${
                                      offer.is_buybox_winner ? "bg-yellow-50" : ""
                                    }`}
                                  >
                                    <td className="p-4">{idx + 1}</td>
                                    <td className="p-4">
                                      <span
                                        className={`px-2 py-1 rounded text-xs font-semibold ${
                                          offer.seller_type === "FBA"
                                            ? "text-black bg-gray-100"
                                            : offer.seller_type === "FBM"
                                              ? "text-[#009F6D] bg-[#EDF7F5]"
                                              : "text-[#FF9B06] bg-[#FDF5E9]"
                                        }`}
                                      >
                                        {offer.seller_type}
                                      </span>
                                    </td>
                                    <td className="p-4">
                                      {offer.currency}
                                      {(offer.listing_price + offer.shipping).toFixed(2)}
                                    </td>
                                    <td className="p-4">{offer.stock_quantity}</td>
                                  </tr>
                                ))}
                                {product.top_five_offers.length === 0 && (
                                  <tr>
                                    <td colSpan={4} className="p-4 text-center text-gray-500">
                                      No offers available
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Keepa Chart */}
                        <div className="relative h-full">
                          <KeepaChart 
                            chartData={product?.chart} 
                            currency={product?.buybox_details.currency} 
                            asin={basicDetails?.asin}
                            index={index}
                          />
                          
                          {/* Blur overlay for non-first rows */}
                          {index > 0 && (
                            <div className="absolute inset-0 bg-white/15 backdrop-blur-[2px] rounded-xl flex items-center justify-center">
                              <button
                                onClick={() => window.open(`/keepa?asin=${basicDetails.asin}`, '_blank', 'noopener,noreferrer')}
                                className="bg-primary hover:bg-primary/90 text-white rounded-lg px-6 py-3 text-sm font-semibold shadow-lg transition-colors"
                              >
                                View Keepa
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* pagination */}
              {products.length > 0 && (
                <CustomPagination
                  onNext={() => setCurrentPageToken(nextPageToken)}
                  onPrevious={() => setCurrentPageToken(previousPageToken)}
                  hasNext={!!nextPageToken}
                  hasPrevious={!!previousPageToken}
                />
              )}
            </main>
          )}
        </>
      )}
    </section>
  )
}

export default Seller
