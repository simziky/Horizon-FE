"use client";
import { useLazyCreateStripeSubscriptionV2Query } from "@/redux/api/subscriptionApi";
import { Button, message } from "antd";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { MdCancel } from "react-icons/md";

const PreSignUp = () => {
  const searchParams = useSearchParams();
  const [refCode, setRefCode] = useState<string>("");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [subscribe, {isLoading}] = useLazyCreateStripeSubscriptionV2Query();
  const [messageApi, contextHolder] = message.useMessage();
  
  useEffect(() => {
    const ref = searchParams.get("ref");
    const pricing = searchParams.get("pricing");
    if (ref || pricing) {
      setRefCode(ref || "");
      setSelectedPlan(pricing);
    }
  }, [searchParams]);

  const error = (err: undefined) => {
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

  const confirmSubscription = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPlan) {
      return;
    }

    // Build the payload without referral_code if refCode is not available
    const payload: {
      pricing_id: string;
      email: string;
      referral_code?: string;
    } = {
      pricing_id: selectedPlan,
      email,
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
        }
      })
      .catch((err) => {
        error(err?.data?.message)
      });
  };

  return (
    <main>
         {contextHolder}
      <form>
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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Ex: marc@example.com"
            className="p-3 bg-[#F4F4F5] border border-transparent focus:border-neutral-700 placeholder:text-[#52525B] text-sm rounded-md outline-none w-full"
          />
        </div>

        <Button
          htmlType="submit"
          className=" w-full mt-5 !border-none rounded-lg !bg-primary !hover:bg-primary-hover !text-white !font-semibold !p-2 !active:scale-95 !duration-200"
          onClick={confirmSubscription}
          loading={isLoading}
          disabled={isLoading}
        >
          Proceed to checkout
        </Button>
      </form>
    </main>
  );
};

export default PreSignUp;
