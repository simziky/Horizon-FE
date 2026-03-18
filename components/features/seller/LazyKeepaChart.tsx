"use client";

import { useRef, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import type { ChartData } from "./keepa-chart";

const KeepaChart = dynamic(() => import("./keepa-chart"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-xl bg-[#F3F4F6]" />,
});

interface LazyKeepaChartProps {
  chartData?: ChartData | null;
  currency?: string;
  asin?: string;
  index?: number;
}

/**
 * Mounts KeepaChart only when the wrapper div enters the viewport.
 * Prevents off-screen cards from triggering chart renders and API calls.
 */
export default function LazyKeepaChart(props: LazyKeepaChartProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect(); // once mounted, never unmount
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={wrapperRef} className="h-full w-full">
      {inView
        ? <KeepaChart {...props} />
        : <div className="h-full w-full animate-pulse rounded-xl bg-[#F3F4F6]" />
      }
    </div>
  );
}
