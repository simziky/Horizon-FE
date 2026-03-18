"use client";

import { useRef, useState } from "react";
import { DatePicker } from "antd";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import dayjs, { Dayjs } from "dayjs";
import { MdOutlineCalendarMonth } from "react-icons/md";

interface MiniDatePickerProps {
  selectedDate?: Dayjs;
  onChange?: (date: Dayjs) => void;
}

const MiniDatePicker = ({ selectedDate: propDate, onChange }: MiniDatePickerProps) => {
  const [selectedDate, setSelectedDate] = useState<Dayjs>(propDate || dayjs());
  const [open, setOpen] = useState(false);
  const pickerRef = useRef(null);

  const handlePrev = () => {
    const newDate = selectedDate.subtract(1, "month");
    setSelectedDate(newDate);
    onChange?.(newDate);
  };
  
  const handleNext = () => {
    const newDate = selectedDate.add(1, "month");
    setSelectedDate(newDate);
    onChange?.(newDate);
  };
  
  const handleTriggerClick = () => setOpen(true);

  return (
    <div className="relative inline-flex flex-col items-start">
      {/* Custom pill UI */}
      <div className="flex items-center divide-x-2 border border-border rounded-full bg-white text-[#8C94A2]">
        <button
          type="button"
          aria-label="Previous"
          onClick={handlePrev}
          className="hover:text-gray-700 p-2"
        >
          <FiChevronLeft size={20} />
        </button>

        <button
          type="button"
          onClick={handleTriggerClick}
          className="flex items-center space-x-2 hover:text-gray-800 focus:outline-none p-2"
        >
          <MdOutlineCalendarMonth size={20} />
          <span className="text-md font-medium">
            {selectedDate.format("MMM YYYY")}
          </span>
        </button>

        <button
          type="button"
          aria-label="Next"
          onClick={handleNext}
          className="hover:text-gray-700 p-2"
        >
          <FiChevronRight size={20} />
        </button>
      </div>

      {/* Keep DatePicker, just for the calendar, but make it invisible */}
      <div className="absolute top-2 left-0 w-0 h-0 overflow-hidden">
        <DatePicker
          ref={pickerRef}
          open={open}
          value={selectedDate}
          onChange={(date) => {
            if (date) {
              setSelectedDate(date);
              onChange?.(date);
            }
            setOpen(false);
          }}
          onOpenChange={(nextOpen) => setOpen(nextOpen)}
          allowClear={false}
          picker="month"
          format="YYYY-MM"
          popupClassName="z-[9999] upc-month-picker"
        />
      </div>
      
      {/* Custom styles for the month picker */}
      <style jsx global>{`
        .upc-month-picker .ant-picker-cell-in-view.ant-picker-cell-selected .ant-picker-cell-inner {
          background-color: #18CB96 !important;
        }
        
        .upc-month-picker .ant-picker-cell-in-view.ant-picker-cell-selected:hover .ant-picker-cell-inner {
          background-color: #16b885 !important;
        }
        
        .upc-month-picker .ant-picker-cell:hover:not(.ant-picker-cell-selected) .ant-picker-cell-inner {
          background-color: rgba(24, 203, 150, 0.1) !important;
        }
        
        .upc-month-picker .ant-picker-header-view button:hover {
          color: #18CB96 !important;
        }
        
        .upc-month-picker .ant-picker-today-btn {
          color: #18CB96 !important;
        }
        
        .upc-month-picker .ant-picker-today-btn:hover {
          color: #16b885 !important;
        }
      `}</style>
    </div>
  );
};

export default MiniDatePicker;

