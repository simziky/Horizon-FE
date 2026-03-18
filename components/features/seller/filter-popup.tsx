import { useEffect, useState } from "react";
import { Popover, Checkbox, Slider } from "antd";
import { RiEqualizerFill } from "react-icons/ri";
import { FiFilter } from "react-icons/fi";
import { IoCheckmarkSharp, IoClose } from "react-icons/io5";

export interface FilterParams {
  estimatedSale?: "highest" | "lowest";
  buyboxAmount?: number;
  offer?: "fba" | "fbm";
  minBsr?: number;
  maxBsr?: number;
  q?: string;
  brandName?: string;
}

interface FilterPopupProps {
  onApply: (filters: FilterParams) => void;
}

const FilterPopup = ({ onApply }: FilterPopupProps) => {
  const [visible, setVisible] = useState(false);
  const [filters, setFilters] = useState<FilterParams>({});
  const [validationError, setValidationError] = useState<string | null>(null);
  const [applyDisabled, setApplyDisabled] = useState(false);

  useEffect(() => {
    if (filters.minBsr && filters.maxBsr && filters.maxBsr <= filters.minBsr) {
      setValidationError("Max BSR must be greater than Min BSR");
      setApplyDisabled(true);
    } else {
      setValidationError(null);
      setApplyDisabled(false);
    }
  }, [filters.minBsr, filters.maxBsr]);


  const handleApply = () => {
    if (applyDisabled) return;
    onApply(filters);
    setVisible(false);
  };

  const handleClear = () => {
    setFilters({});
    setValidationError(null);
    setApplyDisabled(false);
    onApply({});
    setVisible(false);
  };

  const content = (
    <div className="w-[368px] py-2 px-4 bg-white">
      <p className="bg-primary flex items-center gap-1 rounded-2xl py-2 px-4 text-white font-semibold w-max text-sm mb-3">
        <FiFilter className="size-4" />
        Filter
      </p>

      {/* Estimated Sale */}
      <div className="mb-4">
        <div className="font-semibold text-sm text-[#252C32] mb-2">
          Estimated Sale
        </div>
        <span className="flex flex-col gap-1">
          <Checkbox
            checked={filters.estimatedSale === "highest"}
            onChange={(e) =>
              setFilters({
                ...filters,
                estimatedSale: e.target.checked ? "highest" : undefined,
              })
            }
            className="block mb-1"
          >
            Highest
          </Checkbox>
          <Checkbox
            checked={filters.estimatedSale === "lowest"}
            onChange={(e) =>
              setFilters({
                ...filters,
                estimatedSale: e.target.checked ? "lowest" : undefined,
              })
            }
            className="block"
          >
            Lowest
          </Checkbox>
        </span>
      </div>

      {/* Buy Box Amount */}
      <div className="mb-4">
        <div className="font-semibold text-sm text-[#252C32] mb-1">
          Buy Box Amount
        </div>
        <div className="text-xs text-[#596375] flex justify-between mb-1">
          <span>$1</span>
          <span className="text-[#47CB97]">${filters.buyboxAmount}</span>
          <span>$300</span>
        </div>
        <Slider
          min={1}
          max={300}
          value={filters.buyboxAmount}
          onChange={(value) => setFilters({ ...filters, buyboxAmount: value })}
        />
      </div>

      {/* Offer */}
      <div className="mb-4">
        <div className="font-semibold text-sm text-[#252C32] mb-2">Offer</div>
        <span className="flex flex-col gap-1">
          <Checkbox
            checked={filters.offer === "fbm"}
            onChange={(e) =>
              setFilters({
                ...filters,
                offer: e.target.checked ? "fbm" : undefined,
              })
            }
            className="block mb-1"
          >
            FBM
          </Checkbox>
          <Checkbox
            checked={filters.offer === "fba"}
            onChange={(e) =>
              setFilters({
                ...filters,
                offer: e.target.checked ? "fba" : undefined,
              })
            }
            className="block"
          >
            FBA
          </Checkbox>
        </span>
      </div>

      {/* BSR */}
      <div className="mb-4">
        <div className="font-semibold text-sm text-[#252C32] mb-2">BSR</div>
        <div className="mb-3">
          <p>Set Minimum BSR</p>
          <div className="text-xs text-[#596375] flex justify-between mt-2">
            <span>1000</span>
            <span className="text-[#47CB97]">{filters.minBsr}</span>
            <span>10,000</span>
          </div>
          <Slider
            min={1000}
            max={10000}
            value={filters.minBsr}
            onChange={(value) => setFilters({ ...filters, minBsr: value })}
          />
        </div>

        <div className="mb-3">
          <p>Set Maximum BSR</p>
          <div className="text-xs text-[#596375] flex justify-between mt-4">
            <span>100,000</span>
            <span className="text-[#47CB97]">{filters.maxBsr}</span>
            <span>1,000,000</span>
          </div>
          <Slider
            min={100000}
            max={1000000}
            step={1000}
            value={filters.maxBsr}
            onChange={(value) => setFilters({ ...filters, maxBsr: value })}
          />
        </div>
        {validationError && (
          <div className="text-red-500 text-sm my-2">{validationError}</div>
        )}
      </div>

      {/* Footer Buttons */}
      <div className="flex gap-3 justify-end items-center mt-6">
        <button
          type="button"
          onClick={handleClear}
          className="bg-transparent text-[#596375] hover:bg-gray-50 rounded-xl py-3 px-5 flex items-center gap-1 text-sm font-semibold"
        >
          <IoClose className="size-5" />
          Clear
        </button>
        <button
          type="button"
          className={`${
            applyDisabled
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-primary hover:bg-primary-hover"
          } text-white rounded-xl py-3 px-5 flex items-center gap-1 text-sm font-semibold`}
          onClick={handleApply}
          disabled={applyDisabled}
        >
          <IoCheckmarkSharp className="size-5" /> Apply
        </button>
      </div>
    </div>
  );

  return (
    <Popover
      content={content}
      trigger="click"
      open={visible}
      onOpenChange={setVisible}
      placement="bottomRight"
    >
      <button
        type="button"
        className="border border-[#8B8D94] rounded-xl text-sm text-[#596375] flex items-center justify-center gap-2 w-[102px] py-2"
      >
        Filter <RiEqualizerFill className="size-4" />
      </button>
    </Popover>
  );
};

export default FilterPopup;

