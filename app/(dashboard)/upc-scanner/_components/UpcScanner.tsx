"use client";
 
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { MdOutlineInsertChartOutlined } from "react-icons/md";
import Header from "./Header";
import ScanResultsTable from "./scan-results-table";
import { HiOutlineCloudArrowUp } from "react-icons/hi2";

import ScanDetailsTable from "./scan-details-table";
import { CgClose } from "react-icons/cg";
import MiniDatePicker from "./date-picker";
import { IoSearchOutline } from "react-icons/io5";
import { message, Modal } from "antd";
import dayjs from "dayjs";
import debounce from "lodash/debounce";
import { useLazyGetFeatureUsageQuery } from "@/redux/api/user";

type Tab = "upc" | "new";

// Interface for scan result data
export interface ScanResult {
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
}

interface ApiResponse {
  status: number;
  message: string;
  data: ScanResult[];
  meta: Record<string, unknown>[];
}

interface SingleScanResponse {
  status: number;
  message: string;
  data: ScanResult;
  meta: Record<string, unknown>[];
}

// Interfaces for scan details
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
  selling_price: ProductCost;
  buy_box_price: ProductCost;
  product_details: ProductDetails;
}

interface ScanDetailsResponse {
  status: number;
  message: string;
  data: ScanDetailsData;
  meta: Record<string, unknown>[];
}

interface ScanDetailsData extends ScanResult {
  products: ScanProduct[];
}

