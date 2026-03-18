import Link from "next/link";
import Image from "next/image";
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { AmazonProduct, ProductObj, ReverseAmazon, ReverseAmazonScraped, QuickSearchResult } from "@/types/goCompare";

type ProductCardType = ProductObj | AmazonProduct | ReverseAmazon | ReverseAmazonScraped | QuickSearchResult;

interface ProductCardProps {
  product: ProductCardType;
}

const getCurrencySign = (currency: string | number | undefined): string => {
  switch (currency) {
    case "GBP":
    case 2:
      return "£"
    case "USD":
    case "$":
    case 1:
      return "$"
    case "CAD":
    case 3:
      return "C$"
    default:
      return ""
  }
}

export function ProductCard({ product }: ProductCardProps) {

  if (!product) return null;

  const isAmazonProduct = (p: ProductCardType): p is AmazonProduct => 'store' in p && 'pricing' in p;
  const isProductObj = (p: ProductCardType): p is ProductObj => 'scraped_product' in p;
  const isReverseAmazonScraped = (p: ProductCardType): p is ReverseAmazonScraped => 'id' in p && 'image' in p && 'price' in p && 'name' in p;
  const isQuickSearchResult = (p: ProductCardType): p is QuickSearchResult => 'store_name' in p && 'asin' in p;

  let imageUrl = "";
  let productUrl = "";
  let productName = "";
  let logoUrl = "";
  let currencySign = "";
  let price: number | string = "";

  try {
    if (isAmazonProduct(product)) {
      imageUrl = product.image_url || '';
      productUrl = product.page_url || '#';
      productName = product.product_name || 'Product Name';
      logoUrl = product.store && product.store.logo ? product.store.logo : '';
      currencySign = getCurrencySign(product.store && product.store.country_id ? product.store.country_id : 1);
      price = product.pricing && product.pricing.current_price ? product.pricing.current_price : 0;
    }
    else if (isProductObj(product)) {
      imageUrl = product.scraped_product && product.scraped_product.image_url ? product.scraped_product.image_url : '';
      productUrl = product.scraped_product && product.scraped_product.product_url ? product.scraped_product.product_url : '#';
      productName = product.scraped_product && product.scraped_product.product_name ? product.scraped_product.product_name : 'Product Name';
      logoUrl = product.scraped_product && product.scraped_product.store_logo_url ? product.scraped_product.store_logo_url : '';
      currencySign = getCurrencySign(product.scraped_product && product.scraped_product.price && product.scraped_product.price.currency ? product.scraped_product.price.currency : '');
      price = product.scraped_product && product.scraped_product.price && product.scraped_product.price.amount ? product.scraped_product.price.amount : 0;
    }
    else if (isReverseAmazonScraped(product)) {
      imageUrl = product.image || '';
      productUrl = product.url || '#';
      productName = product.name || 'Product Name';
      logoUrl = product.store && product.store.logo ? product.store.logo : '';
      currencySign = getCurrencySign(product.currency || '');
      price = product.price || 0;
    } 
    else if (isQuickSearchResult(product)) {
      imageUrl = product.image_url || '';
      productUrl = product.product_url || '#';
      productName = product.product_name || 'Product Name';
      logoUrl = '';  // QuickSearchResult typically doesn't have a logo URL
      currencySign = getCurrencySign(product.currency || '$');
      price = product.price || 0;
    } 
    else {
      // Handle any other type as fallback
      imageUrl = (product as any).image_url || (product as any).image || '';
      productUrl = (product as any).product_url || (product as any).url || '#';
      productName = (product as any).product_name || (product as any).name || 'Product Name';
      
      // Handle store logo safely
      if (('store' in product && product.store && typeof product.store === 'object' && product.store.logo)) {
        logoUrl = product.store.logo;
      } else if ((product as any).store_logo_url) {
        logoUrl = (product as any).store_logo_url;
      } else {
        logoUrl = '';
      }
      
      currencySign = getCurrencySign((product as any).currency || 1);
      price = (product as any).price || 0;
      
      // If price is a string with currency symbol, try to extract just the number
      if (typeof price === 'string' && /[$£€]/.test(price)) {
        const numericPrice = parseFloat(price.replace(/[$£€,]/g, ''));
        if (!isNaN(numericPrice)) {
          price = numericPrice;
          // Don't add currency sign since it already has one
          currencySign = '';
        }
      }
    }
  } catch (error) {
    console.error("Error processing product data:", error);
    // Set defaults if there's an error
    imageUrl = '';
    productUrl = '#';
    productName = 'Product Name';
    logoUrl = '';
    currencySign = '$';
    price = 0;
  }

  // Format price to show with commas for thousands
  // If price is a string with currency symbol, use it as-is without adding currency sign
  const formattedPrice = typeof price === 'string' && /[$£€]/.test(price)
    ? price
    : typeof price === 'number'
      ? new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price)
      : price;

  // Determine marketplace logo
  let marketplaceLogo = "";
  const storeName = (product as any).store_name || 
                   ('store' in product && product.store && typeof product.store === 'object' ? product.store.name : null) || 
                   "";
  
  if (isAmazonProduct(product) || storeName.toLowerCase().includes("amazon")) {
    marketplaceLogo = "/assets/images/amazon-logo.png"; // Adjust path as needed
  } else if (storeName.toLowerCase().includes("ebay") || logoUrl?.toLowerCase()?.includes("ebay")) {
    marketplaceLogo = "/assets/images/ebay-logo.png"; // Adjust path as needed
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden p-2.5 pb-0 flex flex-col h-full min-h-[250px] max-h-[326px]">
      <div className="relative flex-grow flex items-center justify-center p-2">
        <Image 
          src={imageUrl || "https://via.placeholder.com/150?text=No+Image"}
          alt={productName || "Product"} 
          className="object-contain w-full max-h-[180px] rounded-md"
          width={180}
          height={180}
          unoptimized={imageUrl?.startsWith('data:') || !imageUrl}
          onError={() => {
            // Handle error in a Next.js compatible way
            console.error("Image failed to load");
          }}
        />
      </div>
      <div className="mt-auto p-2">
        <Link className="text-sm text-left mb-2 line-clamp-2 hover:underline block"
          target="_blank" rel="noopener noreferrer" href={productUrl || "#"}
        >
          {productName}
        </Link>
        <div className="flex flex-wrap items-center justify-between mt-2">
          <span className="text-xl font-bold">
            {typeof price === 'string' && /[$£€]/.test(price) ? formattedPrice : `${currencySign}${formattedPrice}`}
          </span>
          <span className="text-sm text-gray-600 font-medium">
            {storeName || "Unknown Store"}
          </span>
        </div>
      </div>
    </div>
  );
}


