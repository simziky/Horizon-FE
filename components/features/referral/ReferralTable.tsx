"use client";
/* eslint-disable  @typescript-eslint/no-unused-vars */
import { useState } from "react";
import { message, Table } from "antd";
import { useAppSelector } from "@/redux/hooks";
import { RiAttachment2 } from "react-icons/ri";

interface Referral {
  id: number;
  referral_name: string;
  store_name: string;
  store_image: string | null;
  email: string;
  joined_date: string;
  status: string;
}

// Function to extract initials from Store Name
const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase();
};

// Custom Status Tag Component
const StatusTag = ({ status }: { status: "Pending" | "Active" }) => (
  <span
    className={`px-2.5 py-1 text-xs rounded-full ${
      status === "Active"
        ? "bg-green-50 text-green-500"
        : "bg-red-50 text-red-500"
    }`}
  >
    {status}
  </span>
);

const columns = [
  {
    title: "Referrals Name",
    dataIndex: "referral_name",
    key: "referral_name",
  },
  {
    title: "Store Name",
    dataIndex: "store_name",
    key: "store_name",
    render: (storeName: string) => (
      <div className="flex items-center gap-2">
        <span className="size-8 flex items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-700">
          {getInitials(storeName)}
        </span>
        <span>{storeName}</span>
      </div>
    ),
  },
  {
    title: "Email Address",
    dataIndex: "email",
    key: "email",
  },
  {
    title: "Joined Date",
    dataIndex: "joined_date",
    key: "joined_date",
  },
  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    render: (status: string) => (
      <StatusTag
        status={status.toLowerCase() === "active" ? "Active" : "Pending"}
      />
    ),
  },
];

const ReferralTable = ({
  tableData,
  tableLoading,
}: {
  tableData: Referral[];
  tableLoading: boolean;
}) => {
  const [activeTab, setActiveTab] = useState<"all" | "active">("all");
  const { username } = useAppSelector((state) => state.api?.user) || {};
  const [messageApi, contextHolder] = message.useMessage();

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      messageApi.success("Link copied to clipboard");
     
    } catch (err) {
      messageApi.error("Failed to copy to clipboard");
      
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {contextHolder}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        {/* Tabs */}
        <div className="bg-[#F7F7F7] rounded-[10px] p-1 flex items-center gap-2 w-max">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`text-sm font-medium py-1.5 px-8 lg:px-12 rounded-md border ${
              activeTab === "all"
                ? "border-border bg-white"
                : "border-transparent text-[#787891]"
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("active")}
            className={`text-sm font-medium py-1.5 px-8 lg:px-12 rounded-md border ${
              activeTab === "active"
                ? "border-border bg-white"
                : "border-transparent text-[#787891]"
            }`}
          >
            Active
          </button>
        </div>

        <div className="rounded-xl px-4 py-2 border border-border">
          <p className="text-[#4B4B62] text-sm font-bold  flex items-center gap-2">
            Your referral link:{" "}
            <span className="font-normal">
              https://optisage.ai/#pricing/?ref={username}
            </span>
            <div
              onClick={() =>
                copyToClipboard(`https://optisage.ai/#pricing/?ref=${username}`)
              }
              className=" cursor-pointer"
            >
              <RiAttachment2 className="size-5" />
            </div>
          </p>
        </div>
      </div>

      {/* Tab Content */}
      <div className="overflow-x-scroll">
        <Table
          loading={tableLoading}
          columns={columns}
          dataSource={
            activeTab === "all"
              ? tableData
              : tableData.filter((item) => item.status === "active")
          }
          rowSelection={{ type: "checkbox" }}
          pagination={false}
          rowKey="id"
        />
      </div>
    </div>
  );
};

export default ReferralTable;
