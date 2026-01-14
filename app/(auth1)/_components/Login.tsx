"use client";

import { useState } from "react";
import Link from "next/link";
import { IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div>
      <div className="font-medium">
        <span>
          <h1 className="text-[#2E2E2E] text-xl md:text-2xl">Sign in</h1>
          <p className="text-[#4D4D4D] text-base mt-2">Hi, welcome back. </p>
        </span>

        <form className="text-base text-[#727488] flex flex-col mt-6">
          <div className="flex flex-col gap-4">
            <input
              type="text"
              name="email"
              placeholder="Email"
              className="w-full border-2 border-[#EEEEEE] focus:border-primary h-[65px] rounded-lg outline-none p-4"
              required
            />
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                className="w-full border-2 border-[#EEEEEE] focus:border-primary h-[65px] rounded-lg outline-none p-4 pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-4 flex items-center text-neutral-600 hover:text-neutral-800"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <IoEyeOffOutline className="size-6" />
                ) : (
                  <IoEyeOutline className="size-6" />
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-5 mt-4">
            <span className="flex justify-end">
              <Link href="" className="hover:underline">
                Forgot Password?
              </Link>
            </span>

            <span className="text-center">
              Don’t have an Account?{" "}
              <Link
                href="/auth/signup"
                className="text-[#3895F9] hover:underline"
              >
                Sign up
              </Link>
            </span>

            <button
              type="submit"
              className="w-full border-4 border-[#18CB9659] bg-[#18CB96] hover:bg-[#18CB96]/90 transition-colors duration-200 rounded-lg h-[60px] p-4 text-white"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;

