"use client";

import { Tooltip, Dropdown } from "antd";
import { CustomTable as Table } from "@/lib/AntdComponents";
import type { ColumnsType } from "antd/es/table";
import type { MenuProps } from "antd";
import { FC, useState, useEffect, useRef } from "react";
import {
  HiArrowPath,
  HiPrinter,
  HiEllipsisVertical,
  HiTrash,
  HiArrowDownTray,
} from "react-icons/hi2";
import * as XLSX from 'xlsx';

// Product interfaces for download
interface ProductCost {
  amount: string | null;
  currency: string;
}

interface ProductDetails {
  asin: string | null;
  title: string | null;
  fba_fee: string | null;
  referral_fee: string | null;
  storage_fee: string | null;
  net_profit: string | null;
  net_margin: string | null;
  roi: string | null;
  potential_winner: string | null;
  rank: string | null;
  amazon_instock_rate: string | null;
  number_of_fba: string | null;
  number_of_fbm: string | null;
  number_of_amz: string | null;
  estimated_monthly_sales: string | null;
  buy_box_equity: string | null;
  out_of_stock: number | null;
  dominant_seller: string | null;
}

interface ScanProduct {
  asin_upc: string;
  product_cost: ProductCost;
  buy_box_price: ProductCost;
  product_details: ProductDetails;
}

interface ScanResultsTableProps {
  onDetailsClick?: (productId: string) => void;
  onRefreshScan?: (scanId: number) => void;
  onRestartScan?: (scanId: number) => void;
  onDeleteScan?: (scanId: number) => void;
  scanResults?: Array<{
    id: number;
    product_name: string;
    product_id: string | null;
    items_count: number;
    products_found: number;
    last_seen: string;
    last_uploaded: string;
    status: string;
    marketplace_id: string;
    user_id: number;
    failed_reason?: string;
  }>;
  isLoading?: boolean;
}

export interface ProductData {
  key: string;
  index: number;
  name: string;
  productId: string;
  itemsCount: number;
  found: number;
  lastScan: string;
  lastUploaded: string;
  status: "Pending" | "In Progress" | "Completed";
  last_seen_date: Date; // Added for sorting
  failedReason?: string; // Reason for failure if scan failed
}

