/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import SubscriptionHistoryTable from "./SubscriptionHistoryTable";
import { Heading } from "@/components/ui";
import { useLazyGetSubscriptionsQuery } from "@/redux/api/user";
import { useAppSelector } from "@/redux/hooks";
import {
  useLazyGetPricingQuery,
  useLazyGetProfileQuery,
  useLazyGetUserPricingQuery,
} from "@/redux/api/auth";
import { Button, message, Modal } from "antd";
import { GoAlert } from "react-icons/go";
import {
  useCancelSubscriptionMutation,
  useChangeSubscriptionMutation,
  useRenewSubscriptionMutation,
} from "@/redux/api/subscriptionApi";
import useCurrencyConverter from "@/utils/currencyConverter";
import { MdInfoOutline } from "react-icons/md";
import { LuDot } from "react-icons/lu";
import { FaCheckCircle, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { formatDate } from "@/utils/dateFormat";
import RenewSubscriptionModal from "@/components/modals/RenewSubModal";
import { IoWarning } from "react-icons/io5";
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

const Subscriptions = () => {
  const [isAnnual, setIsAnnual] = useState(false);
  const [pricingData, setPricingData] = useState<PricingPlan[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isRenewVisible, setIsRenewVisible] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [expandedFeatures, setExpandedFeatures] = useState<{[key: string]: boolean}>({});

  const [getSubscription, { data: subData, isLoading }] =
    useLazyGetSubscriptionsQuery();
  const {
    subscription_type,
    subscription_canceled,
    trial_ends_at,
    next_billing_date,
    subscription_will_end_at,
    billing_status,
    is_subscribed,
    plan_id,
  } = useAppSelector((state) => state.api?.user) || {};
  const { currencyCode, currencySymbol } =
    useAppSelector((state) => state.global) || {};

  const [getPricing, { data, isLoading: isLoadingPricing }] =
    useLazyGetPricingQuery();
  const [changeSubscription, { isLoading: changeLoading }] =
    useChangeSubscriptionMutation();
  const [getProfile] = useLazyGetProfileQuery();
  const [messageApi, contextHolder] = message.useMessage();
  const [renewSub, { isLoading: renewLoading }] =
    useRenewSubscriptionMutation();

  const { convertPrice } = useCurrencyConverter(currencyCode);

  useEffect(() => {
    getSubscription({});
    getPricing({});
  }, [getSubscription, getPricing]);

  useEffect(() => {
    if (data?.data) {
      setPricingData(data.data);
    }
  }, [data]);

  // Process pricing data similar to Pricing component
  const getProcessedPlans = () => {
    const currentInterval = isAnnual ? "year" : "month";
    
    // Filter by current interval only
    const filteredPlans = pricingData.filter(
      (plan) => plan.interval === currentInterval
    );

    // Sort by price
    const sortedPlans = filteredPlans.sort(
      (a, b) => parseFloat(a.price) - parseFloat(b.price)
    );

    return sortedPlans.map((plan) => {
      const isDefaultHighlighted = plan.name.toUpperCase() === "PREMIUM";

      let displayPrice, priceLabel;
      if (plan.interval === "year") {
        displayPrice = parseFloat(plan.price).toFixed(0);
        priceLabel = "Per year";
      } else {
        displayPrice = parseFloat(plan.price).toFixed(0);
        priceLabel = "Per month";
      }

      // Properly handle features - extract names from feature objects
      const features = plan.meta_data.features?.map((f) => {
        if (typeof f === 'string') return f;
        if (typeof f === 'object' && f !== null) {
          return f.name || "";
        }
        return "";
      }).filter(Boolean) || [];

      let description = plan.meta_data.tooltip || "";
      if (!description) {
        const planName = plan.name.toUpperCase();
        if (planName.includes("STARTER")) {
          description = "New sellers & small businesses";
        } else if (planName === "PREMIUM") {
          description = "For growing sellers & established brands";
        } else if (planName === "SAGE" || planName === "ENTERPRISE") {
          description = "Large sellers & enterprises";
        } else {
          description = "Professional plan";
        }
      }

      const notes = plan.meta_data.notes || [];
      const displayNotes = notes.length > 0 ? notes : [plan.interval === "year" ? "Annual billing" : "Monthly billing"];

      const isDisabled = plan.name.toUpperCase() === "SAGE";
      const isCurrentPlan = plan.name === subscription_type;

      return {
        id: plan.id,
        name: plan.name,
        price: parseInt(displayPrice),
        originalPrice: parseFloat(plan.price),
        priceLabel,
        description,
        features,
        notes: displayNotes,
        isDefaultHighlighted,
        stripePriceId: plan.stripe_price_id,
        interval: plan.interval,
        trial: plan.trial,
        isDisabled,
        isCurrentPlan,
      };
    });
  };

  const processedPlans = getProcessedPlans();

  const handleSubscriptionChange = (planId: number) => {
    changeSubscription({ pricing_id: planId.toString() })
      .unwrap()
      .then(() => {
        messageApi.success("Changed Subscription Successfully");
        getProfile({});
        getSubscription({});
        getPricing({});
        setIsModalVisible(false);
      })
      .catch(() => {
        messageApi.error("Failed to change Subscription");
      });
  };

  const handleRenewSubscription = () => {
    renewSub({ pricing_id: plan_id })
      .unwrap()
      .then(() => {
        messageApi.success("Subscription renewed");
        getProfile({});
        setIsRenewVisible(false);
      })
      .catch(() => {
        messageApi.error("Subscription renewal failed");
      });
  };

  const toggleFeatures = (planKey: string) => {
    setExpandedFeatures(prev => ({
      ...prev,
      [planKey]: !prev[planKey]
    }));
  };

  // Determine expiration date and message
  let expirationDate;
  let statusMessage = "";
  let statusText = "";

  if (subscription_canceled) {
    statusText = "Canceled";
    statusMessage = "Your subscription will fully expire at";
    expirationDate = subscription_will_end_at;
  } else {
    switch (billing_status) {
      case "trialing":
        statusText = "";
        statusMessage = "Your trial ends at";
        expirationDate = trial_ends_at;
        break;
      case "active":
        statusText = "Active";
        statusMessage = "Your subscription will renew on";
        expirationDate = next_billing_date;
        break;
      default:
        statusText = "Inactive";
        statusMessage = "No active subscription";
    }
  }

  return (
    <section className="flex flex-col gap-8 min-h-[50dvh] md:min-h-[80dvh] bg-white rounded-2xl p-5">
      {contextHolder}
      <div className=" flex items-center justify-between">
        <Heading
          title="Subscription Plan"
          subtitle={`You are currently on the ${subscription_type} Plan.`}
        />
      </div>

      {/* plans */}
      <div className="flex flex-col gap-7">
        {/* Toggle Buttons */}
        <div className="flex justify-center">
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

        {/* grid */}
        <div className={`grid gap-6 ${processedPlans.length === 1 ? 'grid-cols-1 max-w-md mx-auto' : processedPlans.length === 2 ? 'grid-cols-2' : 'sm:grid-cols-3'}`}>
          {processedPlans.map((plan, index) => {
            const planKey = `${plan.id}-${plan.interval}-${index}`;
            const isExpanded = expandedFeatures[planKey] || false;
            const displayedFeatures = isExpanded ? plan.features : plan.features.slice(0, 2);
            const hasMoreFeatures = plan.features.length > 4;

            return (
              <div
                key={planKey}
                className={`border border-[#EBEBEB] hover:border-primary duration-200 rounded-3xl p-6 flex flex-col gap-3 ${
                  plan.name.toUpperCase().includes('STARTER') 
                    ? "text-[#787891]" 
                    : plan.name.toUpperCase() === 'PREMIUM'
                    ? "bg-[url(/assets/images/pricing-bg.png)] text-[#787891]"
                    : "bg-[url(/assets/images/Pricing3.png)] text-white"
                } bg-no-repeat bg-cover bg-top hover:bg-primary/5 ${
                  plan.isCurrentPlan ? "ring-1 ring-primary" : ""
                }`}
              >
                {/**
                {plan.isCurrentPlan && (
                  <div className="bg-primary text-white text-xs px-3 py-1 rounded-full w-fit">
                    Current Plan
                  </div>
                )}
                   

                {plan.isDisabled && (
                  <div className="bg-gray-600 text-white text-xs px-3 py-1 rounded-full w-fit">
                    Coming Soon
                  </div>
                )}
                  */}

                <span className="flex flex-col gap-5">
                  <h3 className="capitalize font-semibold">{plan.name}</h3>
                  <p>
                    <span className="text-xl sm:text-2xl font-semibold">
                      {currencySymbol}
                    </span>
                    <span
                      className={`text-xl sm:text-2xl font-semibold ${
                        plan.name.toUpperCase() === 'SAGE' ? "text-white" : "text-[#01011D]"
                      }`}
                    >
                      {convertPrice(plan.price.toString())}
                    </span>{" "}
                    &nbsp;
                    <span className="text-sm">{plan.priceLabel}</span>
                  </p>
                </span>

                <p className="text-sm font-medium">{plan.description}</p>

                {/* Features and Notes List */}
                <ul className="mt-1 text-left space-y-2 h-fit pt-2">
                  {displayedFeatures.map((feature, idx) => (
                    <li className="flex gap-2 items-start" key={idx}>
                      <FaCheckCircle
                        className={`!h-[20px] !w-[20px] flex-shrink-0 mt-0.5 ${
                          plan.name.toUpperCase() === 'SAGE' ? "text-white" : "text-green-700"
                        }`}
                      />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                  
                  {/* Notes integrated into features list */}
                  {plan.notes.length > 0 && plan.notes.map((note, noteIdx) => (
                    <li className="flex gap-2 items-start" key={`note-${noteIdx}`}>
                      <FaCheckCircle
                        className={`!h-[20px] !w-[20px] flex-shrink-0 mt-0.5 ${
                          plan.name.toUpperCase() === 'SAGE' ? "text-white" : "text-green-700"
                        }`}
                      />
                      <span className="text-sm">{note}</span>
                    </li>
                  ))}
                </ul>

                {/* See More/Less Button */}
                {hasMoreFeatures && (
                  <button
                    onClick={() => toggleFeatures(planKey)}
                    className={`flex items-center justify-start gap-2 text-xs font-medium py-2 px-4 rounded-lg transition-colors ${
                      plan.name.toUpperCase() === 'SAGE' 
                        ? "text-white hover:bg-white/10" 
                        : "text-primary hover:bg-primary/5"
                    }`}
                  >
                    {isExpanded ? (
                      <>
                        See Less
                        <FaChevronUp className="w-3 h-3" />
                      </>
                    ) : (
                      <>
                        See More ({plan.features.length - 4} more)
                        <FaChevronDown className="w-3 h-3" />
                      </>
                    )}
                  </button>
                )}

                <button
                  type="button"
                  disabled={plan.isDisabled || plan.isCurrentPlan}
                  className={`px-6 py-2.5 text-sm rounded-xl font-medium duration-200 ${
                    plan.isCurrentPlan
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : plan.isDisabled
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "border-transparent text-white bg-primary hover:bg-primary-hover"
                  }`}
                  onClick={() => {
                    setIsModalVisible(true);
                    setSelectedPlan(plan);
                  }}
                >
                  {plan.isCurrentPlan
                    ? "Active Plan"
                    : plan.isDisabled
                    ? "Coming Soon"
                    : `Upgrade to ${plan.name}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/**SUBSCRIPTION STATUS */}
      <div className="space-y-4">
        <h2 className="text-[#01011D] text-lg font-medium">
          Subscription Status
        </h2>
        <div className="bg-[#FAFDFC] border border-[#DDE1DF] w-full rounded-xl p-4">
          {subscription_canceled && (
            <div className="flex items-center gap-1 border-[#E6F5F0] border bg-white rounded-xl py-1 px-2 mb-2">
              <MdInfoOutline />
              <span className="text-sm font-medium">
                Your subscription will not renew when expired
              </span>
            </div>
          )}
          <div className="flex justify-between items-center mt-2">
            <div>
              <h5 className="font-semibold text-[#090F0D]">
                {subscription_type} User
              </h5>
              <h6 className="flex items-center">
                <span className="text-sm text-[#1E6B4F] font-semibold">
                  {statusText}
                </span>
                {expirationDate && (
                  <>
                    <LuDot size={20} color="#D9D9D9" />
                    <span className="text-sm text-[#5F6362]">
                      {`${statusMessage} ${formatDate(expirationDate)}`}
                    </span>
                  </>
                )}
              </h6>
            </div>
            {subscription_canceled && (
              <div>
                <button
                  className="bg-primary text-white rounded-xl text-sm py-1 px-3 hover:bg-primary-hover"
                  onClick={() => setIsRenewVisible(true)}
                >
                  Resume Subscription
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* table */}
      <div className="flex flex-col gap-8">
        <span className="flex flex-col gap-2">
          <h2 className="text-[#01011D] text-lg font-medium">
            Subscription History
          </h2>
          <p className="text-[#787891] text-sm">
            Track and manage your subscription history effortlessly.
          </p>
        </span>

        <SubscriptionHistoryTable
          tableData={subData}
          loading={isLoading}
          convertPrice={convertPrice}
        />
      </div>

      <Modal
        title=""
        open={isModalVisible}
        footer={null}
        maskClosable={false}
        closable={false}
        centered={true}
        styles={{body:{padding: 0}, content:{borderRadius:30}}}
        width={453}
      >
        <div className=" space-y-3">
          <div className=" flex justify-center">
            <IoWarning size={60} color="white" fill="#FF8934" />
          </div>
          <h1 className=" text-2xl text-[#3F3F3F] font-semibold text-center">Change Subscription</h1>

          <div className=" text-center">
            <h1 className=" text-base text-[#676A75]">
              Please be informed that you are about to switch your subscription
              to{" "}
              <span className=" font-bold">
                {selectedPlan ? selectedPlan.name : ""} Plan
              </span>
            </h1>
            <p className=" text-xs text-gray-600 text-center mt-4">When your active subscription expires your card will be charged</p>
          </div>

          <div className="flex items-center justify-center gap-5  pt-6">
            <button
              className="px-4 py-2 bg-[#F2F2F2] rounded-lg  !h-[40px]"
              onClick={() => setIsModalVisible(false)}
            >
              Cancel
            </button>

            <Button
              loading={changeLoading}
              disabled={changeLoading}
              className="px-4 py-2 !bg-[#009F6D] !text-white !rounded-lg  !h-[40px] !border-none"
              onClick={() =>
                handleSubscriptionChange(selectedPlan ? selectedPlan.id : 0)
              }
            >
              Switch Subscription Now
            </Button>
          </div>
        </div>
      </Modal>

      <RenewSubscriptionModal
        isRenewVisible={isRenewVisible}
        setIsRenewVisible={() => setIsRenewVisible(false)}
        handleRenewSubscription={() => handleRenewSubscription()}
        loading={renewLoading}
      />
    </section>
  );
};

export default Subscriptions;