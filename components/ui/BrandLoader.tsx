"use client";

interface BrandLoaderProps {
  size?: number;
  fullScreen?: boolean;
  className?: string;
}

export default function BrandLoader({
  size = 64,
  fullScreen = false,
  className = "",
}: BrandLoaderProps) {
  const svg = (
    <svg
      width={size}
      height={size}
      viewBox="110 -4 27 26"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <style>{`
        @keyframes brand-pulse-1 {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.2; }
        }
        @keyframes brand-pulse-2 {
          0%, 100% { opacity: 0.2; }
          50%       { opacity: 1; }
        }
        .bl-1 { animation: brand-pulse-1 1s ease-in-out infinite; }
        .bl-2 { animation: brand-pulse-2 1s ease-in-out infinite; }
      `}</style>

      {/* Bottom-left arrow — from optisage-logo-alt.svg mask0 group */}
      <path
        className="bl-1"
        d="M127.07 6.04045L115.487 5.52628C113.256 5.44058 112.856 9.78252 115.515 9.86822L122.723 10.0682L122.179 17.3238C122.008 19.5233 126.326 19.7518 126.441 17.5237L127.07 6.06902V6.04045Z"
        fill="#18CB96"
      />

      {/* Top-right arrow — from optisage-logo-alt.svg mask3 group */}
      <path
        className="bl-2"
        d="M133.934 -0.301038L122.351 -0.815215C120.12 -0.900912 119.72 3.44103 122.38 3.52673L129.587 3.72668L129.043 10.9823C128.872 13.1818 133.19 13.4104 133.305 11.1823L133.934 -0.272473V-0.301038Z"
        fill="#18CB96"
      />
    </svg>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        {svg}
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      {svg}
    </div>
  );
}
