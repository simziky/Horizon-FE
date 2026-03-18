import { Metadata } from "next";
import Settings from "@/components/features/settings/Settings";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your account settings",
};

const page = () => {
  return <Settings />;
};

export default page;
