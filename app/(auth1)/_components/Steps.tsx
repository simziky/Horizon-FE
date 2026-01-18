"use client";

import { usePathname } from "next/navigation";

const AuthSteps = () => {
  const pathname = usePathname();

  if (pathname !== "/auth/signup") return null;

  return (
    <div className="mt-10 flex flex-col text-[#596375] font-medium text-lg">
      {/* Step 1 */}
      <div className="flex items-start gap-4">
        <div className="flex flex-col items-center">
          <span className="bg-[#18CB96] rounded-full size-9 text-white flex items-center justify-center">
            1
          </span>
          <span className="border-r border-[#18CB96] border-dashed h-[50px]" />
        </div>
        <span>Sign up</span>
      </div>

      {/* Step 2 */}
      <div className="flex items-start gap-4">
        <div className="flex flex-col items-center">
          <span className="bg-[#18CB96] rounded-full size-9 text-white flex items-center justify-center">
            2
          </span>
          <span className="border-r border-[#18CB96] border-dashed h-[50px]" />
        </div>
        <span>Select Plan</span>
      </div>

      {/* Step 3 */}
      <div className="flex items-start gap-4">
        <div className="flex flex-col items-center">
          <span className="bg-[#18CB96] rounded-full size-9 text-white flex items-center justify-center">
            3
          </span>
        </div>
        <span>Store Setup</span>
      </div>
    </div>
  );
};

export default AuthSteps;

