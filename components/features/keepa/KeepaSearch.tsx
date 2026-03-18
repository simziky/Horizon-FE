"use client"

import { useEffect, useState } from "react"
import { CiSearch } from "react-icons/ci"
import { message } from "antd"

interface KeepaSearchProps {
  onSearch: (asin: string) => void
  isLoading: boolean
    initialValue?: string | null
}

export default function KeepaSearch({ onSearch, isLoading, initialValue }: KeepaSearchProps) {
  const [searchValue, setSearchValue] = useState("")

  const extractASIN = (input: string): string | null => {
    // Clean the input
    const cleaned = input.trim()
    
    // If it's already an ASIN (10 characters, alphanumeric)
    if (/^[A-Z0-9]{10}$/i.test(cleaned)) {
      return cleaned.toUpperCase()
    }
    
    // Extract ASIN from Amazon URL
    const asinMatch = cleaned.match(/\/([A-Z0-9]{10})(?:\/|$|\?)/i)
    if (asinMatch) {
      return asinMatch[1].toUpperCase()
    }
    
    return null
  }

  const handleSearch = () => {
    if (!searchValue.trim()) {
      message.error("Please enter an ASIN or Amazon product URL")
      return
    }

    const asin = extractASIN(searchValue)
    if (!asin) {
      message.error("Please enter a valid ASIN or Amazon product URL")
      return
    }

    onSearch(asin)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

    useEffect(() => {
    if (initialValue) {
      setSearchValue(initialValue)
    }
  }, [initialValue])
  return (
    <div className="border border-border rounded-xl p-6 bg-white">
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="font-semibold text-lg text-[#01011D] mb-2">Product Search</h3>
          <p className="text-sm text-[#787891]">
            Enter an Amazon product ASIN or product URL to start tracking price history and sales data
          </p>
        </div>
        
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter ASIN (e.g., B08N5WRWNW) or Amazon product URL"
              className="w-full px-4 py-3 pr-12 border border-[#EBEBEB] rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
              disabled={isLoading}
            />
            <CiSearch className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#787891] size-5" />
          </div>
          
          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="px-6 py-3 bg-primary hover:bg-primary-hover text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Searching..." : "Track Product"}
          </button>
        </div>
        
        <div className="text-xs text-[#787891]">
          <p className="mb-1"><strong>Supported formats:</strong></p>
          <ul className="space-y-1 ml-4">
            <li>• ASIN: B08N5WRWNW</li>
            <li>• Amazon URL: https://www.amazon.com/dp/B08N5WRWNW</li>
            <li>• Amazon URL: https://www.amazon.co.uk/product/B08N5WRWNW</li>
          </ul>
        </div>
      </div>
    </div>
  )
} 