import { Metadata } from "next";
import UpcScanner from "@/components/features/upc-scanner/UpcScanner";

export const metadata: Metadata = {
  title: "UPC Scanner",
  description: "UPC Scanner",
};

const page = () => {
  return <UpcScanner />;
};

export default page;

