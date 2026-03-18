import { Metadata } from "next";
import Subscriptions from "@/components/features/subscriptions/Subscriptions";

export const metadata: Metadata = {
  title: "Subscriptions",
  description: "Subscription Plans",
};

const page = () => {
  return <Subscriptions />;
};

export default page;
