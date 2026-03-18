"use client";

import type React from "react";
import { useEffect, useState } from "react";

interface FinalLoaderProps {
  currentStep: number;
}

const FinalLoader: React.FC<FinalLoaderProps> = ({ currentStep }) => {
  // State to track animated progress values
  const [animatedProgress, setAnimatedProgress] = useState<number[]>([
    0, 0, 0, 0, 0,
  ]);

  // Define the steps with exact progress percentages to match the image
  const steps = [
    {
      percent: "0%",
      description: "Importing smart insights that fuel your next big sale...",
      progress: currentStep >= 0 ? 100 : 0,
    },
    {
      percent: "25%",
      description:
        "Filtering out the noise, keeping only what drives decisions...",
      progress: currentStep >= 1 ? 100 : 0,
    },
    {
      percent: "50%",
      description: "Analyzing historical trends for winning product signals...",
      progress: currentStep >= 2 ? 100 : 0,
    },
    {
      percent: "75%",
      description: "Prioritizing profitability over clutter...",
      progress: currentStep >= 3 ? 100 : 0,
    },
    {
      percent: "100%",
      description: "All set, let's make data your secret weapon.",
      progress: currentStep >= 4 ? 100 : 0,
    },
  ];

  // Update animated progress when currentStep changes
  useEffect(() => {
    // For the current step, animate from 0 to 100 smoothly
    if (currentStep >= 0 && currentStep < 5) {
      // Create a new array with updated values
      const newProgress = [...animatedProgress];

      // Set all previous steps to 100%
      for (let i = 0; i < currentStep; i++) {
        newProgress[i] = 100;
      }

      // Animate the current step
      let progress = 0;
      const interval = setInterval(() => {
        progress += 2;
        if (progress <= 100) {
          newProgress[currentStep] = progress;
          setAnimatedProgress([...newProgress]);
        } else {
          clearInterval(interval);
        }
      }, 20);

      return () => clearInterval(interval);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  return (
    <div className="flex flex-col space-y-5 max-w-[80%]  w-full min-w-3xl mx-auto p-6 bg-white rounded-3xl">
      {steps.map((step, index) => (
        <div key={index} className="flex justify-between items-center">
          {/* Timeline and percentage indicator */}
          <div className="relative mr-40" style={{ width: "100px" }}>
            {/* Vertical dotted line - updated to match the image exactly */}
            {index < steps.length - 1 && (
              <div
                className="absolute h-full z-0"
                style={{
                  left: "5px",
                  top: "0", // Start from the top of the container
                  height: "calc(100% + 70px)", // Extend into the next step's space
                  width: "2px",
                  backgroundImage:
                    "linear-gradient(to bottom, #D1D5DB 1px, transparent 1px)",
                  backgroundSize: "2px 4px",
                  backgroundRepeat: "repeat-y",
                }}
              />
            )}

            {/* Step dot with pulse animation when active */}
            <div
              className="relative z-10 bg-white"
              style={{ width: "12px", height: "12px" }}
            >
              <div
                className={`w-3 h-3 rounded-full ${
                  index === currentStep
                    ? "bg-green-500 animate-pulse"
                    : "bg-gray-300"
                } ${index < currentStep ? "bg-green-500" : ""}`}
              ></div>
            </div>

            {/* Percentage pill */}
            <div className="absolute left-5 -top-2">
              <div
                className={`px-3 text-xs py-0.5 rounded-full bg-green-50 transition-all duration-300 ${
                  index <= currentStep ? "opacity-100" : "opacity-50"
                }`}
              >
                <span className="text-sm font-medium text-green-500">
                  {step.percent}
                </span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            <div
              className={`mb-2 text-xs text-gray-400 transition-opacity duration-300 ${
                index <= currentStep ? "opacity-100" : "opacity-50"
              }`}
            >
              {step.description}
            </div>

            {/* Custom progress bar with smooth animation */}
            <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${animatedProgress[index]}%` }}
              ></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FinalLoader;
