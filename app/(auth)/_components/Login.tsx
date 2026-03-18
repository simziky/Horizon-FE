"use client";
/* eslint-disable react/no-unescaped-entities */
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Formik, Form, Field, ErrorMessage } from "formik";
import Link from "next/link";
import { IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";
import { useLoginMutation } from "@/redux/api/auth";
import { message } from "antd";
import { useDispatch } from "react-redux";
import { logout } from "@/redux/slice/authSlice";
import Cookies from "js-cookie";
import * as Yup from "yup";

// Combined validation schema for both fields
const loginValidationSchema = Yup.object().shape({
  email: Yup.string()
    .email("Please enter a valid email address")
    .required("Email is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

const Login = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const [showPassword, setShowPassword] = useState(false);
  const [login, { isLoading }] = useLoginMutation();
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    // Clear the token cookie
    Cookies.remove("optisage-token");
    dispatch(logout());
  }, [dispatch]);

const handleSubmit = async (
  values: { email: string; password: string },
  setFieldError: (field: string, message: string) => void
) => {
  try {
    const response = await login(values).unwrap();
    
    // Extract user data and signup_checkpoint from the response
    const user = response?.data?.user;
    const signupCheckpoint = user?.signup_checkpoint;
    
    // Check if user has completed signup process
    if (signupCheckpoint === 7) {
      // User has completed all signup steps, redirect to dashboard
      router.push("/dashboard");
      messageApi.success("Login Successful");
    } else if (signupCheckpoint && signupCheckpoint >= 3 && signupCheckpoint < 7) {
      // User needs to complete signup process from step 3 onwards
      // Pass user data to pre-populate the form
      const signupUrl = new URL('/signUp', window.location.origin);
      signupUrl.searchParams.set('step', signupCheckpoint.toString());
      signupUrl.searchParams.set('email', values.email);
      signupUrl.searchParams.set('fullname', `${user?.first_name || ''} ${user?.last_name || ''}`.trim());
      
      // Pass the token for authentication in subsequent API calls
      if (response?.data?.token) {
        signupUrl.searchParams.set('token', response.data.token);
      }
      
      router.push(signupUrl.toString());
      messageApi.success("Redirecting to complete your profile...");
    } else if (signupCheckpoint && signupCheckpoint < 3) {
      // User needs to complete early signup steps (email/password verification)
      const signupUrl = new URL('/signUp', window.location.origin);
      signupUrl.searchParams.set('step', signupCheckpoint.toString());
      signupUrl.searchParams.set('email', values.email);
      
      router.push(signupUrl.toString());
      messageApi.success("Please complete your account setup...");
    } else {
      // Fallback: redirect to dashboard if checkpoint is null/undefined
      router.push("/dashboard");
      messageApi.success("Login Successful");
    }
  } catch (error) {
    messageApi.error("Login Failed");
    const errorMessage =
      (error as { message?: string; data?: { message?: string } })?.data
        ?.message || "An error occurred";
    setFieldError("password", errorMessage);
  }
};

  return (
    <div>
      {contextHolder}
      <div className="font-medium">
        <span>
          <h1 className="text-[#2E2E2E] text-xl md:text-2xl">Sign in</h1>
          <p className="text-[#4D4D4D] text-base mt-2">Hi, welcome back. </p>
        </span>

        <Formik
          initialValues={{ email: "", password: "" }}
          validationSchema={loginValidationSchema}
          onSubmit={async (values, { setFieldError }) => {
            await handleSubmit(values, setFieldError);
          }}
        >
          {({ isSubmitting }) => (
            <Form className="text-base text-[#727488] flex flex-col mt-6">
              <div className="flex flex-col gap-4">
                <div>
                  <Field
                    type="email"
                    name="email"
                    placeholder="Email"
                    className="w-full border-2 border-[#EEEEEE] focus:border-primary h-[65px] rounded-lg outline-none p-4"
                  />
                  <ErrorMessage
                    name="email"
                    component="p"
                    className="text-red-500 text-sm mt-1"
                  />
                </div>
                
                <div className="relative">
                  <div>
                    <Field
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Password"
                      className="w-full border-2 border-[#EEEEEE] focus:border-primary h-[65px] rounded-lg outline-none p-4 pr-12"
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
                  <ErrorMessage
                    name="password"
                    component="p"
                    className="text-red-500 text-sm mt-1"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-5 mt-4">
                <span className="flex justify-end">
                  <Link href="/forgot-password" className="hover:underline">
                    Forgot Password?
                  </Link>
                </span>

                <span className="text-center">
                  Don't have an Account?{" "}
                  <Link
                    href="/signUp"
                    className="text-[#3895F9] hover:underline"
                    //target="_blank"
                    rel="noopener noreferrer"
                  >
                    Signup
                  </Link>
                </span>

                <button
                  type="submit"
                  className="w-full border-4 border-[#18CB9659] bg-[#18CB96] hover:bg-[#18CB96]/90 transition-colors duration-200 rounded-lg h-[60px] p-4 text-white disabled:opacity-50"
                  disabled={isSubmitting || isLoading}
                >
                  {isLoading ? "Logging In..." : "Submit"}
                </button>
              </div>
            </Form>
          )}
        </Formik>

        <div className="flex justify-center mt-4">
          <Link
            href="https://getnoticed.ca/privacy-policy/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-medium text-sm"
          >
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;