const ScanResultsTable: FC<ScanResultsTableProps> = ({ onDetailsClick, onRefreshScan, onRestartScan, onDeleteScan, scanResults = [], isLoading = false }) => {
  // Track which scan is currently refreshing
  const [refreshingId, setRefreshingId] = useState<number | null>(null);
  // Store interval IDs for cleanup
  const intervalRef = useRef<{[key: number]: NodeJS.Timeout}>({});
  // Cache for downloaded scan details
  const downloadCache = useRef<Map<number, { data: { products: ScanProduct[] } }>>(new Map());
  
  // Auto-refresh pending and in-progress scans (optimized - max 5 concurrent)
  useEffect(() => {
    // Clear previous intervals
    Object.values(intervalRef.current).forEach(interval => clearInterval(interval));
    intervalRef.current = {};
    
    // Get pending/in-progress scans, limit to 5 most recent
    const pendingScans = scanResults
      .filter(scan => scan.status === 'pending' || scan.status === 'in-progress')
      .sort((a, b) => new Date(b.last_seen).getTime() - new Date(a.last_seen).getTime())
      .slice(0, 5);
    
    // Set up intervals only for limited scans
    pendingScans.forEach(scan => {
      const scanId = scan.id;
      // Set up interval to refresh every 30 seconds (30000ms)
      const intervalId = setInterval(() => {
        onRefreshScan?.(scanId);
      }, 30000);
      
      // Store interval ID for cleanup
      intervalRef.current[scanId] = intervalId;
    });
    
    // Cleanup function
    return () => {
      Object.values(intervalRef.current).forEach(interval => clearInterval(interval));
      intervalRef.current = {};
    };
  }, [scanResults, onRefreshScan]);
  
  // Function to download scan results as Excel file with full product details (optimized with caching)
  const handleDownloadExcel = async (record: ProductData) => {
    // Find the original scan result data
    const scanData = scanResults.find(scan => scan.id.toString() === record.key);
    
    if (!scanData) return;
    
    try {
      // Show loading message
      const { message } = await import('antd');
      message.loading({ content: 'Preparing download...', key: 'downloadExcel' });
      
      let data;
      let products;
      
      // Check cache first
      const cached = downloadCache.current.get(scanData.id);
      if (cached) {
        data = cached;
        products = cached.data.products || [];
      } else {
        // Fetch full scan details with product data
        const response = await fetch(`/api/upc-scanner/${scanData.id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch scan details');
        }
        
        data = await response.json();
        products = data.data.products || [];
        
        // Cache the result for 5 minutes
        downloadCache.current.set(scanData.id, data);
        setTimeout(() => downloadCache.current.delete(scanData.id), 5 * 60 * 1000);
      }
      
      // Create workbook
      const wb = XLSX.utils.book_new();
      
      // Sheet 1: Scan Summary
      const summaryData = [
        ['UPC Scanner Results'],
        [''],
        ['Scan Details'],
        ['Search Name', scanData.product_name],
        ['UPC / EAN', scanData.product_id || ''],
        ['Items Count', scanData.items_count.toString()],
        ['Products Found', scanData.products_found.toString()],
        ['Last Scan', new Date(scanData.last_seen).toLocaleDateString()],
        ['Last Uploaded', new Date(scanData.last_uploaded).toLocaleDateString()],
        ['Status', scanData.status],
        ['Marketplace ID', scanData.marketplace_id]
      ];
      
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');
      
      // Sheet 2: Product Details
      if (products.length > 0) {
        const productHeaders = [
          'UPC / EAN',
          'Product Cost',
          'Buy Box Price',
          'FBA Fee',
          'Referral Fee',
          'Storage Fee',
          'Net Profit',
          'Net Margin',
          'ROI',
          'Potential Winner',
          'Rank',
          'Amazon Instock Rate',
          '# FBA Sellers',
          '# FBM Sellers',
          '# AMZ Sellers',
          'Est. Monthly Sold',
          'Buy Box Equity',
          'Out of Stock',
          'Dominant Seller',
          'ASIN',
          'Title'
        ];
        
        const productRows = products.map((product: ScanProduct) => [
          product.asin_upc || '',
          product.product_cost?.amount ? `${product.product_cost.currency}${product.product_cost.amount}` : '',
          product.buy_box_price?.amount ? `${product.buy_box_price.currency}${product.buy_box_price.amount}` : '',
          product.product_details?.fba_fee || '',
          product.product_details?.referral_fee || '',
          product.product_details?.storage_fee || '',
          product.product_details?.net_profit || '',
          product.product_details?.net_margin || '',
          product.product_details?.roi || '',
          product.product_details?.potential_winner || '',
          product.product_details?.rank || '',
          product.product_details?.amazon_instock_rate || '',
          product.product_details?.number_of_fba || '',
          product.product_details?.number_of_fbm || '',
          product.product_details?.number_of_amz || '',
          product.product_details?.estimated_monthly_sales || '',
          product.product_details?.buy_box_equity || '',
          product.product_details?.out_of_stock || '',
          product.product_details?.dominant_seller || '',
          product.product_details?.asin || '',
          product.product_details?.title || ''
        ]);
        
        const wsProducts = XLSX.utils.aoa_to_sheet([productHeaders, ...productRows]);
        
        // Set column widths for better readability
        wsProducts['!cols'] = [
          { wch: 15 }, // UPC / EAN
          { wch: 12 }, // Product Cost
          { wch: 12 }, // Buy Box Price
          { wch: 10 }, // FBA Fee
          { wch: 12 }, // Referral Fee
          { wch: 12 }, // Storage Fee
          { wch: 12 }, // Net Profit
          { wch: 12 }, // Net Margin
          { wch: 10 }, // ROI
          { wch: 15 }, // Potential Winner
          { wch: 10 }, // Rank
          { wch: 18 }, // Amazon Instock Rate
          { wch: 14 }, // # FBA Sellers
          { wch: 14 }, // # FBM Sellers
          { wch: 14 }, // # AMZ Sellers
          { wch: 16 }, // Est. Monthly Sold
          { wch: 15 }, // Buy Box Equity
          { wch: 12 }, // Out of Stock
          { wch: 15 }, // Dominant Seller
          { wch: 12 }, // ASIN
          { wch: 40 }  // Title
        ];
        
        XLSX.utils.book_append_sheet(wb, wsProducts, 'Products');
      }
      
      // Generate filename
      const fileName = `UPC_Scan_${scanData.product_name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // Write and download
      XLSX.writeFile(wb, fileName);
      
      message.success({ content: 'Download complete!', key: 'downloadExcel' });
    } catch (error) {
      console.error('Error downloading Excel:', error);
      const { message } = await import('antd');
      message.error({ content: 'Failed to download. Please try again.', key: 'downloadExcel' });
    }
  };
  
  // Convert API scan results to table format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: '2-digit', 
      day: '2-digit', 
      year: '2-digit' 
    });
  };

 
  const tableData: ProductData[] = scanResults
    .map((scan, index) => ({
      key: scan.id.toString(),
      index: index + 1,
      name: scan.product_name,
      productId: scan.product_id || scan.id.toString(),
      itemsCount: scan.items_count,
      found: scan.products_found,
      lastScan: formatDate(scan.last_seen),
      lastUploaded: formatDate(scan.last_uploaded),
      status: scan.status === 'completed' 
        ? "Completed" 
        : scan.status === 'in-progress' 
          ? "In Progress" 
          : "Pending" as "Pending" | "In Progress" | "Completed",
      failedReason: scan.failed_reason,
      last_seen_date: new Date(scan.last_seen) // Add original date for sorting
    }))
    // Sort by last_seen_date in descending order (most recent first)
    .sort((a, b) => b.last_seen_date.getTime() - a.last_seen_date.getTime());
  const columns: ColumnsType<ProductData> = [
    {
      title: "#",
      dataIndex: "index",
      key: "index",
      width: 50,
      render: (_, record, index) => <span>{index + 1}</span>,
    },
    {
      title: "Search Name",
      dataIndex: "name",
      key: "name",
      render: (name, record) => {
        const dotColor = name === "TOSSI" ? "black" : "#18CB96";
        // Since we've sorted the table data, the first item (index 0) is the most recent
        const isMostRecent = record.key === tableData[0]?.key;
        return (
          <div className="flex items-center gap-2">
            <span
              className="inline-block size-2 rounded-full"
              style={{ backgroundColor: dotColor }}
            />
            <span className={isMostRecent ? "font-bold" : ""}>{name}</span>
          </div>
        );
      },
    },
    {
      title: "No of items",
      dataIndex: "itemsCount",
      key: "itemsCount",
    },
    {
      title: "Product Found",
      dataIndex: "found",
      key: "found",
    },
    {
      title: "Last Scan",
      dataIndex: "lastScan",
      key: "lastScan",
      render: (text, record) => {
        // Since we've sorted the table data, the first item (index 0) is the most recent
        const isMostRecent = record.key === tableData[0]?.key;
        return (
          <span className={isMostRecent ? "font-bold" : ""}>{text}</span>
        );
      },
    },
    {
      title: "Last uploaded",
      dataIndex: "lastUploaded",
      key: "lastUploaded",
      render: (text, record) => {
        // Since we've sorted the table data, the first item (index 0) is the most recent
        const isMostRecent = record.key === tableData[0]?.key;
        return (
          <span className={isMostRecent ? "font-bold" : ""}>{text}</span>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status, record) => (
        record.failedReason ? (
          <Tooltip title={record.failedReason}>
            <span
              className={`px-1.5 py-1 rounded-full text-xs font-semibold`}
              style={{
                backgroundColor: status === "Pending" || status === "In Progress" ? "#FDF5E9" : "#18CB9610",
                color: status === "Pending" || status === "In Progress" ? "#FF9B06" : "#18CB96",
              }}
            >
              {status}
            </span>
          </Tooltip>
        ) : (
          <span
            className={`px-1.5 py-1 rounded-full text-xs font-semibold`}
            style={{
              backgroundColor: status === "Pending" || status === "In Progress" ? "#FDF5E9" : "#18CB9610",
              color: status === "Pending" || status === "In Progress" ? "#FF9B06" : "#18CB96",
            }}
          >
            {status}
          </span>
        )
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record: ProductData) => {
        const items: MenuProps["items"] = [
          {
            key: "download",
            label: (
              <div className="flex items-center gap-2">
                <HiArrowDownTray size={16} />
                <span>Download</span>
              </div>
            ),
            onClick: () => {
              handleDownloadExcel(record);
            },
          },
          {
            key: "delete",
            label: (
              <div className="flex items-center gap-2 text-red-500">
                <HiTrash size={16} />
                <span>Delete</span>
              </div>
            ),
            onClick: () => {
              const scanId = parseInt(record.key);
              onDeleteScan?.(scanId);
            },
          },
        ];

        return (
          <div className="flex gap-2">
            <Tooltip title="Refresh">
              <button 
                type="button" 
                aria-label="Refresh" 
                onClick={() => {
                  const scanId = parseInt(record.key);
                  setRefreshingId(scanId);
                  onRestartScan?.(scanId);
                  // Reset the refreshing state after 2 seconds
                  setTimeout(() => setRefreshingId(null), 2000);
                }}
              >
                <HiArrowPath
                  size={24}
                  className={`${refreshingId === parseInt(record.key) ? 'text-primary animate-spin' : 'text-[#8C94A3] hover:text-black'}`}
                />
              </button>
            </Tooltip>
            <Tooltip title="View Details">
              <button
                type="button"
                aria-label="View Details"
                onClick={() => onDetailsClick?.(record.productId)}
              >
                <HiPrinter
                  size={24}
                  className="text-[#8C94A3] hover:text-black"
                />
              </button>
            </Tooltip>
            <Dropdown menu={{ items }} trigger={["click"]}>
              <Tooltip title="More">
                <button type="button" aria-label="More">
                  <HiEllipsisVertical
                    size={24}
                    className="text-[#8C94A3] hover:text-black"
                  />
                </button>
              </Tooltip>
            </Dropdown>
          </div>
        );
      },
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={tableData}
      pagination={false}
      scroll={{ x: 800 }}
      className="custom-table"
      loading={isLoading}
    />
  );
};

export default ScanResultsTable;