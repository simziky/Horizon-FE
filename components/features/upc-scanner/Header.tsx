import Image from "next/image";
import { CustomSelect as Select } from "@/components/ui/AntdComponents";
import { HiOutlinePrinter } from "react-icons/hi2";
import ExcelIcon from "@/public/assets/svg/excel-icon.svg";
import { useCallback } from "react";

interface HeaderProps {
  onStartScan?: () => void;
}

// If the API server serves the template directly
const Header = ({ onStartScan }: HeaderProps) => {
  const handleDownloadTemplate = useCallback(() => {
    // Access the API endpoint with credentials
    fetch('/api/upc-scanner/download-template', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Important for including cookies/auth
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.blob();
      })
      .then(blob => {
        // Create a URL for the blob
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'upc-template.xlsx');
        
        // Append to the document body, click it, then remove it
        document.body.appendChild(link);
        link.click();
        
        // Clean up
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      })
      .catch(error => {
        console.error('Error downloading template:', error);
        alert('Failed to download template. Please try again.');
      });
  }, []);

  return (
    <div className="p-3 sm:p-4 rounded-xl border border-border flex flex-col lg:flex-row gap-4 justify-between xl:items-center">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        Calculate profit by{" "}
        <Select
          className="sm:min-w-[280px]"
          defaultValue="buybox_price"
          options={[
            {
              value: "buybox_price",
              label: "Buy box price",
            },
          ]}
        />
      </div>

      <div className="flex gap-2 flex-wrap sm:flex-nowrap text-sm">
        <button
          type="button"
          onClick={onStartScan}
          className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 transition-colors rounded-full text-white font-semibold py-2 px-4"
        >
          <HiOutlinePrinter className="size-5" />
          Start Scanner
        </button>
        <button
          type="button"
          onClick={handleDownloadTemplate}
          className="flex items-center gap-1.5 hover:bg-gray-50 rounded-full text-[#8C94A2] border border-border font-semibold py-2 px-4"
        >
          <Image
            src={ExcelIcon}
            alt="Excel icon"
            className="size-5"
            width={21}
            height={20}
            unoptimized
          />
          Excel Template
        </button>
      </div>
    </div>
  );
};

export default Header;