"use client";

import React, { useMemo } from "react";
import { useParams } from "next/navigation";
import ProductDetails from "@/components/features/dashboard/ProductDetails";
import { useAppSelector } from "@/redux/hooks";

export interface ProductDetailsProps {
  asin: string;
  marketplaceId: number;
}

const ProductPage = React.memo(() => {
  const params = useParams();
  const asin = params?.asin as string;
  const marketplaceId = useAppSelector((state) => state?.global?.marketplaceId);
  
  // Memoize props to prevent unnecessary re-renders
  const productDetailsProps = useMemo(() => ({
    asin,
    marketplaceId,
  }), [asin, marketplaceId]);
  
  // Don't render if essential data is missing
  if (!asin || !marketplaceId || marketplaceId === 0) {
    return (
      <div className="h-[400px] flex flex-col items-center justify-center">
        <h2 className="font-semibold">Loading product details...</h2>
        <p className="text-sm">Please wait while we load the product information</p>
      </div>
    );
  }

  return <ProductDetails {...productDetailsProps} />;
});

ProductPage.displayName = 'ProductPage';

export default ProductPage;
