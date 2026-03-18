import { ProductObj, ReverseAmazonScraped } from '@/types/goCompare';
import React from 'react';
import Image from 'next/image';

interface ActiveProductProp {
    activeProduct: ProductObj | ReverseAmazonScraped | null | undefined;
}

const Overlay = ({ activeProduct }: ActiveProductProp) => {
    if (!activeProduct) return null;

    const isScrapedProduct = 'scraped_product' in activeProduct && 'store' in activeProduct;

    const imageSrc = isScrapedProduct ? activeProduct.scraped_product.store_logo_url : activeProduct.image;
    const altText = isScrapedProduct ? activeProduct.scraped_product.product_name : activeProduct.name;
    const productName = isScrapedProduct ? activeProduct.scraped_product.product_name : activeProduct.name;
    const subText = isScrapedProduct ? activeProduct.store.name : activeProduct.brand;
    
    return (
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 w-64 cursor-pointer">
            <div className="flex items-center gap-2">
                <div className="w-10 h-10 relative rounded overflow-hidden flex-shrink-0 flex items-center justify-center">
                    <Image 
                        src={imageSrc?.startsWith('data:') ? imageSrc : imageSrc?.includes(',') ? imageSrc : `data:image/png;base64,${imageSrc}`} 
                        alt={altText || "Product image"} 
                        width={40}
                        height={40}
                        className="object-contain" 
                        onError={() => {
                            // Handle error with placeholder
                            const imgElement = document.createElement('img');
                            imgElement.src = "https://via.placeholder.com/40?text=Image";
                            imgElement.alt = "Placeholder";
                            imgElement.className = "object-contain w-10 h-10";
                            const parent = document.querySelector('.w-10.h-10.relative');
                            if (parent) {
                                parent.innerHTML = '';
                                parent.appendChild(imgElement);
                            }
                        }}
                    />
                </div>
                <div className="flex-1">
                    <p className="text-sm font-medium line-clamp-1">{productName}</p>
                    <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-500">{subText}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Overlay;
