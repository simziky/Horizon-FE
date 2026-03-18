import { Metadata } from "next";
import Dashboard from "@/components/features/dashboard/Dashboard";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Dashboard Home",
};

const page = () => {
  return <Dashboard />;
};

export default page;
