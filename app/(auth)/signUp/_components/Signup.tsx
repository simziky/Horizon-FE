"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/no-unescaped-entities */
import { useState, useEffect } from "react";
import Image from "next/image";
import { message } from "antd";
import { IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";
import { MdCancel } from "react-icons/md";
import {
  HiMiniArrowLongRight,
  HiMiniCheckCircle,
  HiOutlinePlayCircle,
} from "react-icons/hi2";
import Link from "next/link";
import { CustomSelect as Select } from "@/lib/AntdComponents";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStep } from "@/context/authContext";
import { useLazyCreateStripeSubscriptionV2Query } from "@/redux/api/subscriptionApi";
import {
  useSetPasswordMutation,
  useLazyGetProductCategoriesQuery,
  useLazyGetExperinceLevelQuery,
  useLazyGetCountriesQuery,
  useUpdateUserMutation,
  useSignupMutation,
  useCheckEmailMutation,
} from "@/redux/api/auth";
import { useFormik } from "formik";
import { email, passwordSchema } from "@/lib/validationSchema"; // Adjust path as needed

// Session storage keys
const SESSION_KEYS = {
  FORM_DATA: "optisage_signup_form",
  USER_DATA: "optisage_user_data",
  VERIFICATION_TOKEN: "optisage_verification_token",
  SELECTED_PLAN: "optisage_selected_plan",
  REF_CODE: "optisage_ref_code",
} as const;

export const amazonAuthUrl = `https://sellercentral.amazon.com/apps/authorize/consent?${new URLSearchParams(
    {
      application_id: process.env.NEXT_PUBLIC_AMAZON_CLIENT_ID!,
      state: "ourauth",
      version: "beta",
      response_type: "code",
      scope: "sellingpartnerapi::authorization",
      redirect_uri: process.env.NEXT_PUBLIC_AMAZON_REDIRECT_URI!,
    }
  ).toString()}`;

const Signup = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentStep, nextStep, setCurrentStep } = useAuthStep();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [dataFetched, setDataFetched] = useState(false);
  const [isDashboardNavigating, setIsDashboardNavigating] = useState(false);
  const [needsPackageSelection, setNeedsPackageSelection] = useState(false);
    const [showEmailExistsModal, setShowEmailExistsModal] = useState(false);

  // Subscription related states
  const [refCode, setRefCode] = useState<string>("");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [verificationToken, setVerificationToken] = useState<string>("");
  const [_isAmazonConnected, setIsAmazonConnected] = useState<boolean>(false);
  const [_amazonError, setAmazonError] = useState<boolean>(false);
  
  // FIX: Added local state for checkout loading to ensure it resets correctly
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
const [subscribe, { isLoading }] = useSignupMutation();
  //const [subscribe, { isLoading }] = useLazyCreateStripeSubscriptionV2Query();
  const [setPassword, { isLoading: isSettingPassword }] =
    useSetPasswordMutation();
  const [messageApi, contextHolder] = message.useMessage();

  // User data from API response
  const [userData, setUserData] = useState<{
    first_name: string;
    last_name: string;
    email: string;
    subscription_type?: string;
  } | null>(null);

  // API queries for dynamic data
  const [getProductCategories, { data: categoriesData }] =
    useLazyGetProductCategoriesQuery();
  const [getExperienceLevel, { data: experienceLevelsData }] =
    useLazyGetExperinceLevelQuery();
  const [getCountries, { data: countriesData }] = useLazyGetCountriesQuery();
  const [updateUser, { isLoading: isUpdatingUser }] = useUpdateUserMutation();
const [checkEmail, { isLoading: isCheckingEmail }] = useCheckEmailMutation();

