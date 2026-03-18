import { Metadata } from "next";
import MonitorSellersList from "@/components/features/monitor-list/Monitor";


export const metadata: Metadata = {
  title: "Monitor List",
  description:
    "View stores you are monitoring",
};

const page = () => {
  return <MonitorSellersList />;
};

export default page;
