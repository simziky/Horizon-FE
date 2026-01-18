import React from 'react';
import Image from 'next/image';
import { AmazonProduct, ProductObj, ReverseAmazon, ReverseAmazonScraped, QuickSearchResult } from "@/types/goCompare";

type ProductCardType = ProductObj | AmazonProduct | ReverseAmazon | ReverseAmazonScraped | QuickSearchResult;

interface SimpleProductCardProps {
  product: ProductCardType;
}

// Type guards to check for specific properties
const hasImageUrl = (product: unknown): product is { image_url: string } => 
  product !== null && typeof product === 'object' && 'image_url' in product && typeof (product as Record<string, unknown>).image_url === 'string';

const hasImages = (product: unknown): product is { images: string[] } => 
  product !== null && typeof product === 'object' && 'images' in product && Array.isArray((product as Record<string, unknown>).images);

const hasImage = (product: unknown): product is { image: string } => 
  product !== null && typeof product === 'object' && 'image' in product && typeof (product as Record<string, unknown>).image === 'string';

const hasProductName = (product: unknown): product is { product_name: string } => 
  product !== null && typeof product === 'object' && 'product_name' in product && typeof (product as Record<string, unknown>).product_name === 'string';

const hasTitle = (product: unknown): product is { title: string } => 
  product !== null && typeof product === 'object' && 'title' in product && typeof (product as Record<string, unknown>).title === 'string';

const hasName = (product: unknown): product is { name: string } => 
  product !== null && typeof product === 'object' && 'name' in product && typeof (product as Record<string, unknown>).name === 'string';

const hasPrice = (product: unknown): product is { price: string | number } => 
  product !== null && typeof product === 'object' && 'price' in product && 
  (typeof (product as Record<string, unknown>).price === 'string' || typeof (product as Record<string, unknown>).price === 'number');
  
const hasStore = (product: unknown): product is { store: string } => 
  product !== null && typeof product === 'object' && 'store' in product && typeof (product as Record<string, unknown>).store === 'string';

// Function to create a short name from the full product name
  const createShortName = (fullName: string): string => {
    if (!fullName) return 'Product Name';
    
    // Split by common separators and take first meaningful part
    const words = fullName.split(/[,\-|]/)[0].trim();
    
    // If still too long, take first 3-4 words
    const wordArray = words.split(' ');
    if (wordArray.length > 4) {
      return wordArray.slice(0, 4).join(' ') + '...';
    }
    
    // If single part is too long, truncate at character limit
    if (words.length > 50) {
      return words.substring(0, 47) + '...';
    }
    
    return words;
  };

  const SimpleProductCard: React.FC<SimpleProductCardProps> = ({ product }) => {
  // Extract product details with fallbacks
  let imageUrl = '';
  let productName = '';
  let price: string | number = 0;
  let storeName = '';

  try {
    // Handle different product data structures
    if (!product) {
      throw new Error("No product data");
    }

    // Extract image URL
    if (hasImageUrl(product)) {
      imageUrl = product.image_url;
    } else if (hasImages(product) && product.images.length > 0) {
      imageUrl = product.images[0];
    } else if (hasImage(product)) {
      imageUrl = product.image;
    }

    // Extract product name and create short version
    if (hasProductName(product)) {
      productName = createShortName(product.product_name);
    } else if (hasTitle(product)) {
      productName = createShortName(product.title);
    } else if (hasName(product)) {
      productName = createShortName(product.name);
    } else {
      productName = 'Product Name';
    }

    // Extract store name
    if (hasStore(product)) {
      storeName = product.store;
    } else if ('store_name' in product && typeof product.store_name === 'string') {
      storeName = product.store_name;
    } else if ('merchant' in product && typeof product.merchant === 'string') {
      storeName = product.merchant;
    } else {
      storeName = 'Unknown Store';
    }

    // Extract price
    if (hasPrice(product)) {
      if (typeof product.price === 'number') {
        price = product.price;
      } else if (typeof product.price === 'string') {
        // Try to extract numeric value from string with currency
        const numericPrice = parseFloat(product.price.replace(/[^0-9.]/g, ''));
        if (!isNaN(numericPrice)) {
          price = numericPrice;
        } else {
          price = product.price;
        }
      }
    }
  } catch (error) {
    console.error("Error processing product data:", error);
    // Set defaults if there's an error
    imageUrl = '';
    productName = 'Product Name';
    storeName = 'Unknown Store';
    price = 0;
  }

  // Format price to show with commas for thousands
  const formattedPrice = typeof price === 'string' && /[$£€]/.test(price)
    ? price
    : typeof price === 'number'
      ? new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price)
      : price;

  // Ensure currency sign is present
  const displayPrice = typeof price === 'string' && /[$£€]/.test(price)
    ? price
    : `$${formattedPrice}`;

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
            console.error("Image failed to load");
          }}
        />
      </div>
      <div className="mt-auto p-2">
        <div className="text-sm text-left mb-2 line-clamp-2 block" title={productName}>
          {productName}
        </div>
        <div className="flex flex-wrap items-center justify-between mt-2">
          <span className="text-xl font-bold">
            {displayPrice}
          </span>
          <span className="text-sm text-gray-600 font-medium">
            {storeName || "Unknown Store"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SimpleProductCard;