// Add a new state for email error
const [emailError, setEmailError] = useState<string>("");
  const [form, setForm] = useState({
    fullname: "",
    email: "",
    password: "",
    confirmPassword: "",
    amazonStatus: "",
    categories: [] as string[], // Changed from category to categories array
    country: "",
  });

  // Formik for email validation (Step 1)
  const emailFormik = useFormik({
    initialValues: {
      email: form.email,
    },
    validationSchema: email,
    onSubmit: () => {
      // Handle email submission
      handleNext();
    },
    enableReinitialize: true,
  });

  // Formik for password validation (Step 2)
  const passwordFormik = useFormik({
    initialValues: {
      password: form.password,
      confirmPassword: form.confirmPassword,
    },
    validationSchema: passwordSchema,
    onSubmit: () => {
      // Handle password submission
      handleNext();
    },
    enableReinitialize: true,
  });

  // Sync formik values with main form state
  useEffect(() => {
    emailFormik.setFieldValue('email', form.email);
  }, [form.email]);

  useEffect(() => {
    passwordFormik.setFieldValue('password', form.password);
    passwordFormik.setFieldValue('confirmPassword', form.confirmPassword);
  }, [form.password, form.confirmPassword]);

  

  // Helper functions for session storage
  const saveToSessionStorage = (key: string, value: any) => {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`Failed to save ${key} to sessionStorage:`, error);
    }
  };

  const loadFromSessionStorage = (key: string, defaultValue: any = null) => {
    try {
      const stored = sessionStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch (error) {
      console.warn(`Failed to load ${key} from sessionStorage:`, error);
      return defaultValue;
    }
  };

  const clearSessionStorage = () => {
    try {
      Object.values(SESSION_KEYS).forEach(key => {
        sessionStorage.removeItem(key);
      });
    } catch (error) {
      console.warn("Failed to clear sessionStorage:", error);
    }
  };

  // Navigation functions for email exists modal
  const handleGoToLogin = () => {
    setShowEmailExistsModal(false);
    // Navigate to login page - adjust the route as needed
    router.push('/');
  };

  const handleResetPassword = () => {
    setShowEmailExistsModal(false);
    // Navigate to reset password page - adjust the route as needed
    router.push('/forgot-password');
  };
  // Load data from session storage on component mount
  useEffect(() => {
    // Load form data from session storage first
    const savedForm = loadFromSessionStorage(SESSION_KEYS.FORM_DATA, {});
    if (Object.keys(savedForm).length > 0) {
      console.log('Loading saved form data:', savedForm);
      setForm(prev => ({ 
        ...prev, 
        ...savedForm,
        // Ensure categories is always an array
        categories: Array.isArray(savedForm.categories) ? savedForm.categories : []
      }));
    }

    // Load other persisted data
    const savedUserData = loadFromSessionStorage(SESSION_KEYS.USER_DATA);
    if (savedUserData) {
      setUserData(savedUserData);
    }

    const savedToken = loadFromSessionStorage(SESSION_KEYS.VERIFICATION_TOKEN);
    if (savedToken) {
      setVerificationToken(savedToken);
    }

    const savedPlan = loadFromSessionStorage(SESSION_KEYS.SELECTED_PLAN);
    if (savedPlan) {
      setSelectedPlan(savedPlan);
    }

    const savedRefCode = loadFromSessionStorage(SESSION_KEYS.REF_CODE);
    if (savedRefCode) {
      setRefCode(savedRefCode);
    }
  }, []);

  // Save form data to session storage whenever it changes (but debounce to avoid excessive saves)
  useEffect(() => {
    // Only save if form has meaningful data to prevent overwriting with empty initial state
    if (form.fullname || form.email || form.amazonStatus || form.categories.length > 0 || form.country) {
      console.log('Saving form data to session storage:', form);
      saveToSessionStorage(SESSION_KEYS.FORM_DATA, form);
    }
  }, [form]);

  // Save other important data to session storage
  useEffect(() => {
    if (userData) {
      saveToSessionStorage(SESSION_KEYS.USER_DATA, userData);
    }
  }, [userData]);

  useEffect(() => {
    if (verificationToken) {
      saveToSessionStorage(SESSION_KEYS.VERIFICATION_TOKEN, verificationToken);
    }
  }, [verificationToken]);

  useEffect(() => {
    if (selectedPlan) {
      saveToSessionStorage(SESSION_KEYS.SELECTED_PLAN, selectedPlan);
    }
  }, [selectedPlan]);

  useEffect(() => {
    if (refCode) {
      saveToSessionStorage(SESSION_KEYS.REF_CODE, refCode);
    }
  }, [refCode]);

  // Extract referral code and pricing from URL params
  useEffect(() => {
    const ref = searchParams.get("ref");
    const pricing = searchParams.get("pricing");
    const urlEmail = searchParams.get("email");
    const urlFullname = searchParams.get("fullname");
    const urlStep = searchParams.get("step");
    const token = searchParams.get("token");
    const amazonConnected = searchParams.get("amazon_connected");
    const amazonErrorParam = searchParams.get("amazon_error");

    // Check if pricing ID is empty or not provided
  if (!pricing || pricing.trim() === "") {
    setNeedsPackageSelection(true);
  } else {
    setNeedsPackageSelection(false);
    setSelectedPlan(pricing);
  }

    // Only override form data with URL params if they are explicitly provided
    // This prevents clearing saved data when redirected from callback
    if (ref || pricing) {
      setRefCode(ref || "");
      setSelectedPlan(pricing);
    }

    // Only pre-fill form data from URL params if they exist (from checkout success)
    // Don't override existing form data if URL params are empty
    if (urlEmail || urlFullname) {
      setForm((prev) => ({
        ...prev,
        ...(urlEmail && { email: urlEmail }),
        ...(urlFullname && { fullname: urlFullname }),
      }));
    }

    // Set verification token
    if (token) {
      setVerificationToken(token);
    }

    // Handle Amazon connection status
    if (amazonConnected === "true") {
      setIsAmazonConnected(true);
      success("Amazon store connected successfully!");

      // Clean up URL parameters
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("amazon_connected");
      window.history.replaceState({}, "", newUrl.toString());
    }

    if (amazonConnected === "false") {
      setAmazonError(false); // Reset error state
      // User chose to use another account, don't show error message
      
      // Clean up URL parameters
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("amazon_connected");
      window.history.replaceState({}, "", newUrl.toString());
    }

    if (amazonErrorParam === "true") {
      setAmazonError(true);
      error(
        "Failed to connect Amazon store. You can continue without connecting or try again later."
      );

      // Clean up URL parameters
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("amazon_error");
      window.history.replaceState({}, "", newUrl.toString());
    }

    // Set the step if specified in URL - this will now sync with AuthSteps
    if (urlStep) {
      const stepNumber = parseInt(urlStep, 10);
      if (stepNumber >= 0 && stepNumber <= 7) {
        setCurrentStep(stepNumber);
      }
    }

    // Fetch data if we're starting at step 3 or later
    const startingStep = urlStep ? parseInt(urlStep, 10) : currentStep;
    if (startingStep >= 3 && !dataFetched) {
      fetchRequiredData();
    }
  }, [searchParams, setCurrentStep]);

  // Function to fetch required data with bearer token
  const fetchRequiredData = () => {
    getProductCategories({});
    getExperienceLevel({});
    getCountries({});
    setDataFetched(true);
  };

  // Effect to fetch data when reaching step 3 (Account Created)
  useEffect(() => {
    if (currentStep >= 3 && !dataFetched) {
      fetchRequiredData();
    }
  }, [currentStep, dataFetched]);

  const error = (err: string) => {
    messageApi.open({
      type: "error",
      content: err,
      icon: <MdCancel color="red" size={20} className=" mr-2" />,
      className: "",
      style: {
        marginTop: "5vh",
        fontSize: 16,
      },
    });
  };

  const success = (msg: string) => {
    messageApi.open({
      type: "success",
      content: msg,
      style: {
        marginTop: "5vh",
        fontSize: 16,
      },
    });
  };

  const confirmSubscription = () => {
    if (!selectedPlan) {
      console.error("No plan selected");
      error("No pricing plan found. Please try again.");
      return;
    }

    if (!form.email || !form.fullname) {
      error("Please provide both name and email");
      return;
    }

    // FIX: Manually set loading state to true
    setIsCheckoutLoading(true);

    const payload: {
      pricing_id: string;
      email: string;
      name: string;
      referral_code?: string;
    } = {
      pricing_id: selectedPlan,
      email: form.email,
      name: form.fullname,
    };

    if (refCode) {
      payload.referral_code = refCode;
    }

    subscribe(payload)
      .unwrap()
      .then((res) => {
        if (res?.data?.url) {
          if (window.top) {
            window.top.location.href = res?.data?.url;
          } else {
            window.open(res?.data?.url, "_blank");
          }
        } else {
          console.error("No checkout URL returned");
          error("Failed to create checkout session. Please try again.");
          // FIX: Manually set loading state to false on failure
          setIsCheckoutLoading(false);
        }
      }).catch ((err: any)=> {
      console.error("Checkout error:", err);
      
      // Check if it's the email already exists error
      if (err?.data?.responseCode === "91" || 
          (err?.data?.status === 422 && err?.data?.message?.includes("already registered"))) {
        setShowEmailExistsModal(true);
      } else {
        error(err?.data?.message || "An error occurred during checkout");
      }
    })
     
  };

  const handleUpdateUser = async () => {
  // Only require categories, amazonStatus, and country - Amazon connection is optional
  if (!form.categories.length || !form.amazonStatus || !form.country) {
    error("Please complete all required fields");
    return;
  }

  try {
    // Check if "all" is selected in the categories array
    const hasAllSelected = form.categories.includes("all");

    const payload = {
      category_ids: hasAllSelected 
        ? ["all"] 
        : form.categories.map(cat => parseInt(cat)), // Convert string array to number array
      experience_level_id: parseInt(form.amazonStatus),
      country_id: parseInt(form.country),
    };

    await updateUser(payload).unwrap();

    success("Profile updated successfully!");

    // Update both context and URL
    setCurrentStep(7);

    // Update the URL to reflect the new step
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set("step", "7");
    window.history.replaceState({}, "", newUrl.toString());
  } catch (err: any) {
    console.error("Update user error:", err);
    error(
      err?.data?.message || "Failed to update profile. Please try again."
    );
  }
};

  const handleSetPassword = async () => {
    if (!form.email || !form.password || !verificationToken) {
      error("Missing required information. Please try again.");
      return;
    }

    try {
      const payload = {
        email: form.email,
        password: form.password,
        password_confirmation: form.confirmPassword,
      };

      const response = await setPassword({
        data: payload,
        token: verificationToken,
      }).unwrap();

      // Extract user data from the response
      if (response?.data?.user) {
        setUserData({
          first_name: response.data.user.first_name,
          last_name: response.data.user.last_name,
          email: response.data.user.email,
          subscription_type: response.data.user.subscription_type,
        });
      }

      success("Password set successfully!");

      // Update both the context step and the URL to prevent flickering
      setCurrentStep(3);

      // Update the URL to reflect the new step
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set("step", "3");
      // Remove the token from URL since it's no longer needed
      newUrl.searchParams.delete("token");
      window.history.replaceState({}, "", newUrl.toString());

      // Fetch required data now that we have the bearer token
      if (!dataFetched) {
        fetchRequiredData();
      }
    } catch (err: any) {
      console.error("Set password error:", err);
      error(err?.data?.message || "Failed to set password. Please try again.");
    }
  };

  const handleDashboardNavigation = async () => {
    setIsDashboardNavigating(true);
    try {
      // Clear session storage when successfully navigating to dashboard
      clearSessionStorage();
      
      // Add any final API calls or cleanup here if needed
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate loading
      router.push("/dashboard");
    } catch (err) {
      console.error("Dashboard navigation error:", err);
      error("Failed to navigate to dashboard. Please try again.");
      setIsDashboardNavigating(false);
    }
  };

 const handleNext = async () => {
  // Validation for email step (Step 1)
  if (currentStep === 1) {
    const isValid = await emailFormik.validateForm();
    if (Object.keys(isValid).length > 0) {
      emailFormik.setTouched({ email: true });
      return;
    }

    // ✅ Add email checking
    try {
      setEmailError(""); // Clear previous errors
      await checkEmail({ email: form.email }).unwrap();
      
      // Email is available, continue with existing flow
      if (needsPackageSelection) {
        // Navigate to package selection page
        router.push('/pricing'); // Adjust route as needed
        return;
      }
      
      if (selectedPlan && form.email && form.fullname) {
        confirmSubscription();
        return;
      }
      
    } catch (err: any) {
      console.error("Email check error:", err);
      
      // ✅ Show modal for email exists error
      if (err?.data?.responseCode === "91" || err?.status === 422) {
        setShowEmailExistsModal(true);
        return; // Don't proceed
      } else {
        // For other errors, show inline error message
        setEmailError("Failed to verify email. Please try again.");
        return;
      }
    }
  }

  // Validation for password step (Step 2)
  if (currentStep === 2) {
    if (verificationToken) {
      const isValid = await passwordFormik.validateForm();
      if (Object.keys(isValid).length > 0) {
        passwordFormik.setTouched({ password: true, confirmPassword: true });
        return;
      }
      handleSetPassword();
      return;
    } else {
      // Basic validation when no verification token
      const isValid = await passwordFormik.validateForm();
      if (Object.keys(isValid).length > 0) {
        passwordFormik.setTouched({ password: true, confirmPassword: true });
        return;
      }
    }
  }

  // If we're on the country step (step 6), call updateUser
  if (currentStep === 6) {
    handleUpdateUser();
    return;
  }

  // Basic validation for required fields per step
  if (currentStep === 0 && !form.fullname.trim()) {
    error("Please enter your full name");
    return;
  }

  // If this is the final step, go to dashboard with loading state
  if (currentStep === steps.length - 1) {
    handleDashboardNavigation();
    return;
  }

  // Normal flow progression using context
  nextStep();

  // Update URL to match the new step
  const newStepValue = currentStep + 1;
  const newUrl = new URL(window.location.href);
  newUrl.searchParams.set("step", newStepValue.toString());
  window.history.replaceState({}, "", newUrl.toString());

  // Fetch data when reaching step 3 if not already fetched
  if (newStepValue >= 3 && !dataFetched) {
    fetchRequiredData();
  }
};

  const handleChange = (key: keyof typeof form, value: string | string[]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // Helper function to get the full name
  const getFullName = () => {
    if (userData) {
      return `${userData.first_name} ${userData.last_name}`.trim();
    }
    return form.fullname || "Dereck Jackson";
  };

  // Helper function to get first name only
  const getFirstName = () => {
    if (userData) {
      return userData.first_name;
    }
    return form.fullname.split(" ")[0] || "Dereck";
  };

  const StepHeader1 = () => (
  <div className="mb-6">
    <h1 className="text-[#2E2E2E] text-xl md:text-2xl">Sign up</h1>
    <p className="text-[#4D4D4D] text-base mt-2">
      {needsPackageSelection && currentStep === 1 
        ? "Next, you'll choose a package that fits your needs"
        : "Welcome, signup with us at Optisage"
      }
    </p>
  </div>
);

  const StepHeader2 = () => (
    <div className="mb-6">
      <h1 className="text-[#2E2E2E] text-xl md:text-2xl">Set Your Password</h1>
      <p className="text-[#4D4D4D] text-base mt-2">
        {getFullName() !== "Dereck Jackson" ? `Welcome ${getFullName()}! ` : ""}
        Create a secure password for your account
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
  <div className="flex flex-col">
    <input
      type="email"
      placeholder="Email"
      value={form.email}
      onChange={(e) => {
        handleChange("email", e.target.value);
        emailFormik.setFieldValue('email', e.target.value);
        setEmailError(""); // ✅ Clear error on type
      }}
      onBlur={emailFormik.handleBlur}
      name="email"
      className={`w-full border-2 ${
        (emailFormik.touched.email && emailFormik.errors.email) || emailError
          ? 'border-red-500'
          : 'border-[#EEEEEE]'
      } focus:border-primary h-[65px] rounded-lg outline-none p-4`}
    />
    
    {/* Formik validation error */}
    {emailFormik.touched.email && emailFormik.errors.email && (
      <span className="text-red-500 text-sm mt-2">
        {emailFormik.errors.email}
      </span>
    )}
    
    {/* ✅ API email error with action links */}
    {emailError && (
      <div className="mt-2">
        <span className="text-red-500 text-sm">{emailError}</span>
        <div className="flex gap-2 mt-2">
          <button
            onClick={handleGoToLogin}
            className="text-xs text-[#3895F9] underline hover:text-[#2a7dd4]"
          >
            Go to Login
          </button>
          <span className="text-xs text-gray-400">or</span>
          <button
            onClick={handleResetPassword}
            className="text-xs text-[#3895F9] underline hover:text-[#2a7dd4]"
          >
            Reset Password
          </button>
        </div>
      </div>
    )}
  </div>
</div>,

    // FIX: Restructured the password fields to correctly display validation messages
    <div key="password" className="flex flex-col mb-16">
      {verificationToken ? <StepHeader2 /> : <StepHeader1 />}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col">
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={form.password}
              onChange={(e) => {
                handleChange("password", e.target.value);
                passwordFormik.setFieldValue('password', e.target.value);
              }}
              onBlur={passwordFormik.handleBlur}
              name="password"
              className={`w-full border-2 ${
                passwordFormik.touched.password && passwordFormik.errors.password
                  ? 'border-red-500'
                  : 'border-[#EEEEEE]'
              } focus:border-primary h-[65px] rounded-lg outline-none p-4 pr-12`}
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
          {passwordFormik.touched.password && passwordFormik.errors.password && (
            <span className="text-red-500 text-sm mt-1">{passwordFormik.errors.password}</span>
          )}
        </div>
        
        <div className="flex flex-col">
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              className={`w-full border-2 ${
                passwordFormik.touched.confirmPassword && passwordFormik.errors.confirmPassword
                  ? 'border-red-500'
                  : 'border-[#EEEEEE]'
              } focus:border-primary h-[65px] rounded-lg outline-none p-4 pr-12`}
              placeholder="Confirm Password"
              value={form.confirmPassword}
              onChange={(e) => {
                handleChange("confirmPassword", e.target.value);
                passwordFormik.setFieldValue('confirmPassword', e.target.value);
              }}
              onBlur={passwordFormik.handleBlur}
              name="confirmPassword"
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
          {passwordFormik.touched.confirmPassword && passwordFormik.errors.confirmPassword && (
            <span className="text-red-500 text-sm mt-1">{passwordFormik.errors.confirmPassword}</span>
          )}
        </div>
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
          <p className="text-[#121212] font-medium">{getFullName()}</p>
          <span className="bg-[#FFC56E] rounded-full py-1 px-3 text-xs text-[#7E5806] mt-1.5">
            {userData?.subscription_type || "Seller"}
          </span>
        </span>
      </div>
    </div>,

    // Step 4 → Amazon status
    <div key="amazon-status" className="flex flex-col mb-8">
      <span className="mb-4 block">
        <h2 className="text-[#2E2E2E] text-xl md:text-2xl">
          Hi, welcome {getFirstName()}
        </h2>
        <p className="text-[#4D4D4D] text-base mt-2">Are you new to Amazon?</p>
      </span>

      <fieldset className="space-y-2">
        <legend className="sr-only">Amazon Seller Status</legend>

        {experienceLevelsData?.data?.map((level: any) => (
          <label
            key={level.id}
            htmlFor={`level-${level.id}`}
            className={`flex items-center justify-between text-[#4D4D4D] rounded-[10px] border border-[#E2E2E2] bg-white p-4 text-sm font-medium transition-colors cursor-pointer
        ${
          form.amazonStatus === level.id.toString()
            ? "bg-[#EDEDED] ring-1 ring-[#E2E2E2]"
            : "hover:bg-gray-50"
        }
      `}
          >
            <span>
              {level.name} ({level.description})
            </span>

            <input
              type="radio"
              name="amazonStatus"
              id={`level-${level.id}`}
              value={level.id.toString()}
              checked={form.amazonStatus === level.id.toString()}
              onChange={(e) => handleChange("amazonStatus", e.target.value)}
              className="opacity-0 absolute h-0 w-0"
            />

            <div
              className={`flex items-center justify-center w-5 h-5 border-2 rounded-full 
        ${
          form.amazonStatus === level.id.toString()
            ? "border-[#18CB96] bg-[#18CB96]"
            : "border-gray-300"
        }`}
            >
              {form.amazonStatus === level.id.toString() && (
                <div className="w-2 h-2 bg-white rounded-full"></div>
              )}
            </div>
          </label>
        )) || (
          <div className="text-center py-4 text-gray-500">
            Loading experience levels...
          </div>
        )}
      </fieldset>
    </div>,

    // Step 5 → Category Select (Updated for multiple selection)
    <div key="category" className="flex flex-col mb-16">
  <span className="mb-8 block">
    <h2 className="text-[#2E2E2E] text-xl md:text-2xl">
      Hi, welcome {getFirstName()}
    </h2>
    <p className="text-[#4D4D4D] text-base mt-2">
      Select categories of products you are most interested in selling.
    </p>
  </span>

  <Select
    mode="multiple"
    className="sm:min-w-[280px]"
    style={{ width: "100%" }}
    placeholder="Select categories"
    value={form.categories.length > 0 ? form.categories : undefined}
    onChange={(value: string[]) => {
      // If "all" is selected, clear other selections and only keep "all"
      if (value.includes("all") && !form.categories.includes("all")) {
        handleChange("categories", ["all"]);
      } 
      // If other categories are selected after "all" was selected, remove "all"
      else if (value.length > 1 && value.includes("all")) {
        handleChange("categories", value.filter(v => v !== "all"));
      }
      // Normal selection
      else {
        handleChange("categories", value);
      }
    }}
    options={
      categoriesData?.data?.map((category: any) => ({
        value: category.id.toString(),
        label: category.category_name,
      })) || []
    }
    loading={!categoriesData}
    maxTagCount="responsive"
    showSearch
    filterOption={(input: string, option?: { label: string; value: string }) =>
      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
    }
  />
</div>,

    // Step 6 → Connect + Country
    <div key="connect-country" className="flex flex-col mb-16">
      <span className="mb-8 block">
        <h2 className="text-[#2E2E2E] text-xl md:text-2xl">
          Connect your Amazon Store
        </h2>
        <p className="text-[#4D4D4D] text-base mt-2">One more step to go!</p>
      </span>

      <Link href={amazonAuthUrl} target="_blank">
        <button className="w-full relative border border-[#EDEDED] px-5 py-3 rounded-[10px] flex items-center gap-4 hover:bg-gray-50 transition-colors duration-200 mb-4">
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

          <span className=" text-primary text-[10px] p-[2px] bg-primary/10 rounded-lg border border-primary absolute top-2 right-3">Optional</span>
        </button>
      </Link>
      <Select
        showSearch
        placeholder="Select a country"
        optionLabelProp="label"
        className="w-full !h-[65px]"
        value={form.country || undefined}
        onChange={(value: string) => handleChange("country", value)}
        loading={!countriesData}
        options={
          countriesData?.data?.map((country: any) => ({
            value: country.id.toString(),
            label: (
              <div className="flex items-center gap-2">
                <Image
                  src={country.flag_url}
                  alt={country.name}
                  width={20}
                  height={15}
                  className="rounded-sm"
                />
                {country.name}
              </div>
            ),
          })) || []
        }
      />

      <span className="text-sm text-center mt-4">
        <Link
          href="https://sellercentral.amazon.com/"
          target="_blank"
          className="text-[#4D4D4D]"
        >
          Don't have an Amazon Account?{" "}
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
          <p className="text-[#121212] font-medium">{getFullName()}</p>
          <span className="bg-[#FFC56E] rounded-full py-1 px-3 text-xs text-[#7E5806] mt-1.5">
            {userData?.subscription_type || "Seller"}
          </span>
        </span>

        <HiMiniCheckCircle className="size-5 text-[#009F6D]" />
      </div>
    </div>,
  ];

  const getButtonText = () => {
  if (currentStep === 1) {
    if (needsPackageSelection) {
      return "Choose Package";
    }
    if (selectedPlan) {
      return "Proceed to Checkout";
    }
  }
  if (currentStep === 2 && verificationToken) {
    return "Set Password";
  }
  if (currentStep === 6) {
    return "Complete Profile";
  }
  if (currentStep < 3) {
    return "Submit";
  }
  if (currentStep === steps.length - 1) {
    return "Go to Dashboard";
  }
  return "Continue";
};

  const isButtonLoading = () => {
    // FIX: Use local state for checkout loading
    if (currentStep === 1 && selectedPlan) {
    return isCheckoutLoading || isCheckingEmail; 
  }
  if (currentStep === 1) {
    return isCheckingEmail; 
  }
    if (currentStep === 2 && verificationToken) {
      return isSettingPassword;
    }
    if (currentStep === 6) {
      return isUpdatingUser;
    }
    if (currentStep === steps.length - 1) {
      return isDashboardNavigating;
    }
    return false;
  };

  const isButtonDisabled = () => {
    // Disable button if there are validation errors for current step
   if (currentStep === 1) {
    return !!(emailFormik.errors.email && emailFormik.touched.email) || !!emailError; 
  }
    if (currentStep === 2) {
      return !!(
        (passwordFormik.errors.password && passwordFormik.touched.password) ||
        (passwordFormik.errors.confirmPassword && passwordFormik.touched.confirmPassword)
      );
    }
    return false;
  };

  return (
    <div>
      {contextHolder}
      <div>{steps[currentStep]}</div>

      <div className="flex flex-col gap-4">
        <button
          type="submit"
          onClick={handleNext}
          disabled={isButtonLoading() || isButtonDisabled()}
          className={`w-full border-4 border-[#18CB9659] bg-[#18CB96] hover:bg-[#18CB96]/90 transition-colors duration-200 rounded-lg h-[60px] p-4 text-white ${
            isButtonLoading() || isButtonDisabled() ? "opacity-70 cursor-not-allowed" : ""
          }`}
        >
          {isButtonLoading() ? "Processing..." : getButtonText()}
        </button>
      </div>

         {/* Email Already Exists Modal */}
      {showEmailExistsModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 p-4 sm:p-0 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md text-center">
            <div className="mb-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
                <svg
                  className="h-6 w-6 text-yellow-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                  />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Account Already Exists
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              We notice this email <span className=" font-semibold">({form.email})</span> already exists in our system. You can either login to your existing account or reset your password if you&apos;ve forgotten it.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-around">
              {/** 
              <button
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                onClick={() => setShowEmailExistsModal(false)}
              >
                Cancel
              </button>
              */}
              <button
                className="px-4 py-2 bg-white border border-green-600 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-colors"
                onClick={handleGoToLogin}
              >
                Go to Login
              </button>
              <button
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                onClick={handleResetPassword}
              >
                Reset Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Signup;