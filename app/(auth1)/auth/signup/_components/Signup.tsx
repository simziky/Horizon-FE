"use client";

import { useState } from "react";
import Image from "next/image";
import { message } from "antd";
import { IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";
import { countries, Country } from "@/lib/countries";
import {
  HiMiniArrowLongRight,
  HiMiniCheckCircle,
  HiOutlinePlayCircle,
} from "react-icons/hi2";
import Link from "next/link";
import { CustomSelect as Select } from "@/lib/AntdComponents";
import { useRouter } from "next/navigation";

const Signup = () => {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [form, setForm] = useState({
    fullname: "",
    email: "",
    password: "",
    confirmPassword: "",
    amazonStatus: "",
    category: "",
    country: "",
  });

  const handleNext = () => {
    if (step === 3 && form.password !== form.confirmPassword) {
      return message.error("Passwords do not match");
    }
    setStep((prev) => prev + 1);
  };

  // const handlePrev = () => setStep((prev) => Math.max(0, prev - 1));

  // const isPreviewStep = step === 4 || step === 7;

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const StepHeader1 = () => (
    <div className="mb-6">
      <h1 className="text-[#2E2E2E] text-xl md:text-2xl">Sign up</h1>
      <p className="text-[#4D4D4D] text-base mt-2">
        Welcome, signup with us at Optisage
      </p>
    </div>
  );

  const steps = [
    <div key="fullname" className="flex flex-col mb-16">
      <StepHeader1 />
      <input
        placeholder="Fullname"
        value={form.fullname}
        onChange={(e) => handleChange("fullname", e.target.value)}
        className="w-full border-2 border-[#EEEEEE] focus:border-primary h-[65px] rounded-lg outline-none p-4"
      />
    </div>,

    <div key="email" className="flex flex-col mb-16">
      <StepHeader1 />
      <input
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={(e) => handleChange("email", e.target.value)}
        className="w-full border-2 border-[#EEEEEE] focus:border-primary h-[65px] rounded-lg outline-none p-4"
      />
    </div>,

    <div key="password" className="flex flex-col mb-16">
      <StepHeader1 />
      <div className="relative mb-4">
        <input
          type={showPassword ? "text" : "password"}
          placeholder="Password"
          value={form.password}
          onChange={(e) => handleChange("password", e.target.value)}
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
      <div className="relative">
        <input
          type={showConfirmPassword ? "text" : "password"}
          className="w-full border-2 border-[#EEEEEE] focus:border-primary h-[65px] rounded-lg outline-none p-4 pr-12"
          placeholder="Confirm Password"
          value={form.confirmPassword}
          onChange={(e) => handleChange("confirmPassword", e.target.value)}
        />
        <button
          type="button"
          onClick={() => setShowConfirmPassword((prev) => !prev)}
          className="absolute inset-y-0 right-4 flex items-center text-neutral-600 hover:text-neutral-800"
          aria-label={showConfirmPassword ? "Hide password" : "Show password"}
        >
          {showConfirmPassword ? (
            <IoEyeOffOutline className="size-6" />
          ) : (
            <IoEyeOutline className="size-6" />
          )}
        </button>
      </div>
    </div>,

    // Step 3 → Preview
    <div key="preview1" className="flex flex-col mb-16">
      <span className="mb-10">
        <h2 className="text-[#2E2E2E] text-xl md:text-2xl">Account Created</h2>
        <p className="text-[#4D4D4D] text-base mt-2">Great 👍</p>
      </span>

      <div className="border border-[#EDEDED] p-5 rounded-[10px] flex items-center gap-4">
        <Image
          src="https://avatar.iran.liara.run/public/38"
          alt="Avatar"
          className="size-14 object-cover rounded-full"
          width={56}
          height={56}
          quality={90}
          priority
          unoptimized
        />

        <span>
          <p className="text-[#121212] font-medium">
            {form.fullname || "Dereck Jackson"}
          </p>
          <span className="bg-[#FFC56E] rounded-full py-1 px-3 text-xs text-[#7E5806] mt-1.5">
            Seller
          </span>
        </span>
      </div>
    </div>,

    // Step 4 → Amazaon status
    <div key="amazon-status" className="flex flex-col mb-8">
      <span className="mb-4 block">
        <h2 className="text-[#2E2E2E] text-xl md:text-2xl">
          Hi, welcome {form.fullname || "Dereck"}
        </h2>
        <p className="text-[#4D4D4D] text-base mt-2">Are you new to Amazon?</p>
      </span>

      <fieldset className="space-y-2">
        <legend className="sr-only">Amazon Seller Status</legend>

        {[
          {
            id: "completely-new",
            label: "New (0-3 Months)",
            value: "completely-new",
          },
          {
            id: "relatively-new",
            label: "Relatively new (4-6 Months)",
            value: "relatively-new",
          },
          {
            id: "fairly-experienced",
            label: "Fairly Experienced (6-12 Months)",
            value: "fairly-experienced",
          },
          {
            id: "experienced",
            label: "Experience(12 Months)",
            value: "experienced",
          },
        ].map((option) => (
          <label
            key={option.id}
            htmlFor={option.id}
            className={`flex items-center justify-between text-[#4D4D4D] rounded-[10px] border border-[#E2E2E2] bg-white p-4 text-sm font-medium transition-colors cursor-pointer
          ${
            form.amazonStatus === option.value
              ? "bg-[#EDEDED] ring-1 ring-[#E2E2E2]"
              : "hover:bg-gray-50"
          }
        `}
          >
            <span>{option.label}</span>

            <input
              type="radio"
              name="amazonStatus"
              id={option.id}
              value={option.value}
              checked={form.amazonStatus === option.value}
              onChange={(e) => handleChange("amazonStatus", e.target.value)}
              className="sr-only"
            />
          </label>
        ))}
      </fieldset>
    </div>,

    // Step 5 → Category Select
    <div key="category" className="flex flex-col mb-16">
      <span className="mb-8 block">
        <h2 className="text-[#2E2E2E] text-xl md:text-2xl">
          Hi, welcome {form.fullname || "Dereck"}
        </h2>
        <p className="text-[#4D4D4D] text-base mt-2">
          Select a category of products you are most interested in selling.
        </p>
      </span>

      <Select
        className="sm:min-w-[280px] !h-[65px]"
        style={{ width: "100%" }}
        placeholder="Select categories"
        onChange={(value: string) => handleChange("category", value)}
        options={[
          {
            value: "beauty_and_personal_care",
            label: "Beauty & Personal care",
          },
          {
            value: "clothing_and_accessories",
            label: "Clothing & Accessories",
          },
          {
            value: "toys_and_pet_care",
            label: "Toys & Pet Care",
          },
        ]}
      />

      <div className="mt-5 flex justify-end">
        <Link
          href=""
          className="text-xs text-[#596375] underline flex items-center gap-1.5"
        >
          <HiOutlinePlayCircle size={20} />
          Don’t know what to pick? Watch a Tutorial.
        </Link>
      </div>
    </div>,

    // Step 6 → Connect + Country
    <div key="connect-country" className="flex flex-col mb-16">
      <span className="mb-8 block">
        <h2 className="text-[#2E2E2E] text-xl md:text-2xl">
          Connect your Amazon Store
        </h2>
        <p className="text-[#4D4D4D] text-base mt-2">One more step to go!</p>
      </span>

      <button className="w-full border border-[#EDEDED] px-5 py-3 rounded-[10px] flex items-center gap-4 hover:bg-gray-50 transition-colors duration-200 mb-4">
        <Image
          src="https://avatar.iran.liara.run/public/38"
          alt="Avatar"
          className="size-14 object-cover rounded-full"
          width={56}
          height={56}
          quality={90}
          priority
          unoptimized
        />

        <span className="flex-1">
          <p className="text-[#121212] font-medium">Connect to Amazon</p>
          <span className="bg-[#FFC56E66] rounded-full py-1 px-3 text-xs text-[#7E5806] mt-1.5">
            Login to Connect Store
          </span>
        </span>

        <HiMiniArrowLongRight className="size-5 text-[#0F172A]" />
      </button>

      <Select
        showSearch
        placeholder="Select a country"
        optionLabelProp="label"
        className="w-full !h-[65px]"
        value={form.country || undefined}
        onChange={(value: string) => handleChange("country", value)}
        options={countries.map((country: Country) => ({
          value: country.code,
          label: (
            <div className="flex items-center gap-2">
              <Image
                src={country.flag}
                alt={country.name}
                width={20}
                height={15}
                className="rounded-sm"
              />
              {country.name}
            </div>
          ),
        }))}
      />

      <span className="text-sm text-center mt-4">
        <Link href="" className="text-[#4D4D4D]">
          Don’t have an Amazon Account?{" "}
          <span className="text-[#3895F9] underline">Signup here</span>
        </Link>
      </span>
    </div>,

    // Step 7 → Final Preview
    <div key="preview2" className="flex flex-col mb-16">
      <span className="mb-10">
        <h2 className="text-[#2E2E2E] text-xl md:text-2xl">Congratulations</h2>
        <p className="text-[#4D4D4D] text-base mt-2">You are all set!</p>
      </span>

      <div className="border border-[#EDEDED] p-5 rounded-[10px] flex items-center gap-4">
        <Image
          src="https://avatar.iran.liara.run/public/38"
          alt="Avatar"
          className="size-14 object-cover rounded-full"
          width={56}
          height={56}
          quality={90}
          priority
          unoptimized
        />

        <span className="flex-1">
          <p className="text-[#121212] font-medium">
            {form.fullname || "Dereck Jackson"}
          </p>
          <span className="bg-[#FFC56E] rounded-full py-1 px-3 text-xs text-[#7E5806] mt-1.5">
            Seller
          </span>
        </span>

        <HiMiniCheckCircle className="size-5 text-[#009F6D]" />
      </div>
    </div>,
  ];

  return (
    <div>
      <div>{steps[step]}</div>

      <div className="flex flex-col gap-4">
        {/* {step > 0 && (
          <button onClick={handlePrev} className="">
            Back
          </button>
        )} */}

        <button
          type="submit"
          onClick={() => {
            if (step === steps.length - 1) {
              router.push(""); // go to dashboard
            } else {
              handleNext();
            }
          }}
          className="w-full border-4 border-[#18CB9659] bg-[#18CB96] hover:bg-[#18CB96]/90 transition-colors duration-200 rounded-lg h-[60px] p-4 text-white"
        >
          {step < 3
            ? "Submit"
            : step === steps.length - 1
            ? "Go to Dashboard"
            : "Continue"}
        </button>
      </div>
    </div>
  );
};

export default Signup;

