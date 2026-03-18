"use client";

import { useState, useRef, ChangeEvent, FormEvent, useEffect } from "react";
import { HiOutlineCloudArrowUp, HiOutlineXMark } from "react-icons/hi2";
import { BiChevronDown } from "react-icons/bi";
import { CustomSelect as Select } from "@/components/ui/AntdComponents";
import { message } from "antd";
import Image from "next/image";

interface ExcelUploadFormProps {
  onUploadSuccess: (scanData: ScanResult) => void;
}

interface ScanResult {
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

interface Marketplace {
  id: string;
  name: string;
  flag: string;
}

// Marketplace options with flag codes and correct marketplace IDs
const marketplaceOptions: Marketplace[] = [
  { id: "1", name: "United States", flag: "us" },
  { id: "6", name: "Canada", flag: "ca" },
  { id: "2", name: "United Kingdom", flag: "gb" },
  { id: "11", name: "Mexico", flag: "mx" },
];

const ExcelUploadForm: React.FC<ExcelUploadFormProps> = ({ onUploadSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [productName, setProductName] = useState<string>("");
  const [productIdType, setProductIdType] = useState<string>("asin");
  const [marketplaceDropdownOpen, setMarketplaceDropdownOpen] = useState<boolean>(false);
  const [selectedMarketplace, setSelectedMarketplace] = useState<Marketplace>(marketplaceOptions[0]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const marketplaceDropdownRef = useRef<HTMLDivElement>(null);

  // Handle clicks outside of the marketplace dropdown
  const handleClickOutside = (event: MouseEvent) => {
    if (
      marketplaceDropdownRef.current && 
      !marketplaceDropdownRef.current.contains(event.target as Node)
    ) {
      setMarketplaceDropdownOpen(false);
    }
  };

  // Add event listener for clicking outside
  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Check if it's an Excel file
      if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
        message.error('Please select an Excel file (.xlsx or .xls)');
        return;
      }
      
      setFile(selectedFile);
    }
  };

  const handleMarketplaceSelect = (marketplace: Marketplace) => {
    setSelectedMarketplace(marketplace);
    setMarketplaceDropdownOpen(false);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!file) {
      message.error('Please select an Excel file to upload');
      return;
    }
    
    if (!productName) {
      message.error('Please enter a product name');
      return;
    }
    
    setIsUploading(true);
    
    // Create form data
    const formData = new FormData();
    formData.append('product_name', productName);
    formData.append('product_id_type', productIdType);
    formData.append('marketplace_id', selectedMarketplace.id);
    formData.append('file', file);
    
    try {
      const response = await fetch('/api/upc-scanner', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      message.success('UPC scan created successfully');
      onUploadSuccess(data.data);
      
      // Reset form
      setFile(null);
      setProductName("");
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      message.error('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-[#596375] text-sm font-medium mb-2">
            Product Name
          </label>
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            className="w-full rounded-lg border border-[#D5D5D5] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="Enter name for this scan"
            required
          />
        </div>
        
        <div>
          <label className="block text-[#596375] text-sm font-medium mb-2">
            Product ID Type
          </label>
          <Select
            value={productIdType}
            onChange={(value: string) => setProductIdType(value)}
            className="w-full"
            options={[
              { value: "asin", label: "ASIN" },
              { value: "upc", label: "UPC" },
            ]}
          />
        </div>
        
        <div>
          <label className="block text-[#596375] text-sm font-medium mb-2">
            Marketplace
          </label>
          
          {/* Marketplace Dropdown with Flags */}
          <div className="relative" ref={marketplaceDropdownRef}>
            <button
              type="button"
              onClick={() => setMarketplaceDropdownOpen(!marketplaceDropdownOpen)}
              className="flex items-center justify-between gap-2 w-full p-2 border border-[#D5D5D5] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <div className="flex items-center gap-2">
                <Image
                  src={`https://flagcdn.com/w40/${selectedMarketplace.flag}.png`}
                  alt={selectedMarketplace.name}
                  className="w-6 h-6 rounded-full object-cover"
                  width={24}
                  height={16}
                  quality={90}
                  unoptimized
                />
                <span className="text-sm">{selectedMarketplace.name}</span>
              </div>
              <BiChevronDown className={`size-5 transition-transform ${marketplaceDropdownOpen ? "rotate-180" : ""}`} />
            </button>
            
            {marketplaceDropdownOpen && (
              <ul className="absolute z-10 w-full mt-1 border rounded-md bg-white shadow-lg max-h-60 overflow-y-auto">
                {marketplaceOptions.map((marketplace) => (
                  <li
                    key={marketplace.id}
                    onClick={() => handleMarketplaceSelect(marketplace)}
                    className="flex items-center p-2 px-3 hover:bg-gray-100 cursor-pointer"
                  >
                    <Image
                      src={`https://flagcdn.com/w40/${marketplace.flag}.png`}
                      alt={marketplace.name}
                      className="w-6 h-6 rounded-full object-cover"
                      width={24}
                      height={16}
                      quality={90}
                      unoptimized
                    />
                    <span className="text-sm ml-2">{marketplace.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
      
      <div>
        <label className="block text-[#596375] text-sm font-medium mb-2">
          Upload Excel File
        </label>
        
        {!file ? (
          <div
            className="border-2 border-dashed border-[#D5D5D5] rounded-lg p-4 flex flex-col items-center justify-center h-32 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <HiOutlineCloudArrowUp className="size-8 text-[#8C94A3]" />
            <p className="text-[#8C94A3] mt-2">Click to upload or drag and drop</p>
            <p className="text-[#A9ACB2] text-xs">Excel files only (.xlsx, .xls)</p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".xlsx,.xls"
            />
          </div>
        ) : (
          <div className="flex items-center justify-between border border-[#D5D5D5] rounded-lg p-3">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary">
                    <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M10 9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
              </div>
              <div className="overflow-hidden">
                <p className="font-medium text-sm truncate max-w-[200px]">{file.name}</p>
                <p className="text-xs text-[#8C94A3]">{(file.size / 1024).toFixed(2)} KB</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemoveFile}
              className="text-[#8C94A3] hover:text-red-500"
            >
              <HiOutlineXMark className="size-5" />
            </button>
          </div>
        )}
      </div>
      
      <div className="flex justify-end mt-4">
        <button
          type="submit"
          disabled={isUploading || !file || !productName}
          className="bg-primary hover:bg-primary/90 text-white rounded-full py-2 px-6 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? "Uploading..." : "Upload and Scan"}
        </button>
      </div>
    </form>
  );
};

export default ExcelUploadForm;