"use client";

import { Modal } from "antd";
import Image from "next/image";
import package_restriction from "@/public/assets/svg/packageRestrivtion.svg";

interface PackageRestrictionModalProps {
  open: boolean;
  onCancel: () => void;
  onUpgrade: () => void;
}

const PackageRestrictionModal = ({
  open,
  onCancel,
  onUpgrade,
}: PackageRestrictionModalProps) => {
  return (
    <Modal
      open={open}
      footer={null}
      closable={false}
      centered
      width={400}
      className="!p-0"
      styles={{ body: { padding: 0 }, content: { borderRadius: 30 } }}
    >
      <div className="bg-white rounded-3xl pt-10 pb-5 overflow-hidden ">
        {/* Header with BG Color instead of image */}
        <div className=" flex flex-col items-center py-6">
          <Image
            src={package_restriction}
            alt="image"
            className=" h-[91px]"
          />
        </div>

        {/* Body */}
        <div className="p-0 text-center">
          <h2 className="text-base font-normal mb-3 text-[#596375]">
            Your current subscription package doesnt allow this feature. To
            access, click the upgrade button to upgrade your subscription
            package.
          </h2>

          <div className=" flex gap-3 px-5 justify-center mt-10">
            <button
              onClick={onCancel}
              className=" w-[114px] bg-[#F2F2F2] text-[#676A75] rounded-lg py-2 hover:bg-[#F2F2F2]/40"
            >
              Cancel
            </button>

            <button
              onClick={onUpgrade}
              className=" 
                bg-[linear-gradient(170.84deg,#009F6D_26.22%,#128561_82.74%),linear-gradient(5.9deg,rgba(0,0,0,0)_48.66%,rgba(255,255,255,0.2)_95.01%)] hover:bg-[#128561] px-6
                bg-blend-normal text-white rounded-lg"
            >
              Upgrade subscription
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default PackageRestrictionModal;
