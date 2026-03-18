import { Metadata } from "next";
import Referral from "@/components/features/referral/Referral";

export const metadata: Metadata = {
  title: "Refer and Earn",
  description:
    "Invite your friends to join optisage. Earn rewards when they sign up and upgrade their subscription.",
};

const page = () => {
  return <Referral />;
};

export default page;
