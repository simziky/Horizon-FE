import React, { useState } from "react";
import { DatePicker } from "antd";
import dayjs from "dayjs";
import "dayjs/locale/en";
import { BsCalendar } from "react-icons/bs";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi";

interface CustomDatePickerProps {
  isRange?: boolean;
  onChange?: (dates: dayjs.Dayjs | [dayjs.Dayjs, dayjs.Dayjs]) => void;
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  isRange = false,
  onChange,
}) => {
  const currentDate = dayjs(); // Today's date
  const [startDate, setStartDate] = useState(
    isRange ? currentDate.subtract(1, "month") : currentDate
  ); // Default: start with prev month for range, current month for single
  const [endDate, setEndDate] = useState(currentDate);
  const [isInitialized, setIsInitialized] = useState(false);

  React.useEffect(() => {
    if (isRange && !isInitialized) {
      onChange?.([startDate, endDate]);
      setIsInitialized(true);
    }
  }, [isRange, onChange, startDate, endDate, isInitialized]);

  const handlePrev = () => {
    if (isRange) {
      const duration = endDate.diff(startDate, "month");
      const newStart = startDate.subtract(1, "month");
      const newEnd = newStart.add(duration, "month");
      setStartDate(newStart);
      setEndDate(newEnd);
      onChange?.([newStart, newEnd]);
    } else {
      const newDate = startDate.subtract(1, "month");
      setStartDate(newDate);
      onChange?.(newDate);
    }
  };

  const handleNext = () => {
    if (isRange) {
      const duration = endDate.diff(startDate, "month");
      const newStart = startDate.add(1, "month");
      const newEnd = newStart.add(duration, "month");
      setStartDate(newStart);
      setEndDate(newEnd);
      onChange?.([newStart, newEnd]);
    } else {
      const newDate = startDate.add(1, "month");
      setStartDate(newDate);
      onChange?.(newDate);
    }
  };

  const handleDateChange = (
    dates: dayjs.Dayjs | [dayjs.Dayjs, dayjs.Dayjs] | null
  ) => {
    if (!dates) return;

    if (isRange && Array.isArray(dates)) {
      setStartDate(dates[0]);
      setEndDate(dates[1]);
      onChange?.(dates as [dayjs.Dayjs, dayjs.Dayjs]);
    } else if (!isRange && !Array.isArray(dates)) {
      setStartDate(dates);
      onChange?.(dates);
    }
  };

  const disabledDate = (current: dayjs.Dayjs) => {
    // Disable dates that are after today
    return current && current > dayjs().endOf("day");
  };

  // Disable the "Next" button if the end date is the current month (for range) or start date is the current month (for single)
  const isNextButtonDisabled = isRange
    ? endDate.isSame(currentDate, "month")
    : startDate.isSame(currentDate, "month");

  return (
    <div className="flex items-center">
      <button
        aria-label="Previous"
        type="button"
        className="p-2 rounded-l-full border border-gray-300"
        onClick={handlePrev}
      >
        <HiChevronLeft size={16} />
      </button>

      <span className="border flex items-center gap-2 px-2">
        {!isRange && <BsCalendar className="size-4" />}

        {isRange ? (
          <DatePicker.RangePicker
            picker="month"
            value={[startDate, endDate]}
            onChange={(dates) =>
              handleDateChange(dates as [dayjs.Dayjs, dayjs.Dayjs])
            }
            format="MMM YYYY"
            defaultPickerValue={[startDate, endDate]}
            allowClear={false}
            suffixIcon={null}
            className="!border-none !rounded-none !shadow-none !p-1 !text-center !w-[200px]"
            popupClassName="custom-datepicker-popup"
            renderExtraFooter={() => null}
            disabledDate={disabledDate}
          />
        ) : (
          <DatePicker
            picker="month"
            value={startDate}
            onChange={(date) => handleDateChange(date)}
            format="MMM YYYY"
            allowClear={false}
            suffixIcon={null}
            className="!border-none !rounded-none !shadow-none !p-1 !text-center !w-[93px]"
           popupClassName="custom-datepicker-popup"
            renderExtraFooter={() => null}
            disabledDate={disabledDate}
          />
        )}
      </span>

      <button
        aria-label="Next"
        type="button"
        className={`p-2 rounded-r-full border border-gray-300 ${
          isNextButtonDisabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
        onClick={handleNext}
        disabled={isNextButtonDisabled}
      >
        <HiChevronRight size={16} />
      </button>
    </div>
  );
};

export default CustomDatePicker;

