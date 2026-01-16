"use client";
import { useMemo, useState } from "react";
import { useSearchHistoryQuery } from "@/redux/api/quickSearchApi";
import Loader from "@/utils/loader";
import TablePagination from "../_components/TablePagination";
import { ApiSearchResponseItem, SearchRecord } from "@/types/goCompare";
import { useRouter } from "next/navigation";
import { FaSort, FaSortUp, FaSortDown } from "react-icons/fa";

const tableColumns = [
    { label: 'ASIN, UPC or Query Name', key: 'asinOrUpc' },
    { label: 'Type of search', key: 'searchType' },
    { label: 'Search Date', key: 'searchDate' },
    { label: 'Amazon Price', key: 'amazonPrice' },
    { label: 'Country', key: 'country' },
    { label: 'Store(s)', key: 'storeLogo' },
    { label: 'No. of results', key: 'results' },
]

const SearchHistory = () => {
    const [perPage, setPerPage] = useState(10);
    const [page, setPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>(null);
    const router = useRouter();

    const { data, isLoading, isFetching, isError } = useSearchHistoryQuery({ page, perPage });
    const searchData: SearchRecord[] = useMemo(() => data?.data?.map((item: ApiSearchResponseItem) => ({
        id: item.id,
        asinOrUpc: item.asin_upc,
        searchType: item.search_type,
        searchDate: new Date(item.search_date).toLocaleDateString(),
        // Keep original date for sorting if needed, but we can parse the string too
        originalDate: new Date(item.search_date),
        amazonPrice: item.amazon_price ? `$${item.amazon_price}` : "-",
        rawPrice: item.amazon_price || 0,
        country: item.country.country,
        stores: item.stores || [],
        results: item.results_count,
        countryId: item.country.id,
    })) || [], [data]);


    const handleSort = (key: string) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const sortedData = useMemo(() => {
        const sortableItems = [...searchData];
        if (sortConfig !== null) {
            sortableItems.sort((a: SearchRecord, b: SearchRecord) => {
                let aValue: number | Date | undefined;
                let bValue: number | Date | undefined;

                // Handle specific column sorting logic
                if (sortConfig.key === 'amazonPrice') {
                    aValue = a.rawPrice;
                    bValue = b.rawPrice;
                } else if (sortConfig.key === 'searchDate') {
                    aValue = a.originalDate;
                    bValue = b.originalDate;
                } else if (sortConfig.key === 'results') {
                    aValue = a.results;
                    bValue = b.results;
                } else {
                    return 0;
                }

                if (aValue === undefined || bValue === undefined) return 0;


                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [searchData, sortConfig]);

    const getSortIcon = (columnKey: string) => {
        if (!['results', 'amazonPrice', 'searchDate'].includes(columnKey)) return null;

        if (sortConfig?.key === columnKey) {
            return sortConfig.direction === 'ascending' ? <FaSortUp className="inline ml-1" /> : <FaSortDown className="inline ml-1" />;
        }
        return <FaSort className="inline ml-1 text-gray-400" />;
    };



    const handlePageChange = (page: number) => {
        setPage(page)
    }

    const handlePerPageChange = (value: number) => {
        setPerPage(value)
        setPage(1)
    }

    // Marketplace mapping based on country names and IDs
    const getMarketplaceId = (countryName: string, countryId?: number): number => {
        // Primary mapping by country name
        const countryToMarketplaceMap: { [key: string]: number } = {
            'United States': 1,
            'US': 1,
            'USA': 1,
            'United Kingdom': 2,
            'UK': 2,
            'France': 3,
            'FR': 3,
            'Australia': 4,
            'AU': 4,
            'Germany': 5,
            'DE': 5,
            'Canada': 6,
            'CA': 6,
            'Nigeria': 7,
            'NG': 7,
            'India': 8,
            'IN': 8,
        };

        // Try to map by country name first
        const marketplaceByName = countryToMarketplaceMap[countryName];
        if (marketplaceByName) {
            return marketplaceByName;
        }

        // Fallback to countryId if available, otherwise default to US (1)
        return countryId || 1;
    };

    const handleRouting = (record: SearchRecord) => {
        // For ASIN searches, always go to quick-search
        if (record.searchType === 'quick_search' || record.asinOrUpc.match(/^[A-Z0-9]{10}$/)) {
            // Get proper marketplace ID based on country information
            const marketplaceId = getMarketplaceId(record.country, record.countryId);
            // Clean URL with only essential parameters
            router.push(`/go-compare/quick-search?asin=${record.asinOrUpc}&marketplace_id=${marketplaceId}`)
        } else {
            // For other searches (like seller searches), go to reverse-search
            const marketplaceId = getMarketplaceId(record.country, record.countryId);
            router.push(`/go-compare/reverse-search?seller_id=${encodeURIComponent(record.asinOrUpc)}&marketplace_id=${marketplaceId}`);
        }
    }

    if (isLoading || isFetching) return (
        <div className="flex items-center justify-center">
            <Loader />
        </div>
    )

    return (
        <div>
            <p className="font-semibold">Search History</p>
            {isError && <p>Error fetching history</p>}
            {data?.data &&
                <div className="w-full bg-white mt-5 border border-gray-200 rounded-lg ">
                    <div className="overflow-x-auto ">
                        <table className="w-full text-sm ">
                            <thead>
                                <tr className="border-b bg-[#FCFCFC]">
                                    {tableColumns.map((column) => (
                                        <th 
                                            key={column.key} 
                                            className={`px-4 py-3 text-left text-[#737379] font-normal ${column.key === 'storeLogo' && 'text-center'} ${['results', 'amazonPrice', 'searchDate'].includes(column.key) ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                                            onClick={() => ['results', 'amazonPrice', 'searchDate'].includes(column.key) && handleSort(column.key)}
                                        >
                                            {column.label}
                                            {getSortIcon(column.key)}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="">
                                {sortedData?.map((record) => (
                                    <tr key={record.id} className="font-medium cursor-pointer" onClick={() => handleRouting(record)}>
                                        <td className="px-4 pr-20 py-3 ">{record.asinOrUpc}</td>
                                        <td className="px-4 py-3">{record.searchType}</td>
                                        <td className="px-4 py-3">{record.searchDate}</td>
                                        <td className="px-4 py-3">{record.amazonPrice}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <span className="font-normal">{record.country}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-2 items-center justify-center">
                                                {Array.isArray(record.stores) ? (
                                                    record.stores.length > 0 ? (
                                                        <span className="text-sm">{record.stores.join(', ')}</span>
                                                    ) : (
                                                        <span className="text-sm text-gray-400">No stores</span>
                                                    )
                                                ) : (
                                                    <span className="text-sm text-gray-400">No stores</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">{Math.min(record.results, 10)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <TablePagination page={page} perPage={perPage} totalPages={data?.meta?.last_page} handlePageChange={handlePageChange} handlePerPageChange={handlePerPageChange} />
                    <p className="text-green-600 text-end mx-4 mb-2 text-sm">Results will be cleared after 7 days</p>

                </div>
            }
        </div>
    )
}

export default SearchHistory
