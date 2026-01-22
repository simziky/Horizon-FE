"use client";
/* eslint-disable react/no-unescaped-entities */
import { useVerifyStripeSubscriptionMutation } from "@/redux/api/subscriptionApi";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Logo from "@/public/assets/svg/Optisage Logo.svg";
import success from "@/public/assets/svg/success.svg";
import failedimg from "@/public/assets/svg/cancel.svg";
import { Button } from "antd";

export default function StripeCheckout() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const status = searchParams.get("status");
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(status !== "success");//
  const [verifySubscription] = useVerifyStripeSubscriptionMutation();
  const [verificationToken, setVerificationToken] = useState<string>("");

  const email = searchParams.get("email") || "";
  const firstName = searchParams.get("firstName") || "";
  const lastName = searchParams.get("lastName") || "";
  const step = searchParams.get("step") || "2";

  // Construct full name
  const fullName = `${firstName} ${lastName}`.trim();

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    const currentStatus = searchParams.get("status");

    if (currentStatus === "success") {
      setLoading(true);
      verifySubscription({ session_id: sessionId })
        .unwrap()
        .then((response) => {
          console.log("Verification response:", response);

          // Extract token from the response
          const token = response?.data?.token;
          if (token) {
            setVerificationToken(token);
          }

          setLoading(false);
          setFailed(false);
        })
        .catch((error) => {
          console.error("Verification failed:", error);
          setLoading(false);
          setFailed(true);
        });
    }
  }, [searchParams, verifySubscription]);

  const handleContinueRegistration = () => {
    // Create URL params for the signup page
    const params = new URLSearchParams();
    if (email) params.set("email", email);
    if (fullName) params.set("fullname", fullName);
    if (step) params.set("step", "2");
    if (verificationToken) params.set("token", verificationToken);

    // Navigate to signup page with user data and token
    router.push(`/signUp?${params.toString()}`);
  };

  const handleRetryPayment = () => {
    // Redirect back to pricing page
    window.location.href = "https://optisage.ai/#pricing";
  };

  return (
    <main className="bg-[#F8F8F8] min-h-screen">
      {loading ? (
        <div className="flex justify-center h-screen items-center">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* Logo at the top */}
          <div className="flex justify-center py-10">
            <Link href="/">
              <Image
                src={Logo}
                alt="Logo"
                width={203}
                height={53}
                quality={90}
              />
            </Link>
          </div>

          {/* Main content centered vertically in remaining space */}
          <div className="flex justify-center items-center" style={{ minHeight: 'calc(100vh - 180px)' }}>
            <div className="border rounded-3xl shadow p-7 max-w-[500px] border-[#E1E1E1] bg-white">
              <div className="flex justify-center mb-5">
                {failed ? (
                  <Image src={failedimg} alt="failed" />
                ) : (
                  <Image src={success} alt="successful" className="mb-6" />
                )}
              </div>

              <div className="flex justify-center md:max-w-[400px]">
                {failed ? (
                  <div className="text-center space-y-4">
                    <h1 className="font-bold text-3xl text-[#232323]">
                      Payment unsuccessful!
                    </h1>
                    <p className="text-[#42444A] text-sm">
                      Please check your payment details and try again.
                    </p>
                    <div>
                      <Button
                        className="w-full !border-none !rounded-2xl !font-semibold !text-base py-2 !h-[55px] !bg-[#18CB96] hover:!bg-primary/90 !text-white"
                        onClick={handleRetryPayment}
                      >
                        Select another plan
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-4">
                    <h1 className="font-bold text-3xl mb-6">
                      Payment Successful!
                    </h1>
                    <div className="space-y-5">
                      <p className="text-[#42444A] text-sm font-normal">
                        Thank you for subscribing to optisage! Your payment has
                        been processed successfully.
                      </p>
                     
                      <p className="text-sm text-[#42444A] font-semibold">
                        Let's complete your account setup to get started.
                      </p>
                    </div>
                    <div className="mt-10">
                      <Button
                        className="w-full !border-none !rounded-2xl !font-semibold !text-base py-2 !h-[55px] !bg-[#18CB96] hover:!bg-primary/90 !text-white"
                        onClick={handleContinueRegistration}
                      >
                        Continue Registration
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Support link at the bottom */}
          <div className="flex justify-center pb-5">
            <a
              href="https://optisage.ai/contact/#"
              className="underline text-gray-600 hover:text-gray-800"
            >
              Contact Support
            </a>
          </div>
        </>
      )}
    </main>
  );
}