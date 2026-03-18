"use client";

import { useEffect, useState } from "react";

interface ProgressLoaderProps {
  duration?: number;
  color?: string;
  height?: number;
  className?: string;
}

const ProgressLoader = ({
  duration = 2000,
  color = "#4F46E5", // Default indigo color
  height = 4,
  className = "",
}: ProgressLoaderProps) => {
  const [progress, setProgress] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / duration) * 100, 95); // Stop at 95% until data loads

      setProgress(newProgress);

      if (elapsed >= duration) {
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [duration]);

  // Function to complete the loader (call this when data is actually loaded)
  //   const completeLoader = () => {
  //     setProgress(100);
  //     setIsComplete(true);
  //   };

  return (
    <div className={`w-full ${className}`}>
      <div
        className="w-full overflow-hidden rounded-full bg-gray-200"
        style={{ height: `${height}px` }}
      >
        <div
          className="transition-all duration-300 ease-out rounded-full"
          style={{
            width: `${progress}%`,
            height: "100%",
            backgroundColor: color,
            transition: isComplete
              ? "width 0.3s ease-out"
              : "width 0.1s linear",
          }}
        />
      </div>
      <div className="flex justify-center mt-2 text-gray-500 text-sm">
        {progress < 100 ? "Loading sales statistics..." : "Complete!"}
      </div>
    </div>
  );
};

export default ProgressLoader;
