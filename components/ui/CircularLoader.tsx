"use client";

import { useEffect, useState } from "react";

interface CircularLoaderProps {
  duration?: number;
  color?: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

const CircularLoader = ({
  duration = 2000,
  color = "#4F46E5", // Default indigo color
  size = 48,
  strokeWidth = 4,
  className = "",
}: CircularLoaderProps) => {
  const [progress, setProgress] = useState(0);
  //   const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / duration) * 100, 90); // Stop at 95% until data loads

      setProgress(newProgress);

      if (elapsed >= duration) {
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [duration]);

  // Calculate the circumference and offset for the circle
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="#e5e7eb" // bg-gray-200 equivalent
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      <div className="flex justify-center mt-2 text-gray-500 text-sm">
        {progress < 100 ? "Loading..." : "Complete!"}
      </div>
    </div>
  );
};

export default CircularLoader;
