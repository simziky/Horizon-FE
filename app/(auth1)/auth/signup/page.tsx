import Signup from "./_components/Signup";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Signup",
  description: "Create an account to join optisage",
};

const SignupPage = () => {
  return <Signup />;
};

export default SignupPage;

