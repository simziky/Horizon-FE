import Image from "next/image";
import { BiChevronDown } from "react-icons/bi";
import Marketplace1 from "@/public/assets/svg/marketplace-1.svg";
import Marketplace2 from "@/public/assets/svg/marketplace-2.svg";
import Marketplace3 from "@/public/assets/svg/marketplace-3.svg";
import Marketplace4 from "@/public/assets/svg/marketplace-4.svg";
import Marketplace5 from "@/public/assets/svg/marketplace-5.svg";
import Marketplace6 from "@/public/assets/svg/marketplace-6.svg";
import Marketplace7 from "@/public/assets/svg/marketplace-7.svg";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const data = [
  { date: "Jan 1", amazon: 500, salesRank: 100, newFba: 300 },
  { date: "Jan 2", amazon: 2000, salesRank: 200, newFba: 100 },
  { date: "Jan 3", amazon: 800, salesRank: 150, newFba: 200 },
  { date: "Jan 4", amazon: 1500, salesRank: 100, newFba: 400 },
  { date: "Jan 5", amazon: 1200, salesRank: 200, newFba: 100 },
];

const COLORS = {
  amazon: "#FF715B",
  salesRank: "#04E762",
  newFba: "#968EEC",
};

const Keepa = () => {
  return (
    <div className="rounded-xl bg-white p-4 lg:p-5">
      <div className="flex gap-4 items-center justify-between">
        <span className="bg-[#F3F4F6] px-3 py-1.5 rounded-3xl text-[#676A75] font-semibold text-sm w-max">
          Keepa
        </span>

        <div className="relative">
          <select
            aria-label="Filter"
            className="bg-primary flex items-center gap-2.5 rounded-2xl py-2 pl-3 pr-8 text-white font-semibold w-max text-xs appearance-none outline-none"
          >
            <option value="30" className="bg-white text-black rounded-t-md">
              30 days
            </option>
            <option value="90" className="bg-white text-black rounded-t-md">
              90 days
            </option>
            <option value="180" className="bg-white text-black rounded-t-md">
              180 days
            </option>
            <option value="all" className="bg-white text-black rounded-t-md">
              All time
            </option>
          </select>
          <BiChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-white pointer-events-none" />
        </div>
      </div>

      <div className="mt-5">
        <span className="text-[#676A75] text-xs">
          <p>Market Place</p>
          <span className="flex items-center gap-2 mt-1">
            <Image
              src={Marketplace1}
              alt="Marketplace"
              className="w-[27px] h-5"
              quality={90}
              unoptimized
            />
            <Image
              src={Marketplace2}
              alt="Marketplace"
              className="w-[27px] h-5"
              quality={90}
              unoptimized
            />
            <Image
              src={Marketplace3}
              alt="Marketplace"
              className="w-[27px] h-5"
              quality={90}
              unoptimized
            />
            <Image
              src={Marketplace4}
              alt="Marketplace"
              className="w-[27px] h-5"
              quality={90}
              unoptimized
            />
            <Image
              src={Marketplace5}
              alt="Marketplace"
              className="w-[27px] h-5"
              quality={90}
              unoptimized
            />
            <Image
              src={Marketplace6}
              alt="Marketplace"
              className="w-[27px] h-5"
              quality={90}
              unoptimized
            />
            <Image
              src={Marketplace7}
              alt="Marketplace"
              className="w-[27px] h-5"
              quality={90}
              unoptimized
            />
          </span>
        </span>

        <div className="mt-6 flex flex-col gap-8">
          {/* charts */}
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={data}
              margin={{ top: 0, right: 10, left: -52, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" />
              <YAxis tick={false} />

              <Tooltip
                formatter={(value: number) => `$${value.toLocaleString()}`}
                cursor={{ strokeDasharray: "3 3" }}
              />
              <Line
                type="monotone"
                dataKey="amazon"
                stroke={COLORS.amazon}
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="salesRank"
                stroke={COLORS.salesRank}
                strokeWidth={3}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="newFba"
                stroke={COLORS.newFba}
                strokeWidth={3}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="text-[#121212] uppercase font-semibold text-[10px] flex items-center gap-5">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-4 bg-[#FF715B] rounded-md" />
              amazon
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-4 bg-[#04E762] rounded-md" />
              sales rank
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-4 bg-[#968EEC] rounded-md" />
              new fba
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Keepa;

