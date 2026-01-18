import Login from "../_components/Login";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login",
  description: "Login to continue to your account",
};

const AuthPage = () => {
  return <Login />;
};

export default AuthPage;

