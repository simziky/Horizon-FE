import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const data = [
  { name: "7 Days", value: 15 },
  { name: "30 Days", value: 10 },
  { name: "90 Days", value: 15 },
  { name: "180 Days", value: 11 },
  { name: "365 Days", value: 16 },
  { name: "All Time", value: 14 },
];

const NewOfferCount = () => {
  return (
    <div className="rounded-xl bg-white p-4 lg:p-5">
      <span className="bg-[#F3F4F6] px-3 py-1.5 rounded-3xl text-[#676A75] font-semibold text-sm w-max">
        New Offer Count
      </span>

      <div className="mt-5 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            barSize={30}
            margin={{ top: 20, right: -10, left: -45, bottom: 20 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar
              dataKey="value"
              fill="url(#colorGradient)"
              radius={[10, 10, 0, 0]}
            />
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3895F9" stopOpacity={1} />
                <stop offset="100%" stopColor="#1C72CE" stopOpacity={0.7} />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default NewOfferCount;