const UpcScanner = () => {
  const [activeTab, setActiveTab] = useState<Tab>("upc");

  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [scanDetails, setScanDetails] = useState<ScanDetailsData | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [productName, setProductName] = useState<string>("");
  const [marketplaceId, setMarketplaceId] = useState<string>("6");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>("");
  const [filterDate, setFilterDate] = useState<dayjs.Dayjs | null>(dayjs());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const scanDetailsCache = useRef<Map<number, ScanDetailsData>>(new Map());
  const pendingRequests = useRef<Set<number>>(new Set());

  const [checkUsage, { data, isLoading:UsageLoading, error }] = useLazyGetFeatureUsageQuery()

  useEffect(()=>{
    checkUsage('upc_scanner')
  }, [])

  // Handle clicking outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Debounce search input to prevent excessive filtering
  const debouncedFn = useRef(debounce((value: string) => {
    setDebouncedSearchTerm(value);
  }, 300));
  
  const debouncedSearch = useCallback((value: string) => {
    debouncedFn.current(value);
  }, []);
  
  // Update debounced search term when searchTerm changes
  useEffect(() => {
    debouncedSearch(searchTerm);
    const currentDebouncedFn = debouncedFn.current;
    return () => {
      currentDebouncedFn.cancel();
    };
  }, [searchTerm, debouncedSearch]);
  
  // Memoize filtered scan results to avoid redundant filtering
  const filteredScanResults = useMemo(() => {
    return scanResults.filter(scan => {
      const matchesSearch = debouncedSearchTerm === "" || 
        scan.product_name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        (scan.product_id && scan.product_id.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));
      return matchesSearch;
    });
  }, [scanResults, debouncedSearchTerm]);
  
  // Fetch scan results from API
  const [isLoading, setIsLoading] = useState(false);
  // Using retryCount to trigger refetching when retry is clicked
  const [retryCount, setRetryCount] = useState(0);
  
  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;
    
    const fetchScanResults = async () => {
      if (!isMounted) return;
      
      setIsLoading(true);
      
      try {
        // Build query parameters with date range
        const params = new URLSearchParams();
        if (filterDate) {
          const startDate = filterDate.startOf('month').format('YYYY-MM-DD');
          const endDate = filterDate.endOf('month').format('YYYY-MM-DD');
          params.append('start_date', startDate);
          params.append('end_date', endDate);
        }
        
        const url = `/api/upc-scanner${params.toString() ? `?${params.toString()}` : ''}`;
        
        const response = await fetch(url, {
          signal: controller.signal,
          // Add cache control headers to prevent stale data
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        // Check if response is ok before parsing JSON
        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          throw new Error(`API responded with status: ${response.status}, details: ${errorText}`);
        }
        
        // Check content type to ensure it's JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error(`Expected JSON response but got ${contentType}`);
        }
        
        const data: ApiResponse = await response.json();
        
        if (data.status === 200) {
          if (isMounted) {
            setScanResults(data.data);
            setRetryCount(0); // Reset retry count on success
          }
        } else {
          throw new Error(data.message || 'Failed to fetch scan results');
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        
        let errorMessage = 'An error occurred while fetching scan results';
        
        if (err instanceof SyntaxError) {
          errorMessage = 'Invalid response format from server';
        } else if (err instanceof Error && err.name === 'AbortError') {
          // Don't show error for aborted requests
          return;
        } else if (err instanceof Error && err.message) {
          errorMessage = err.message;
        }
        
        console.error('Error fetching scan results:', err);
        
        // Show error message with retry option
        message.error({
          content: (
            <div>
              {errorMessage}
              <button 
                onClick={() => setRetryCount(prev => prev + 1)}
                style={{ marginLeft: '10px', color: '#18CB96', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Retry
              </button>
            </div>
          ),
          duration: 5
        });
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    fetchScanResults();
    
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [retryCount, filterDate]); // Retry when retryCount or filterDate changes
  
  // Handle refreshing a scan with retry mechanism
  const handleRefreshScan = async (scanId: number, retryAttempt = 0, maxRetries = 3) => {
    try {
      message.loading({ 
        content: retryAttempt > 0 ? `Retrying scan refresh (${retryAttempt}/${maxRetries})...` : 'Refreshing scan...', 
        key: 'refreshScan' 
      });
      
      const response = await fetch(`/api/upc-scanner/${scanId}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`HTTP error! Status: ${response.status}, details: ${errorText}`);
      }
      
      const data = await response.json();
      
      if (response.ok) {
        message.success({ content: 'Scan status updated', key: 'refreshScan' });
        
        // Update the scan in the results list
        setScanResults(prevResults => 
          prevResults.map(scan => 
            scan.id === scanId ? { ...scan, ...data.data } : scan
          )
        );
        
        // Invalidate cache for this scan
        scanDetailsCache.current.delete(scanId);
        
        // If this scan is currently selected, update the details too
        if (selectedProductId === scanId.toString()) {
          setScanDetails(prevDetails => 
            prevDetails ? { ...prevDetails, ...data.data } : null
          );
        }
      } else {
        throw new Error(data.message || 'Failed to refresh scan');
      }
    } catch (err: unknown) {
      console.error('Error refreshing scan:', err);
      
      // Implement retry logic
      if (retryAttempt < maxRetries) {
        message.warning({ 
          content: (
            <div>
              Refresh failed: {err instanceof Error ? err.message : 'Unknown error'}
              <button 
                onClick={() => handleRefreshScan(scanId, retryAttempt + 1, maxRetries)}
                style={{ marginLeft: '10px', color: '#18CB96', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Retry Now
              </button>
            </div>
          ), 
          key: 'refreshScan',
          duration: 5
        });
      } else {
        message.error({ 
          content: (
            <div>
              Failed to refresh scan after {maxRetries} attempts: {err instanceof Error ? err.message : 'Unknown error'}
              <button 
                onClick={() => handleRefreshScan(scanId, 0, maxRetries)}
                style={{ marginLeft: '10px', color: '#18CB96', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Try Again
              </button>
            </div>
          ), 
          key: 'refreshScan',
          duration: 7
        });
      }
    }
  }
  
  // Handle restarting a scan with retry mechanism
  const handleRestartScan = async (scanId: number) => {
    try {
      message.loading({ content: 'Restarting scan...', key: 'restartScan' });
      
      const response = await fetch(`/api/upc-scanner/${scanId}/restart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.status === 200) {
        setRetryCount(prev => prev + 1); // Trigger refetch
        message.success({
          content: 'Scan Restarted',
          key: 'restartScan'
        });
      } else {
        throw new Error(result.message || 'Failed to restart scan');
      }
    } catch (error) {
      console.error('Failed to restart scan:', error);
      message.error({
        content: 'Failed to restart scan. Please try again.',
        key: 'restartScan'
      });
    }
  };
  
  // Handle deleting a scan
  const handleDeleteScan = async (scanId: number) => {
    // Show confirmation dialog
    Modal.confirm({
      title: 'Delete Scan',
      content: 'Are you sure you want to delete this scan? This action cannot be undone.',
      okText: 'Delete',
      okType: 'primary',
      okButtonProps: { 
        style: { 
          backgroundColor: '#18CB96', 
          borderColor: '#18CB96',
          borderRadius: '9999px'
        } 
      },
      cancelButtonProps: {
        style: {
          borderColor: '#18CB96',
          borderRadius: '9999px'
        }
      },
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          message.loading({ content: 'Deleting scan...', key: 'deleteScan' });
          
          const response = await fetch(`/api/upc-scanner/${scanId}`, {
            method: 'DELETE',
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          
          const data = await response.json();
          
          if (data.status === 200) {
            message.success({ content: 'Scan deleted successfully', key: 'deleteScan' });
            
            // Remove the scan from the results list
            setScanResults(prevResults => 
              prevResults.filter(scan => scan.id !== scanId)
            );
            
            // Invalidate cache for this scan
            scanDetailsCache.current.delete(scanId);
            
            // If this scan is currently selected, clear the details
            if (selectedProductId === scanId.toString()) {
              setSelectedProductId(null);
              setScanDetails(null);
            }
          } else {
            message.error({ content: data.message || 'Failed to delete scan', key: 'deleteScan' });
          }
        } catch (err: unknown) {
          console.error('Error deleting scan:', err);
          message.error({ content: 'Failed to delete scan', key: 'deleteScan' });
        }
      },
    });
  };

  // Fetch scan details when a product is selected (optimized with caching)
  useEffect(() => {
    // Track if the component is still mounted
    let isMounted = true;
    const controller = new AbortController();
    
    const fetchScanDetails = async () => {
      if (!selectedProductId) {
        setScanDetails(null);
        return;
      }
      
      const scanId = parseInt(selectedProductId);
      
      // Check cache first
      const cached = scanDetailsCache.current.get(scanId);
      if (cached) {
        setScanDetails(cached);
        return;
      }
      
      // Prevent duplicate requests
      if (pendingRequests.current.has(scanId)) {
        return;
      }
      
      pendingRequests.current.add(scanId);
      setIsLoadingDetails(true);
      
      try {
        const response = await fetch(`/api/upc-scanner/${selectedProductId}`, {
          signal: controller.signal
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Response is not JSON");
        }
        
        if (isMounted) {
          const data: ScanDetailsResponse = await response.json();
          
          // Cache the result
          scanDetailsCache.current.set(scanId, data.data);
          
          // Set data directly (no batching needed)
          setScanDetails(data.data);
        }
      } catch (err: unknown) {
        if (err instanceof SyntaxError) {
          message.error("Invalid response format from server");
        } else if (err instanceof Error && err.name !== 'AbortError') {
          message.error("Failed to fetch scan details");
        }
        console.error("Error fetching scan details:", err);
      } finally {
        pendingRequests.current.delete(scanId);
        if (isMounted) {
          setIsLoadingDetails(false);
        }
      }
    };

    fetchScanDetails();
    
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [selectedProductId]);

  // Marketplace options with icons
  const marketplaceOptions = [
    { id: "1", name: "United States", flag: "🇺🇸" },
    { id: "6", name: "Canada", flag: "🇨🇦" },
    { id: "2", name: "United Kingdom", flag: "🇬🇧" },
    { id: "11", name: "Mexico", flag: "🇲🇽" },
  ];

  const getSelectedMarketplace = () => {
    return marketplaceOptions.find(option => option.id === marketplaceId) || marketplaceOptions[1];
  };

  const handleMarketplaceSelect = (id: string) => {
    setMarketplaceId(id);
    setIsDropdownOpen(false);
  };

  const handleStartNewScan = () => {
    setActiveTab("new");
  };

  const handleDetailsClick = (productId: string) => {
    setSelectedProductId((prev) => (prev === productId ? null : productId));
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }
    
    const file = files[0];
    
    // File type validation is done by extension check below
    
    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      message.error('File is too large. Maximum size is 5MB');
      event.target.value = '';
      return;
    }
    
    // Validate file extension
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls') && !fileName.endsWith('.ods')) {
      message.error('Invalid file extension. Please upload an Excel file (.xlsx, .xls, .ods)');
      event.target.value = '';
      return;
    }
    
    // Set the file if all validations pass
    setSelectedFile(file);
    message.success(`File "${file.name}" selected successfully`);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      message.error('Please select a file first');
      return;
    }

    if (!productName.trim()) {
      message.error('Please enter a product name');
      return;
    }
    
    // Additional validation before upload
    if (productName.trim().length < 3) {
      message.error('Product name must be at least 3 characters long');
      return;
    }
    
    if (productName.trim().length > 100) {
      message.error('Product name must be less than 100 characters');
      return;
    }

    setIsUploading(true);
    const retryCount = 0;
    const maxRetries = 2;
    
    const attemptUpload = async () => {
      try {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('product_name', productName.trim());
        formData.append('product_id_type', 'asin,upc'); // Include both ASIN and UPC
        formData.append('marketplace_id', marketplaceId);

        const headers = new Headers();
        headers.append('Accept', 'application/json');
        headers.append('Cache-Control', 'no-cache, no-store, must-revalidate');
        headers.append('Pragma', 'no-cache');

        const response = await fetch('/api/upc-scanner', {
          method: 'POST',
          body: formData,
          headers: headers
        });

        if (response.ok) {
          const result: SingleScanResponse = await response.json();
          message.success('UPC Scan created successfully!');
          
          // Add the new scan result to the existing results
          setScanResults(prevResults => [result.data, ...prevResults]);
          
          // Reset form
          setSelectedFile(null);
          setProductName("");
          setActiveTab('upc'); // Switch back to results tab
          
          // Reset file input
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        } else {
          const errorText = await response.text();
          let errorMessage = 'Upload failed';
          
          try {
            const errorResult = JSON.parse(errorText);
            errorMessage = errorResult.message || errorMessage;
          } catch {
            // If JSON parsing fails, use the raw error text
            errorMessage = `Upload failed: ${response.status} ${errorText.substring(0, 100)}`;
          }
          
          throw new Error(errorMessage);
        }
      } catch (error) {
        console.error('Upload error:', error);
        message.error({
          content: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          duration: 5
        });
        
        setIsUploading(false);
        return false;
      }
      
      return true;
    };
    
    const success = await attemptUpload();
    if (success) {
      setIsUploading(false);
    }
  };

  return (
    <section className="flex flex-col gap-8 min-h-[50dvh] md:min-h-[80dvh] rounded-xl bg-white p-4 lg:p-5">
      <Header onStartScan={() => setActiveTab("new")} />

      <div className="p-3 sm:p-4 rounded-xl border border-border flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 sm:items-center justify-between">
          <div className="flex gap-2 flex-wrap sm:flex-nowrap text-sm">
            <button
              type="button"
              onClick={() => {
                setActiveTab("upc");
                setSelectedProductId(null);
              }}
              className={`flex items-center gap-1.5 rounded-full font-semibold py-2 px-4 transition-colors ${
                selectedProductId
                  ? "bg-[#F3F4F6] text-[#858587] hover:bg-[#F3F4F6]/90"
                  : activeTab === "upc"
                  ? "bg-primary text-white hover:bg-primary/90"
                  : "bg-[#F3F4F6] text-[#858587] hover:bg-[#F3F4F6]/90"
              }`}
            >
              <MdOutlineInsertChartOutlined className="size-5" />
              UPC Scanner
            </button>

            {/* either "New Scan" or "Product Title"  */}
            {!selectedProductId ? (
              <button
                type="button"
                onClick={handleStartNewScan}
                className={`flex items-center gap-1.5 rounded-full font-semibold py-2 px-4 transition-colors ${
                  activeTab === "new"
                    ? "bg-primary text-white hover:bg-primary/90"
                    : "bg-[#F3F4F6] text-[#858587] hover:bg-[#F3F4F6]/90"
                }`}
              >
                <MdOutlineInsertChartOutlined className="size-5" />
                Start a new scan
              </button>
            ) : (
              <div className="flex items-center gap-1.5 rounded-full font-semibold py-2 px-4 bg-primary text-white">
                <MdOutlineInsertChartOutlined className="size-5" />
                {scanDetails?.product_name || "Loading..."}
                <button
                  type="button"
                  aria-label="Cancel"
                  onClick={() => setSelectedProductId(null)}
                  className="ml-2 hover:bg-white/20 rounded-full p-1"
                >
                  <CgClose className="size-4" />
                </button>
              </div>
            )}


          </div>

          {activeTab === "upc" && !selectedProductId && (
            <div className="flex gap-4 text-[#8C94A2] items-center flex-wrap sm:flex-nowrap">
              <div className="flex items-center gap-2 md:gap-4 text-sm max-w-md">
                <label htmlFor="product_name">Name Search</label>
                <div className="relative">
                  <IoSearchOutline className="absolute top-0 bottom-0 size-5 my-auto text-gray-400 left-3" />
                  <input
                    type="text"
                    id="product_name"
                    placeholder="Enter Search Name"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full py-3 pl-10 pr-4 text-[#596375] border border-border rounded-lg outline-none focus:border-primary"
                  />
                </div>
              </div>

              <MiniDatePicker 
                selectedDate={filterDate || undefined}
                onChange={(date) => setFilterDate(date)}
              />
            </div>
          )}
        </div>

        {/* UPC Scanner Tab */}
        {activeTab === "upc" && (
          <div className="flex flex-col gap-4">
            <div className=" flex items-center gap-5">
            <p className="text-[#8C94A3] text-sm font-medium">
              {selectedProductId 
                ? `${scanDetails?.products?.length || 0} Products found` 
                : filteredScanResults.length > 0 
                  ? `${filteredScanResults.length} Searches found` 
                  : "No searches found"
              }
            </p>
            <div className=" text-[#8C94A3] text-sm font-medium border rounded-xl p-1 px-3">
              <span>
               Scans Left: {(data?.data?.used || 0) + "/" + (data?.data?.limit || 0)}
                </span>
            </div>
            </div>
            {selectedProductId ? (
              <div className="">
                <div className="bg-[#F3F4F6] rounded-t-xl grid lg:grid-cols-[456px_1fr] lg:divide-x-2 divide-gray-200 border border-b-0 border-gray-200">
                  <div className="hidden lg:block p-8" />
                  <div className="p-6 lg:p-8 text-[#596375] text-sm font-semibold text-center lg:text-start">
                    Fees and Profit
                  </div>
                </div>
                <ScanDetailsTable 
                  products={scanDetails?.products || []} 
                  isLoading={isLoadingDetails} 
                />
              </div>
            ) : (
              <ScanResultsTable 
                onDetailsClick={handleDetailsClick}
                onRefreshScan={handleRefreshScan}
                onRestartScan={handleRestartScan}
                onDeleteScan={handleDeleteScan}
                scanResults={filteredScanResults}
                isLoading={isLoading}
              />
            )}
          </div>
        )}

        {/* New Scanner Tab */}
        {activeTab === "new" && (
          <div className="flex flex-col gap-6">
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-8 min-h-[598px] flex flex-col justify-center">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-[#F3F4F6] rounded-full flex items-center justify-center mx-auto mb-4">
                  <HiOutlineCloudArrowUp className="w-8 h-8 text-[#6B7280]" />
                </div>
                <h3 className="text-[#111827] font-semibold text-xl mb-2">
                  Upload Excel File
                </h3>
                <p className="text-[#6B7280] text-sm">
                  Upload Excel files (.xlsx, .xls) containing UPC codes to start scanning
                </p>
              </div>

              {/* Form Fields */}
              <div className="max-w-md mx-auto w-full space-y-6">
                <div className="space-y-2">
                  <label htmlFor="productName" className="block text-sm font-medium text-[#374151]">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="productName"
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="Enter product name"
                    className="w-full px-4 py-3 border border-[#D1D5DB] rounded-lg text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                    disabled={isUploading}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="marketplace" className="block text-sm font-medium text-[#374151]">
                    Marketplace
                  </label>
                  <div className="relative" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      disabled={isUploading}
                      className="w-full px-4 py-3.5 pl-14 pr-12 border border-[#D1D5DB] rounded-lg text-[#111827] bg-white hover:bg-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 text-left font-medium"
                      style={{ fontFamily: 'inherit' }}
                    >
                      {getSelectedMarketplace().name}
                    </button>
                    
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <span className="text-xl w-8 h-8 rounded-full bg-white shadow-sm border border-gray-200 flex items-center justify-center">
                        {getSelectedMarketplace().flag}
                      </span>
                    </div>
                    
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg 
                        className={`w-4 h-4 text-[#6B7280] transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>

                    {isDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#D1D5DB] rounded-lg shadow-xl z-10 overflow-hidden">
                        {marketplaceOptions.map((option, index) => (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => handleMarketplaceSelect(option.id)}
                            className={`w-full px-4 py-4 pl-14 pr-6 text-left hover:bg-[#F3F4F6] focus:outline-none focus:bg-[#F3F4F6] transition-all duration-200 text-[#111827] font-medium relative ${
                              marketplaceId === option.id ? 'bg-primary/5 border-l-4 border-l-primary' : ''
                            } ${index !== marketplaceOptions.length - 1 ? 'border-b border-[#E5E7EB]' : ''}`}
                            style={{ fontFamily: 'inherit' }}
                          >
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
                              <span className="text-xl w-8 h-8 rounded-full bg-white shadow-sm border border-gray-200 flex items-center justify-center">
                                {option.flag}
                              </span>
                            </span>
                            <span className="block">{option.name}</span>
                            {marketplaceId === option.id && (
                              <span className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* File Upload Section */}
              <div className="mt-8 space-y-6">
                {selectedFile && (
                  <div className="bg-primary/5 border border-primary rounded-lg p-4 max-w-md mx-auto">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-primary font-medium text-sm">File Selected</p>
                <p className="text-primary/80 text-xs">{selectedFile.name}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                  <button
                    type="button"
                    onClick={handleFileSelect}
                    disabled={isUploading}
                    className="inline-flex items-center gap-2 px-6 py-3 border border-[#D1D5DB] rounded-full text-[#374151] bg-white hover:bg-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                  >
                    <HiOutlineCloudArrowUp className="w-5 h-5" />
                    {selectedFile ? 'Change File' : 'Select Excel File'}
                  </button>

                  {selectedFile && productName.trim() && (
                    <button
                      type="button"
                      onClick={handleUpload}
                      disabled={isUploading}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-full transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      {isUploading ? (
                        <>
                          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Uploading...
                        </>
                      ) : (
                        'Start UPC Scan'
                      )}
                    </button>
                  )}
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default UpcScanner;