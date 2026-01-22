"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useDraggable } from "@dnd-kit/core"
import { useState } from "react"
import TablePagination from "./TablePagination"
import { ReverseSearchData } from "@/types/goCompare";
import placeholder from '../../../../public/assets/images/gocompare/placeholder.png'


interface ProductTableProps {
    products: ReverseSearchData[]
    onRowClick: (product: ReverseSearchData) => void
}

type SortColumn = 'profit_margin' | 'roi_percentage' | 'buybox_price' | null;
type SortDirection = 'asc' | 'desc'

function DraggableRow({ product, onRowClick }: { product: ReverseSearchData; onRowClick: (product: ReverseSearchData) => void }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: product.scraped_product?.id,
        data: { product },
    });

    const [mouseDownTime, setMouseDownTime] = useState<number | null>(null);

    const handleMouseDown = () => {
        setMouseDownTime(Date.now());
    };

    const handleMouseUp = () => {
        if (mouseDownTime && Date.now() - mouseDownTime < 200) {
            onRowClick(product);
        }
        setMouseDownTime(null);
    };

    const formattedProfitMargin = product.profit_margin ? `${product.profit_margin.toFixed(1)}% ` : '0%';
    const formattedROI = product.roi_percentage ? `${product.roi_percentage.toFixed(1)}% ` : '0%';

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
            <td className="px-4 py-1.5 flex items-center gap-2">
                <div className="w-8 h-8 relative rounded overflow-hidden">
                    <img src={product.scraped_product?.image} alt={product.scraped_product.name} className="object-cover" />
                </div>
                <span className="text-sm line-clamp-1">
                    {product?.scraped_product?.name?.length > 25
                        ? `${product.scraped_product.name.slice(0, 25)}...`
                        : product.scraped_product.name}
                </span>
            </td>
            <td className="px-4 py-1.5">
                <div className="w-auto h-auto px-2 py-1 flex items-center">
                    <span className="text-sm font-medium">{product.scraped_product?.store?.name || 'Unknown Store'}</span>
                </div>
            </td>
            <td className="px-4 py-1.5 text-sm">{formattedProfitMargin}</td>
            <td className="px-4 py-1.5 text-sm">{formattedROI}</td>
            <td className="px-4 py-1.5 text-sm">{product.target_fees || 'N/A'}</td>
            <td className="px-4 py-1.5 text-sm">{product.price || product.buybox_price || product.amazon_product?.price || product.amazon_product?.buybox_price || 'N/A'}</td>
            <td className="px-4 py-1.5 text-sm">{product.amazon_product?.metrics?.number_of_sellers ?? 'N/A'}</td>
        </tr>
    )
}

function SortButton({ column, currentColumn, currentDirection, onSort
}: {
    column: SortColumn; currentColumn: SortColumn; currentDirection: SortDirection;
    onSort: (column: SortColumn, direction: SortDirection) => void;
}) {
    const isActive = currentColumn === column;
    const handleSort = (direction: SortDirection) => {
        onSort(column, direction);
    };

    return (
        <div className="flex flex-col ml-2">
            <button onClick={() => handleSort('asc')}
                className={`text-xs leading-none ${isActive && currentDirection === 'asc'
                    ? 'text-blue-600'
                    : 'text-gray-400 hover:text-gray-600'
                    }`}
            >
                ▲
            </button>
            <button onClick={() => handleSort('desc')}
                className={`text-xs leading-none ${isActive && currentDirection === 'desc'
                    ? 'text-blue-600'
                    : 'text-gray-400 hover:text-gray-600'
                    }`}
            >
                ▼
            </button>
        </div>
    );
}

export default function ReverseSearchTable({ products, onRowClick }: ProductTableProps) {
    const [page, setPage] = useState(1)
    const perPage = 10 // Fixed number of rows per page
    const [sortColumn, setSortColumn] = useState<SortColumn>(null)
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

    const handleSort = (column: SortColumn, direction: SortDirection) => {
        setSortColumn(column);
        setSortDirection(direction);
        setPage(1);
    };
    const sortedProducts = [...products].sort((a, b) => {
        if (!sortColumn) return 0;

        let aValue: number = 0;
        let bValue: number = 0;

        if (sortColumn === 'buybox_price') {
            // Handle price as string with currency symbol
            const getNumericPrice = (price: any): number => {
                if (typeof price === 'number') return price;
                if (typeof price === 'string') {
                    // Remove currency symbols and parse to number
                    const numericValue = parseFloat(price.replace(/[$£€,]/g, ''));
                    return isNaN(numericValue) ? 0 : numericValue;
                }
                return 0;
            };
            
            const aPriceValue = a.price || a.buybox_price || a.amazon_product?.price || a.amazon_product?.buybox_price || 0;
            const bPriceValue = b.price || b.buybox_price || b.amazon_product?.price || b.amazon_product?.buybox_price || 0;
            
            aValue = getNumericPrice(aPriceValue);
            bValue = getNumericPrice(bPriceValue);
        } else {
            aValue = a[sortColumn] ?? 0;
            bValue = b[sortColumn] ?? 0;
        }

        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });


    const totalPages = Math.ceil(sortedProducts.length / perPage)
    const startIndex = (page - 1) * perPage
    const endIndex = startIndex + perPage
    const currentData = sortedProducts.slice(startIndex, endIndex)

    const handlePageChange = (page: number) => {
        setPage(page)
    }

    // Dummy function to maintain compatibility with TablePagination
    const handlePerPageChange = () => {
        // No longer used
    }

    return (
        <div className="border border-gray-200 rounded-lg">
            <div className="w-full bg-white rounded-lg">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b">
                                <th className="px-4 py-3 text-left font-medium text-gray-600">Product name</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-600">Store</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-600">
                                    <div className="flex items-center">
                                        Profit Margin
                                        <SortButton column="profit_margin" currentColumn={sortColumn} currentDirection={sortDirection} onSort={handleSort} />
                                    </div>
                                </th>
                                <th className="px-4 py-3 text-left font-medium text-gray-600">
                                    <div className="flex items-center">
                                        Gross ROI
                                        <SortButton column="roi_percentage" currentColumn={sortColumn} currentDirection={sortDirection} onSort={handleSort} />
                                    </div>
                                </th>
                                <th className="px-4 py-3 text-left font-medium text-gray-600">Target Fees</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-600">
                                    <div className="flex items-center">
                                        BuyBox Price
                                        <SortButton column="buybox_price" currentColumn={sortColumn} currentDirection={sortDirection} onSort={handleSort} />
                                    </div>
                                </th>
                                <th className="px-4 py-3 text-left font-medium text-gray-600">No. of Sellers</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentData.map((product) => (
                                <DraggableRow key={product.scraped_product.id} product={product} onRowClick={onRowClick} />
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <TablePagination
                page={page}
                perPage={perPage}
                totalPages={totalPages}
                handlePageChange={handlePageChange}
                handlePerPageChange={handlePerPageChange}
            />
        </div>
    )
}

