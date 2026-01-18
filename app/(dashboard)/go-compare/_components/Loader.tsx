"use client";
import type React from "react";
import { useEffect, useState } from "react";

interface GoCompareLoaderProps {
  asin: string;
  storeNames: string[];
  isLoading: boolean;
}

const GoCompareLoader: React.FC<GoCompareLoaderProps> = ({ asin, storeNames, isLoading }) => {
  const [currentStoreIndex, setCurrentStoreIndex] = useState(0);
  const [animatedProgress, setAnimatedProgress] = useState<number[]>([]);
  const [isCompilingResults, setIsCompilingResults] = useState(false);

  // Use fixed steps when storeNames is empty to ensure consistent 33%, 66%, 100% progression
  const steps = storeNames.length > 0 ? [
    ...storeNames.map((storeName, index) => ({
      percent: `${Math.round(((index + 1) / (storeNames.length + 1)) * 100)}%`,
      description: `Searching arbitrage opportunities for ${asin} in ${storeName}...`,
      isStoreStep: true,
      storeIndex: index,
    })),
    {
      percent: "100%",
      description: "Compiling results and finalizing data...",
      isStoreStep: false,
      storeIndex: storeNames.length,
    }
  ] : [
    {
      percent: "33%",
      description: `Initializing search for ${asin}...`,
      isStoreStep: true,
      storeIndex: 0,
    },
    {
      percent: "66%",
      description: "Searching for products across marketplaces...",
      isStoreStep: true,
      storeIndex: 1,
    },
    {
      percent: "100%",
      description: "Compiling results and finalizing data...",
      isStoreStep: false,
      storeIndex: 2,
    }
  ];

  useEffect(() => {
    setAnimatedProgress(new Array(steps.length).fill(0));
  }, [steps.length]);

  useEffect(() => {
    if (!isLoading) return;

    if (currentStoreIndex === 0) {
    }

    // Ensure we progress through each step with consistent timing
    const progressTiming = 15000; // 15 seconds per step
    
    const storeInterval = setInterval(() => {
      setCurrentStoreIndex(prev => {
        if (prev < storeNames.length - 1) {
          return prev + 1;
        } else {
          setAnimatedProgress(prevProgress => {
            const newProgress = [...prevProgress];
            newProgress[prev] = 100;
            return newProgress;
          });

          setTimeout(() => {
            setIsCompilingResults(true);
          }, 500);

          clearInterval(storeInterval);
          return prev;
        }
      });
    }, progressTiming);

    return () => clearInterval(storeInterval);
  }, [isLoading, storeNames.length]);

  useEffect(() => {
    if (!isLoading) return;

    setAnimatedProgress(prev => {
      const newProgress = [...prev];
      for (let i = 0; i < currentStoreIndex; i++) {
        newProgress[i] = 100;
      }
      return newProgress;
    });

    if (currentStoreIndex < storeNames.length && !isCompilingResults) {
      let progress = 0;
      const progressTiming = 15000; // 15 seconds per step (must match storeInterval)
      const increment = 100 / (progressTiming / 100); 

      const currentStoreInterval = setInterval(() => {
        progress += increment;
        if (progress <= 100) {
          setAnimatedProgress(prev => {
            const newProgress = [...prev];
            newProgress[currentStoreIndex] = Math.min(progress, 100);
            return newProgress;
          });
        } else {
          clearInterval(currentStoreInterval);
        }
      }, 100);

      return () => clearInterval(currentStoreInterval);
    }

    if (isCompilingResults) {
      const compilationIndex = storeNames.length;
      let progress = 0;
      const increment = 1; 

      const compilationInterval = setInterval(() => {
        if (!isLoading) {
          setAnimatedProgress(prev => {
            const newProgress = [...prev];
            newProgress[compilationIndex] = 100;
            return newProgress;
          });
          clearInterval(compilationInterval);
          return;
        }

        progress += increment;
        if (progress <= 95) {
          setAnimatedProgress(prev => {
            const newProgress = [...prev];
            newProgress[compilationIndex] = progress;
            return newProgress;
          });
        }
      }, 200);

      return () => clearInterval(compilationInterval);
    }
  }, [currentStoreIndex, isCompilingResults, isLoading, storeNames.length]);

  useEffect(() => {
    if (!isLoading && animatedProgress.length > 0) {
      const completedProgress = new Array(steps.length).fill(100);
      setAnimatedProgress(completedProgress);
    }
  }, [animatedProgress.length, isLoading, steps.length]);

  return (
    <div className="flex flex-col space-y-5 max-w-[80%] w-full min-w-3xl mx-auto p-6">
      {steps.map((step, index) => (
        <div key={index} className="flex justify-between items-center">
          {/* Timeline and percentage indicator */}
          <div className="relative mr-40" style={{ width: "100px" }}>
            {/* Vertical dotted line */}
            {index < steps.length - 1 && (
              <div
                className="absolute h-full z-0"
                style={{
                  left: "5px",
                  top: "0",
                  height: "calc(100% + 70px)",
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
                className={`w-3 h-3 rounded-full ${(step.isStoreStep && index === currentStoreIndex) ||
                    (!step.isStoreStep && isCompilingResults)
                    ? "bg-[#18cb96] animate-pulse"
                    : "bg-gray-300"
                  } ${(step.isStoreStep && index < currentStoreIndex) ||
                    (!step.isStoreStep && !isLoading)
                    ? "bg-[#18cb96]"
                    : ""
                  }`}
              ></div>
            </div>

            {/* Percentage pill */}
            <div className="absolute left-5 -top-2">
              <div
                className={`px-3 text-xs py-0.5 rounded-full bg-[#18cb96]/10 transition-all duration-300 ${(step.isStoreStep && index <= currentStoreIndex) ||
                    (!step.isStoreStep && isCompilingResults)
                    ? "opacity-100"
                    : "opacity-50"
                  }`}
              >
                <span className="text-sm font-medium text-[#18cb96]">
                  {step.percent}
                </span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            <div
              className={`mb-2 text-xs text-gray-400 transition-opacity duration-300 ${(step.isStoreStep && index <= currentStoreIndex) ||
                  (!step.isStoreStep && isCompilingResults)
                  ? "opacity-100"
                  : "opacity-50"
                }`}
            >
              {step.description}
            </div>

            {/* Custom progress bar with smooth animation */}
            <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#18cb96] rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${animatedProgress[index] || 0}%`
                }}
              ></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default GoCompareLoader;