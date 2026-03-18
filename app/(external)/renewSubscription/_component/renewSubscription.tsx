"use client";

import { useLazyGetPricingQuery } from "@/redux/api/auth";
import { useLazyNewSubscriptionQuery } from "@/redux/api/subscriptionApi";
import { Button, message } from "antd";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { IoIosCheckmark } from "react-icons/io";
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

const RenewSubscription = () => {
  const router = useRouter();
  const [getPricing, { data: apiResponse, isLoading }] = useLazyGetPricingQuery();
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [isAnnual, setIsAnnual] = useState(false);
  const [expandedFeatures, setExpandedFeatures] = useState<{
    [key: number]: boolean;
  }>({});
  const [showModal, setShowModal] = useState(false);
  const [renew, { isLoading: subscribeLoading }] = useLazyNewSubscriptionQuery();
  const [messageApi, contextHolder] = message.useMessage();
  const [pricingData, setPricingData] = useState<PricingPlan[]>([]);

  useEffect(() => {
    getPricing({});
  }, [getPricing]);

  useEffect(() => {
    if (apiResponse?.data) {
      setPricingData(apiResponse.data);
    }
  }, [apiResponse]);

  // Process pricing data to get plans for current billing interval
  const getProcessedPlans = () => {
    const currentInterval = isAnnual ? "year" : "month";
    const filteredPlans = pricingData.filter(
      (plan) => plan.interval === currentInterval
    );

    const sortedPlans = filteredPlans.sort(
      (a, b) => parseFloat(a.price) - parseFloat(b.price)
    );

    return sortedPlans.map((plan) => {
      const isDefaultHighlighted = plan.name.toUpperCase() === "PREMIUM";
      
      // Calculate display price based on interval
      let displayPrice, priceLabel;
      if (plan.interval === "year") {
        displayPrice = parseFloat(plan.price).toFixed(0);
        priceLabel = "Per year";
      } else {
        displayPrice = parseFloat(plan.price).toFixed(0);
        priceLabel = "Per month";
      }
      
      const features = plan.meta_data.features?.map((f) => f.name) || [];

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

      // Get notes - matching Pricing component logic
      const notes = plan.meta_data.notes || [];
      const displayNotes = notes.length > 0 ? notes : [plan.interval === "year" ? "Annual billing" : "Monthly billing"];

      const isDisabled = plan.name.toUpperCase() === "SAGE";

      return {
        id: plan.id,
        name: plan.name,
        price: parseInt(displayPrice),
        originalPrice: parseFloat(plan.price),
        priceLabel,
        description,
        features,
        notes: displayNotes,
        buttonText: isDisabled ? "Unavailable" : "Renew Subscription",
        isDefaultHighlighted,
        stripePriceId: plan.stripe_price_id,
        interval: plan.interval,
        trial: plan.trial,
        isDisabled,
      };
    });
  };

  const processedPlans = getProcessedPlans();

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
      setSelectedPlanId(planId);
      setShowModal(true);
    }
  };

  const confirmSubscription = () => {
    if (!selectedPlanId) {
      return;
    }
    renew({
      pricing_id: selectedPlanId.toString(),
    })
      .unwrap()
      .then((res) => {
        router.push(`${res?.data?.url}`);
        messageApi.success("Redirecting to checkout...");
      })
      .catch((err) => {
        messageApi.error(err?.data?.message || "Renewal failed");
      });
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
      {contextHolder}
      <div className="max-w-6xl mx-auto lg:px-8">
        <div className="bg-white p-6 pb-20 rounded-3xl">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Renew Your Subscription</h2>
            <p className="text-gray-600 mt-2">Choose the plan you want to renew</p>
          </div>

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
          <div className="grid gap-6 md:grid-cols-3">
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
                      {(expandedFeatures[plan.id]
                        ? plan.features
                        : plan.features.slice(0, 5)
                      ).map((feature, idx) => (
                        <li key={idx} className="flex gap-2">
                          <div className="relative w-6 h-6 flex-shrink-0">
                            <FaCircle
                              className={`absolute inset-0 ${
                                isHighlighted
                                  ? "text-[#dbdbdb54]"
                                  : "text-[#009F6D]/40"
                              }`}
                            />
                            <IoIosCheckmark
                              className={`absolute inset-0 ${
                                isHighlighted
                                  ? "text-[#DBDBDB]"
                                  : "text-[#009F6D]"
                              }`}
                            />
                          </div>
                          <span>{feature}</span>
                        </li>
                      ))}

                      {plan.features.length > 5 && (
                        <li className="ml-6">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
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
                        e.stopPropagation();
                        handleGetStarted(plan.id);
                      }}
                      disabled={!isSelected || plan.isDisabled}
                      className={`mt-3 w-full rounded-lg text-sm py-2 font-medium transition-all duration-200
                        ${
                          plan.isDisabled
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : isSelected
                            ? "bg-[#FFB951] text-white hover:bg-[#FF8E51] cursor-pointer"
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

      {/* Renewal Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 p-4 sm:p-0 z-50">
          <div className="bg-[#0A0A0A] p-6 rounded-lg shadow-lg max-w-96 text-center text-white">
            <h3 className="text-xl font-bold">Subscription Renewal</h3>
            <p className="mt-2 text-white">
              This action will charge your card. Please confirm you want to renew your subscription.
            </p>
            <div className="mt-4 flex flex-col-reverse sm:flex-row gap-3 justify-center">
              <button
                className="px-4 py-2 bg-gray-300 rounded-lg text-[#09090B]"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <Button
                className="!px-4 !py-2 !bg-green-500 !border-none !h-[40px] !text-white !rounded-lg"
                onClick={confirmSubscription}
                loading={subscribeLoading}
                disabled={subscribeLoading}
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default RenewSubscription;