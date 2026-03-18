import Country1 from "@/public/assets/svg/country-1.svg";
import Country2 from "@/public/assets/svg/country-2.svg";
import Country3 from "@/public/assets/svg/country-3.svg";
import Image from "next/image";

const MultiMarketAnalyzer = () => {
  const data = [
    {
      flag: Country1,
      bsr: "#19.8k",
      price: "£16.00",
      profit: "3.94",
      roi: "32.71",
      breakeven: "9.61",
    },
    {
      flag: Country2,
      bsr: "-",
      price: "-",
      profit: "-",
      roi: "-",
      breakeven: "-",
    },
    {
      flag: Country3,
      bsr: "#19.8k",
      price: "£16.00",
      profit: "3.94",
      roi: "32.71",
      breakeven: "9.61",
    },
  ];

  return (
    <div className="rounded-xl bg-white p-4 lg:p-5">
      <span className="bg-[#F3F4F6] px-3 py-1.5 rounded-3xl text-[#676A75] font-semibold text-sm w-max">
        Multi-Market Analyzer
      </span>

      <div className="flex flex-col gap-6 mt-5">
        <div className="flex flex-col gap-4">
          <div className="bg-white drop-shadow-md rounded-3xl px-3 py-2 text-[#7F8BA1] font-semibold text-sm flex gap-4 items-center">
            <span className="rounded-full w-[33px] h-[21px]" />

            <div className="flex flex-1 items-center divide-x divide-[#7F8BA1]">
              <p className="flex-1 text-center pr-3">#BSR</p>
              <p className="flex-1 text-center">Price</p>
              <p className="flex-1 text-center">Profit</p>
              <p className="flex-1 text-center">ROI%</p>
              <p className="flex-1 text-center pl-3">B/E</p>
            </div>
          </div>

          {data.map((row, index) => (
            <div
              key={index}
              className="bg-white drop-shadow-md rounded-3xl px-3 py-2 text-[#596375] font-normal text-sm flex gap-4 items-center"
            >
              <Image
                src={row.flag}
                alt="country flag"
                className="rounded-full w-[33px] h-[21px]"
                quality={90}
                unoptimized
              />
              <div className="flex flex-1 items-center">
                <p className="flex-1 text-center pr-2">{row.bsr}</p>
                <p className="flex-1 text-center">{row.price}</p>
                <p className="flex-1 text-center">{row.profit}</p>
                <p className="flex-1 text-center">{row.roi}</p>
                <p className="flex-1 text-center pl-2">{row.breakeven}</p>
              </div>
            </div>
          ))}
        </div>

        <span className="bg-[#F3F4F6] px-3 py-1.5 rounded-3xl text-[#596375] font-medium text-xs flex items-center gap-2 justify-between">
          <p className="font-normal text-sm">Exchange Rate(s)</p>
          <p>£1 = €1.18 </p>
          <p>£1 = $1.23</p>
          <p>£1 = CA$1.77</p>
        </span>
      </div>
    </div>
  );
};

export default MultiMarketAnalyzer;

