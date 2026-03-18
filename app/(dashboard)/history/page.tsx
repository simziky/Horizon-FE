import { Metadata } from "next";
import History from "@/components/features/history/History";

export const metadata: Metadata = {
  title: "History",
  description: "Search History",
};

const page = () => {
  return <History />;
};

export default page;
