import Link from "next/link";

const Alerts = () => {
  return (
    <div className="rounded-xl bg-white">
      <div className="border-b border-[#E7EBEE] p-4 lg:p-5 flex items-center gap-6 justify-between">
        <span className="bg-[#F3F4F6] px-3 py-1.5 rounded-3xl text-[#676A75] font-semibold text-sm w-max">
          Alerts
        </span>

        <div className="flex items-center gap-1.5 text-white font-bold text-sm">
          <span className="bg-primary rounded-full size-8 flex items-center justify-center">
            6
          </span>
          <span className="bg-[#FFC56E] opacity-15 rounded-full size-8 flex items-center justify-center" />
          <span className="bg-[#DF4740] opacity-15 rounded-full size-8 flex items-center justify-center" />
        </div>
      </div>

      <div className="p-4 lg:p-5">
        <div className="bg-[#FAF5EC] rounded-xl p-4 text-sm font-medium flex items-center gap-3 justify-between">
          <p className="text-[#CA7D09] max-w-[250px]">
            Some alerts require you to be logged in to Seller Central
          </p>
          <Link
            href=""
            className="bg-white hover:bg-gray-50 transition-colors duration-200 text-black py-1.5 px-4 rounded-[10px]"
          >
            Login
          </Link>
        </div>

        <div className="mt-5 text-[#8C94A3] text-sm font-medium flex flex-col gap-4">
          <span className="flex gap-4 items-center justify-between">
            <p>Amazon Share Buy Box</p>
            <p className="text-[#008158]">Never on Listing</p>
          </span>
          <span className="flex gap-4 items-center justify-between">
            <p>Private Label</p>
            <p className="text-[#008158]">Unlikely</p>
          </span>
          <span className="flex gap-4 items-center justify-between">
            <p>IP Analysis</p>
            <p className="text-[#008158]">No known IP issues</p>
          </span>
          <span className="flex gap-4 items-center justify-between">
            <p>Size</p>
            <p className="text-[#008158]">Standard Size</p>
          </span>
          <span className="flex gap-4 items-center justify-between">
            <p>Meltable</p>
            <p className="text-[#008158]">No</p>
          </span>
          <span className="flex gap-4 items-center justify-between">
            <p>Variations</p>
            <p className="text-[#008158]">No</p>
          </span>
        </div>
      </div>
    </div>
  );
};

export default Alerts;

