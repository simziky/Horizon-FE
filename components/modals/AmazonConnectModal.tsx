"use client";

import { Modal } from "antd";
import Image from "next/image";
import Link from "next/link";
import { HiMiniXMark } from "react-icons/hi2";
import opxamazon from "@/public/assets/images/opXama.png";

interface AmazonConnectModalProps {
  open: boolean;
  onClose: () => void;
  onDontShowAgain: () => void;
  isSaving: boolean;
  amazonAuthUrl: string;
}

const AmazonConnectModal = ({
  open,
  onClose,
  onDontShowAgain,
  isSaving,
  amazonAuthUrl,
}: AmazonConnectModalProps) => {
  return (
    <Modal
      open={open}
      footer={null}
      closable={false}
      centered
      width={420}
      className="!p-0"
      styles={{ body: { padding: 0 }, content: { borderRadius: 30 } }}
    >
      <div className="bg-white rounded-3xl pt-10 overflow-hidden ">
        {/* Header with BG Color instead of image */}
        <div className=" flex flex-col items-center py-6">
          <Image src={opxamazon} alt="image" className=" h-[91px]" />
        </div>

        {/* Body */}
        <div className="p-6 text-center">
          <h2 className="text-lg font-semibold mb-3">
            Your account is not yet connected to your Amazon seller account.
          </h2>

          <p className="text-gray-600 mb-6 text-sm">
            Please
            <Link href={amazonAuthUrl} target="_blank">
              <span className="text-primary underline cursor-pointer">
                {" "}
                log in{" "}
              </span>
            </Link>
            to connect or{" "}
            <Link
              href={"https://sellercentral.amazon.com/"}
              target="_blank"
            >
              <span className="text-primary underline cursor-pointer">
                create an account{" "}
              </span>
            </Link>
            if you do not have one, to ensure uninterrupted access to optisage.
          </p>

          <button
            onClick={onDontShowAgain}
            disabled={isSaving}
            className=" py-3 px-8 rounded-xl text-[#009F6D] border border-primary  hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving..." : "Don't show this again"}
          </button>
        </div>

        {/* Custom Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3  transition rounded-full p-1"
        >
          <HiMiniXMark size={26} />
        </button>
      </div>
    </Modal>
  );
};

export default AmazonConnectModal;
