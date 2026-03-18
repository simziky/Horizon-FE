"use client";

import { useRef, useState } from "react";
import { DatePicker } from "antd";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import dayjs, { Dayjs } from "dayjs";
import { MdOutlineCalendarMonth } from "react-icons/md";

const ProductDatePicker = () => {
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [open, setOpen] = useState(false);
  const pickerRef = useRef(null);

  const handlePrev = () => setSelectedDate((prev) => prev.subtract(1, "day"));
  const handleNext = () => setSelectedDate((prev) => prev.add(1, "day"));
  const handleTriggerClick = () => setOpen(true);

  return (
    <div className=" inline-flex flex-col items-start ">
      {/* Custom pill UI */}
      <div className="flex w-full items-center divide-x-2 border border-border rounded-full bg-white text-[#8C94A2]">
        <button
          type="button"
          aria-label="Previous"
          onClick={handlePrev}
          className="hover:text-gray-700 p-1"
        >
          <FiChevronLeft size={20} />
        </button>

        <button
          type="button"
          onClick={handleTriggerClick}
          className="flex w-[100px]  items-center space-x-2 hover:text-gray-800 focus:outline-none p-1"
        >
          <MdOutlineCalendarMonth size={20} />
          <span className="text-xs font-medium">
            {selectedDate.format("MMM, DD")}
          </span>
        </button>

        <button
          type="button"
          aria-label="Next"
          onClick={handleNext}
          className="hover:text-gray-700 p-1"
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
            if (date) setSelectedDate(date);
            setOpen(false);
          }}
          onOpenChange={(nextOpen) => setOpen(nextOpen)}
          allowClear={false}
          format="YYYY-MM-DD"
          popupClassName="z-[9999]"
        />
      </div>
    </div>
  );
};

export default ProductDatePicker;

