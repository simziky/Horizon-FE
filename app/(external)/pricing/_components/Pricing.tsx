"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useLazyGetPricingQuery } from "@/redux/api/auth";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { IoIosCheckmark, IoIosCheckmarkCircle } from "react-icons/io";
import { FaCircle } from "react-icons/fa";

interface Feature {
  name: string;
  description: string;
}

interface PricingPlan {
  id: number;
  name: string;
  stripe_price_id: string;
  price: string;
  trial: number;
  currency: string;
  interval: string;
  meta_data: {
    notes?: string[];
    tooltip?: string;
    features?: Feature[];
    billing_note?: string;
  };
  status: number;
  created_at: string;
  updated_at: string;
  stripe_product_id: string;
}

export default function Pricing() {
  const searchParams = useSearchParams();
  const [isAnnual, setIsAnnual] = useState(false);
  const [pricingData, setPricingData] = useState<PricingPlan[]>([]);
  const [expandedFeatures, setExpandedFeatures] = useState<{
    [key: number]: boolean;
  }>({});
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [refCode, setRefCode] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [pricings, { data: apiResponse, isLoading }] = useLazyGetPricingQuery();

  const stats = [
    {
      value: "$92",
      title: "Blended ARPU",
      subtitle: "Weighted average revenue per user",
    },
    {
      value: "85%",
      title: "Gross Margins",
      subtitle: "High-margin SaaS model",
    },
    {
      value: "8%",
      title: "Monthly Churn",
      subtitle: "Industry-competitive retention",
    },
    {
      value: "2.3x",
      title: "LTV/CAC Ratio",
      subtitle: "Healthy unit economics",
    },
  ];

  useEffect(() => {
    pricings({});
  }, [pricings]);

  useEffect(() => {
    if (apiResponse?.data) {
      setPricingData(apiResponse.data);
    }
  }, [apiResponse]);

  // Extract URL parameters
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      setRefCode(ref);
    }
  }, [searchParams]);

  // Process pricing data to get plans for current billing interval
  const getProcessedPlans = () => {
    const currentInterval = isAnnual ? "year" : "month";
    const filteredPlans = pricingData.filter(
      (plan) => plan.interval === currentInterval
    );

    // Sort plans by price (ascending)
    const sortedPlans = filteredPlans.sort(
      (a, b) => parseFloat(a.price) - parseFloat(b.price)
    );

    return sortedPlans.map((plan, index) => {
      // Determine if this is the default highlighted plan (Premium)
      const isDefaultHighlighted = plan.name.toUpperCase() === "PREMIUM";

      // Calculate display price based on interval
      let displayPrice, priceLabel;
      if (plan.interval === "year") {
        // For annual plans, show the full annual price
        displayPrice = parseFloat(plan.price).toFixed(0);
        priceLabel = "Per year";
      } else {
        // For monthly plans, show monthly price
        displayPrice = parseFloat(plan.price).toFixed(0);
        priceLabel = "Per month";
      }

      // Get features from meta_data or use fallback
      const features = plan.meta_data.features?.map((f) => f.name) || [];

      // Get description from tooltip or generate based on plan name
      let description = plan.meta_data.tooltip || "";
      if (!description) {
        switch (plan.name.toUpperCase()) {
          case "STARTER (PRO)":
          case "STARTER":
            description = "New sellers & small businesses";
            break;
          case "PREMIUM":
            description = "For growing sellers & established brands";
            break;
          case "SAGE":
          case "ENTERPRISE":
            description = "Large sellers & enterprises";
            break;
          default:
            description = "Professional plan";
        }
      }

      // Get notes
      const notes = plan.meta_data.notes || [];
      const displayNotes = notes.length > 0 ? notes : [plan.interval === "year" ? "Annual billing" : "Monthly billing"];

      // Check if plan should be disabled (only STARTER (PRO) is available)
      //const isDisabled = plan.name.toUpperCase() !== 'STARTER (PRO)';
      const isDisabled = plan.name.toUpperCase() == "";

      return {
        id: plan.id,
        name: plan.name, // Keep original name without modification
        price: parseInt(displayPrice),
        originalPrice: parseFloat(plan.price),
        priceLabel,
        description,
        features,
        notes: displayNotes,
        buttonText: isDisabled
          ? "Unavailable"
          : plan.trial > 0
          ? "Start Free Trial"
          : "Get Started",
        isDefaultHighlighted,
        stripePriceId: plan.stripe_price_id,
        interval: plan.interval,
        trial: plan.trial,
        isDisabled,
      };
    });
  };

  const processedPlans = getProcessedPlans();

  // Set default selected plan when plans are loaded
  useEffect(() => {
    if (processedPlans.length > 0 && selectedPlanId === null) {
      const defaultPlan =
        processedPlans.find((plan) => plan.isDefaultHighlighted) ||
        processedPlans[0];
      setSelectedPlanId(defaultPlan.id);
    }
  }, [processedPlans, selectedPlanId]);

  // Reset selection when billing interval changes
  useEffect(() => {
    setSelectedPlanId(null);
  }, [isAnnual]);

  const toggleFeatures = (planId: number) => {
    setExpandedFeatures((prev) => ({
      ...prev,
      [planId]: !prev[planId],
    }));
  };

  const handleCardClick = (planId: number) => {
    setSelectedPlanId(planId);
  };

  const handleGetStarted = (planId: number) => {
    const plan = processedPlans.find((p) => p.id === planId);
    if (plan && !plan.isDisabled) {
      if (plan.trial > 0) {
        // Show modal for free trial plans
        setSelectedPlanId(planId);
        setShowModal(true);
      } else {
        // Direct redirect for non-trial plans
        handlePlanSelection(plan);
      }
    }
  };

  const handlePlanSelection = (plan: any) => {
    // Construct URL with parameters
    const url = `/signUp?ref=${refCode || ""}&pricing=${plan.id}`;

    // Use window.open for iframe compatibility
    if (window.top && window.top !== window) {
      // If in iframe, open in parent window
      window.top.open(url, "_blank");
    } else {
      // If not in iframe, open normally
      window.open(url, "_blank");
    }
  };

  const confirmSubscription = () => {
    const selectedPlan = processedPlans.find((p) => p.id === selectedPlanId);
    if (selectedPlan) {
      handlePlanSelection(selectedPlan);
      setShowModal(false);
    }
  };

  if (isLoading) {
    return (
    <div className="flex justify-center h-screen items-center">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
        </div>
    );
  }

  return (
    <section className="bg-[#E7EBEE] py-12">
      <div className="max-w-6xl mx-auto lg:px-8">
        <div className=" text-center mb-5">
          <h1 className=" text-4xl font-bold">Our Pricing</h1>
          <p>Choose the plan that fits your needs.</p>
        </div>
        <div className="bg-white p-6 pb-20 rounded-3xl">
          {/* Toggle */}
          <div className="flex justify-center mb-20">
            <div className="flex items-center space-x-4 bg-[#F3F8FB] rounded-full px-2 py-2">
              <button
                onClick={() => setIsAnnual(false)}
                className={`text-sm font-medium px-3 py-1 rounded-full transition-colors ${
                  !isAnnual ? "text-white bg-[#0BAB79]" : "text-gray-600"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={`text-sm font-medium px-3 py-1 rounded-full transition-colors ${
                  isAnnual ? "text-white bg-[#0BAB79]" : "text-gray-600"
                }`}
              >
                Annually
              </button>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid gap-6 md:grid-cols-3 ">
            {processedPlans.map((plan) => {
              const isSelected = selectedPlanId === plan.id;
              const isHighlighted = isSelected;

              return (
                <div
                  key={plan.id}
                  onClick={() => handleCardClick(plan.id)}
                  className={`rounded-2xl py-6 px-3 flex flex-col justify-between relative cursor-pointer transition-all duration-200 ${
                    isHighlighted
                      ? "bg-gradient-to-b from-[#08B27C] to-[#11946C] text-white scale-105 shadow-lg"
                      : "bg-white border border-[#D6D6D6] hover:border-[#08B27C] hover:shadow-md"
                  }`}
                >
                  {/* Coming Soon Badge for disabled plans */}
                  {plan.isDisabled && (
                    <div className="absolute top-2 right-2 bg-gray-600 text-white px-3 py-1 text-sm rounded-lg">
                      Coming Soon
                    </div>
                  )}

                    {isHighlighted && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 border border-[#08B27D] bg-white text-[#596375] text-xs px-3 py-1 rounded-full">
                      {plan.name.toUpperCase() === "PREMIUM" && isSelected ? "Most Popular" : "Selected"}
                    </div>
                  )}

                  <div className="flex flex-col items-center space-y-4">
                    <h3
                      className={`text-2xl font-semibold text-center ${
                        isHighlighted ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {plan.name}
                    </h3>
                    <p className="mt-2 text-6xl text-center font-bold">
                      <span
                        className={`${
                          isHighlighted
                            ? "text-white"
                            : "bg-gradient-to-r from-[#11946C] to-[#08B27C] bg-clip-text text-transparent"
                        }`}
                      >
                        ${plan.price}
                      </span>
                    </p>
                    <div
                      className={`px-3 py-[2px] rounded-2xl text-white w-fit
                  ${isHighlighted ? "bg-[#232323]" : "bg-[#09AD7A]"}
                      `}
                    >
                      <span className="text-sm">{plan.priceLabel}</span>
                    </div>
                    <p
                      className={`mt-1 text-base text-center font-semibold ${
                        isHighlighted ? "text-white" : "text-[#222222]"
                      }`}
                    >
                      {plan.description}
                    </p>
                    <ul className="!mt-7 space-y-4 text-sm">
                      {/* Show first 5 features or all if expanded */}
                      {(expandedFeatures[plan.id]
                        ? plan.features
                        : plan.features.slice(0, 5)
                      ).map((feature, idx) => (
                        <li key={idx} className="flex gap-2">
                          <div className="relative w-6 h-6 flex-shrink-0">
                            {/* Circle background */}
                            <FaCircle
                              className={`absolute  inset-0 ${
                                isHighlighted
                                  ? "text-[#dbdbdb54]"
                                  : "text-[#009F6D]/40"
                              }`}
                            />
                            {/* White check */}
                            <IoIosCheckmark
                              className={`absolute inset-0  ${
                                isHighlighted
                                  ? "text-[#DBDBDB]"
                                  : "text-[#009F6D]"
                              }`}
                            />
                          </div>
                          <span>{feature}</span>
                        </li>
                      ))}

                      {/* Show expand/collapse button if more than 5 features */}
                      {plan.features.length > 5 && (
                        <li className="ml-6">
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent card selection when clicking expand
                              toggleFeatures(plan.id);
                            }}
                            className={`text-xs font-medium underline hover:no-underline transition-colors ${
                              isHighlighted
                                ? "text-white hover:text-gray-200"
                                : "text-[#009F6D] hover:text-[#007A55]"
                            }`}
                          >
                            {expandedFeatures[plan.id]
                              ? "Show less"
                              : `+${plan.features.length - 5} more features`}
                          </button>
                        </li>
                      )}
                    </ul>
                  </div>
                  <div className="mt-6">
                    <div className="space-y-2 mb-3">
                      {plan.notes.map((note, noteIdx) => (
                        <p
                          key={noteIdx}
                          className={`text-sm text-[#006D4B] w-full py-2 px-5 font-medium rounded-md bg-[#E0F4EE] text-center`}
                        >
                          {note}
                        </p>
                      ))}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent card selection when clicking button
                        handleGetStarted(plan.id);
                      }}
                      disabled={!isSelected || plan.isDisabled}
                      className={`mt-3 w-full rounded-lg text-sm py-2 font-medium transition-all duration-200
                    ${
                      plan.isDisabled
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : isSelected
                        ? isHighlighted
                          ? "bg-[#FFB951] text-white hover:bg-[#FF8E51] cursor-pointer"
                          : "bg-[#FFB951] text-white hover:bg-[#FF8E51] cursor-pointer"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }
                  `}
                    >
                      {plan.isDisabled
                        ? "Unavailable"
                        : isSelected
                        ? plan.buttonText
                        : "Select plan first"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Free Trial Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 p-4 sm:p-0 z-50">
          <div className="bg-[#0A0A0A] p-6 rounded-lg shadow-lg max-w-96 text-center text-white">
            <h3 className="text-xl font-bold">7-Day Free Trial</h3>
            <p className="mt-2 text-white">
              You won&apos;t be charged today. Your 7-day free trial begins
              after you enter your card details, and you can cancel anytime
              before the trial ends.
            </p>
            <div className="mt-4 flex flex-col-reverse sm:flex-row gap-3 justify-center">
              <button
                className="px-4 py-2 bg-gray-300 rounded-lg text-[#09090B]"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-green-500 border-none h-[40px] text-white rounded-lg hover:bg-green-600 transition-colors"
                onClick={confirmSubscription}
              >
                Continue to SignUp
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}