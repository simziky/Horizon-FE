import { Metadata } from "next";
import TotanChat from "@/components/features/totan/Totan";

export const metadata: Metadata = {
  title: "Totan AI",
  description: "Chat with Totan",
};

const page = () => {
  return <TotanChat />;
};

export default page;

