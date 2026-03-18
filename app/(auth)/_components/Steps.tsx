"use client";

import { useAuthStep } from "@/context/authContext";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const AuthSteps = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { currentStep, setCurrentStep } = useAuthStep();
  const [displayStep, setDisplayStep] = useState(currentStep);

  // Update display step when context changes or when URL params change
  useEffect(() => {
    const urlStep = searchParams.get("step");
    if (urlStep) {
      const stepNumber = parseInt(urlStep, 10);
      if (stepNumber >= 0 && stepNumber <= 7) {
        // Only update context if it's different from current context step
        // This prevents infinite loops and flickering
        if (stepNumber !== currentStep) {
          setCurrentStep(stepNumber);
        }
        setDisplayStep(stepNumber);
      }
    } else {
      // Always sync with context currentStep
      setDisplayStep(currentStep);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, setCurrentStep]); // Removed currentStep from dependencies to prevent loops

  // Additional effect to ensure displayStep always follows currentStep changes
  useEffect(() => {
    setDisplayStep(currentStep);
  }, [currentStep]);

  if (pathname !== "/signUp") return null;

  // Map the signup component steps to the 3 main steps
  const getMainStep = (step: number) => {
    if (step <= 3) return 1; // Sign up (fullname, email, password, preview)
    if (step <= 5) return 2; // Select Category (amazon status, category)
    return 3; // Store Setup (connect store, final preview)
  };

  const mainStep = getMainStep(displayStep);

  const steps = [
    { number: 1, title: "Sign up" },
    { number: 2, title: "Select Category" },
    { number: 3, title: "Store Setup" },
  ];

  const getStepStatus = (stepNumber: number) => {
    if (stepNumber < mainStep) return "completed";
    if (stepNumber === mainStep) return "active";
    return "inactive";
  };

  // NEW: Function to handle clicking on a step
  const handleStepClick = (stepNumber: number) => {
    const status = getStepStatus(stepNumber);
    // Only allow navigating back to "Select Category" (step 2) if it's already completed
    if (stepNumber === 2 && status === "completed") {
      const targetStep = 4; // The first sub-step for "Select Category"
      setCurrentStep(targetStep);

      // Also, update the URL to keep the state consistent
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set("step", targetStep.toString());
      window.history.replaceState({}, "", newUrl.toString());
    }
  };

  const getStepStyles = (status: string) => {
    switch (status) {
      case "completed":
        return {
          circle: "bg-[#18CB96] text-white",
          line: "border-[#18CB96]",
          text: "text-[#18CB96]",
        };
      case "active":
        return {
          circle: "bg-[#18CB96] text-white ring-2 ring-[#18CB96] ring-offset-2",
          line: "border-[#E5E5E5]",
          text: "text-[#596375] font-semibold",
        };
      default:
        return {
          circle: "bg-[#E5E5E5] text-[#9CA3AF]",
          line: "border-[#E5E5E5]",
          text: "text-[#9CA3AF]",
        };
    }
  };

  return (
    <div className="mt-10 flex flex-col text-[#596375] font-medium text-lg">
      {steps.map((step, index) => {
        const status = getStepStatus(step.number);
        const styles = getStepStyles(status);
        const isLastStep = index === steps.length - 1;
        // NEW: Determine if the step should be clickable
        const isClickable = step.number === 2 && status === "completed";

        return (
          // MODIFIED: Added onClick handler and conditional cursor style
          <div
            key={step.number}
            className={`flex items-start gap-4 ${
              isClickable ? "cursor-pointer" : ""
            }`}
            onClick={() => handleStepClick(step.number)}
          >
            <div className="flex flex-col items-center">
              <span
                className={`rounded-full size-9 flex items-center justify-center transition-all duration-300 ${styles.circle}`}
              >
                {status === "completed" ? (
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  step.number
                )}
              </span>
              {!isLastStep && (
                <span
                  className={`border-r border-dashed h-[50px] transition-colors duration-300 ${styles.line}`}
                />
              )}
            </div>
            <span className={`transition-colors duration-300 ${styles.text}`}>
              {step.title}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default AuthSteps;