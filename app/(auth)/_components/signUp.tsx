"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";
import { useFormik } from "formik";
import { useSetPasswordMutation,useLoginMutation  } from "@/redux/api/auth";
import { message } from "antd";
import { passwordSchema } from "@/lib/validationSchema";
import * as Yup from "yup";
import Link from "next/link";

const SignUp = () => {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [expires, setExpires] = useState("");
  const [token, setToken] = useState("");

  const [signUp, { isLoading }] = useSetPasswordMutation();
  const [login] = useLoginMutation();
  const [messageApi, contextHolder] = message.useMessage();
  useEffect(() => {
    // Extract the expires value from the URL
    const params = new URLSearchParams(window.location.search);
    const expiresValue = params.get("expires");
    const emailValue = params.get("email");
    const tokenValue = params.get("signature");
    if (expiresValue) {
      setExpires(expiresValue);
    }
    if (tokenValue) setToken(tokenValue);
    if (emailValue) setEmail(emailValue);
  }, []);

  // Extended schema to include terms acceptance
  const validationSchema = Yup.object({
    password: passwordSchema.fields.password,
    confirmPassword: passwordSchema.fields.confirmPassword,
    termsAccepted: Yup.boolean()
      .required("You must accept the terms and privacy policy")
      .oneOf([true], "You must accept the terms and privacy policy"),
  });

  const formik = useFormik({
    initialValues: {
      password: "",
      confirmPassword: "",
      termsAccepted: false,
    },
    validationSchema,
    onSubmit: async (values) => {
      // Terms checkbox is not sent to BE as per requirements
      const payload = {
        email,
        password: values.password,
        password_confirmation: values.confirmPassword,
        expires,
      };

      try {
        await signUp({ data: payload, token }).unwrap();
         // 2. Automatically log in with the same credentials
         const loginResponse = await login({ 
          email, 
          password: values.password 
        }).unwrap();

        // 3. Handle redirection based on user status
        if (loginResponse?.data?.user?.has_connected_amazon_account) {
          router.push("/dashboard");
        } else {
          router.push("/connect-amazon");
        }
        messageApi.success("Registration & Login Successful");
      } catch {
        messageApi.error("Registration Failed");
      }
    },
  });

  return (
    <>
      {contextHolder}

      <div>
        <form className="flex flex-col gap-4" onSubmit={formik.handleSubmit}>
          <div className="flex flex-col gap-1">
            <label
              htmlFor="email"
              className="text-sm text-neutral-700 font-medium"
            >
              Email Address
            </label>
            <input
              type="email"
              name="email"
              id="email"
              placeholder="Ex: marc@example.com"
              className="p-3 bg-[#d7d7d7] border border-transparent focus:border-neutral-700 placeholder:text-[#52525B] text-sm rounded-md outline-none w-full"
              value={email}
              disabled
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="password"
              className="text-sm text-neutral-700 font-medium"
            >
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                id="password"
                placeholder="Enter your password"
                className="p-3 pr-10 bg-[#F4F4F5] border border-transparent focus:border-neutral-700 placeholder:text-[#52525B] text-sm rounded-md outline-none w-full"
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-3 flex items-center text-neutral-600 hover:text-neutral-800"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <IoEyeOffOutline className="size-6" />
                ) : (
                  <IoEyeOutline className="size-6" />
                )}
              </button>
            </div>
            {formik.touched.password && formik.errors.password && (
              <p className="text-red-500 text-xs">{formik.errors.password}</p>
            )}
          </div>
          {/**...CONFIRM PASSWORD....*/}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="confirmPassword"
              className="text-sm text-neutral-700 font-medium"
            >
              Confirm Password
            </label>
            <div className="relative">
              <input
                type="password"
                name="confirmPassword"
                id="confirmPassword"
                placeholder="Confirm your password"
                className="p-3 pr-10 bg-[#F4F4F5] border border-transparent focus:border-neutral-700 placeholder:text-[#52525B] text-sm rounded-md outline-none w-full"
                required
                value={formik.values.confirmPassword}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
            </div>
            {formik.touched.confirmPassword &&
              formik.errors.confirmPassword && (
                <p className="text-red-500 text-xs">
                  {formik.errors.confirmPassword}
                </p>
              )}
          </div>

          {/* Terms and Privacy Policy Checkbox */}
          <div className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              id="termsAccepted"
              name="termsAccepted"
              // defaultChecked
              className="checkbox checkbox-accent"
              checked={formik.values.termsAccepted}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />

            <label htmlFor="termsAccepted" className="text-sm text-neutral-700">
              I agree to the{" "}
              <Link
                href="https://getnoticed.ca/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Terms of Use
              </Link>{" "}
              and{" "}
              <Link
                href="https://getnoticed.ca/privacy-policy/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Privacy Policy
              </Link>
            </label>
          </div>
          {formik.touched.termsAccepted && formik.errors.termsAccepted && (
            <p className="text-red-500 text-xs mt-1">
              {formik.errors.termsAccepted}
            </p>
          )}

          <button
            type="submit"
            className="rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold p-2 active:scale-95 duration-200 mt-2"
            disabled={isLoading}
          >
            {isLoading ? "Signing up..." : "Sign Up"}
          </button>
        </form>
      </div>
    </>
  );
};

export default SignUp;

