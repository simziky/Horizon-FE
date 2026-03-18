interface HeadingProps {
  title: string;
  subtitle?: string;
  help?: boolean;
  className?: string;
}

export default function Heading({
  title,
  subtitle,
  help = true,
  className,
}: HeadingProps) {
  return (
    <div
      className={`flex flex-col sm:flex-row gap-4 sm:items-center justify-between ${className}`}
    >
      {/* Title & Subtitle */}
      <span className="flex flex-col gap-2">
        <h2 className="text-[#01011D] text-lg font-medium">{title}</h2>
        {subtitle && <p className="text-[#787891] text-sm">{subtitle}</p>}
      </span>

      {/* Help Button (shown by default) */}
      {help && (
        <button
          type="button"
          // hidden for now until the help modal is implemented
          className="hidden gap-2.5 items-center rounded-xl px-4 py-2 border border-[#EBEBEB] text-[#787891] hover:bg-gray-50 duration-200 active:scale-95"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
          >
            <path
              d="M9.59099 9.59099C8.71231 10.4697 7.28769 10.4697 6.40901 9.59099M9.59099 9.59099C10.4697 8.71231 10.4697 7.28769 9.59099 6.40901M9.59099 9.59099L11.9775 11.9775M6.40901 9.59099C5.53033 8.71231 5.53033 7.28769 6.40901 6.40901M6.40901 9.59099L4.02252 11.9775M6.40901 6.40901C7.28769 5.53033 8.71231 5.53033 9.59099 6.40901M6.40901 6.40901L4.02252 4.02252M9.59099 6.40901L11.9775 4.02252M12.2426 12.2426C9.89949 14.5858 6.10051 14.5858 3.75736 12.2426C1.41421 9.89949 1.41421 6.10051 3.75736 3.75736C6.10051 1.41421 9.89949 1.41421 12.2426 3.75736C14.5858 6.10051 14.5858 9.89949 12.2426 12.2426Z"
              stroke="#787891"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Need Help?
        </button>
      )}
    </div>
  );
}
