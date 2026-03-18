"use client";

import { useState } from "react";
import { Modal } from "antd";
import { HiOutlineUserAdd } from "react-icons/hi";
import { FaFacebook, FaTwitter, FaWhatsapp, FaTelegram } from "react-icons/fa";
import { useAppSelector } from "@/redux/hooks";

const SocialReferralModal = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { username } = useAppSelector((state) => state.api?.user) || {};

  const referralLink = `https://optisage.ai/#pricing/?ref=${username}`; // Replace with dynamic link generation later
  const [copied, setCopied] = useState(false);

  const handleShare = (platform: string) => {
    let shareUrl = "";
    switch (platform) {
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          referralLink
        )}`;
        break;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(
          referralLink
        )}&text=Join%20optisage%20and%20earn%20rewards!`;
        break;
      case "whatsapp":
        shareUrl = `https://wa.me/?text=${encodeURIComponent(referralLink)}`;
        break;
      case "telegram":
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(
          referralLink
        )}&text=Join%20optisage%20and%20earn%20rewards!`;
        break;
      default:
        return;
    }
    window.open(shareUrl, "_blank");
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <>
      <div
        onClick={() => setIsModalOpen(true)}
        className="border border-border rounded-lg p-5 flex gap-4 items-center cursor-pointer hover:border-primary"
      >
        <span>
          <span className="size-[50px] flex items-center justify-center bg-[#F7F7F7] text-[#4B4B62] rounded-full">
            <HiOutlineUserAdd className="size-5" />
          </span>
        </span>
        <span className="flex flex-col gap-2">
          <h4 className="text-[#01011D] text-base font-medium">
            Invite and Earn
          </h4>
          <p className="text-[#4B4B62] text-xs">
            Invite other sellers to Optisage & help them succeed and unlock
            exclusive perks too!
          </p>
        </span>
      </div>

      <Modal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
      >
        <div className="flex flex-col gap-6">
          <span>
            <h3 className="text-black font-medium text-xl">
              Invite & Earn Rewards
            </h3>
            <p className="text-gray-600">
              Share this link with friends and earn rewards:
            </p>
          </span>
          <div className="flex items-center gap-3 mt-2 p-3 border rounded-lg bg-gray-100">
            <span className="flex-1 text-sm truncate">{referralLink}</span>
            <button
              onClick={copyToClipboard}
              className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-gray-600">Share via:</p>
            <div className="flex gap-3">
              <button
                aria-label="Facebook"
                type="button"
                onClick={() => handleShare("facebook")}
                className="p-3 rounded-full hover:bg-gray-50 shadow-sm hover:shadow-md transition duration-200"
              >
                <FaFacebook className="text-blue-600 size-6" />
              </button>
              <button
                aria-label="Twitter"
                type="button"
                onClick={() => handleShare("twitter")}
                className="p-3 rounded-full hover:bg-gray-50 shadow-sm hover:shadow-md transition duration-200"
              >
                <FaTwitter className="text-blue-400 size-6" />
              </button>
              <button
                aria-label="WhatsApp"
                type="button"
                onClick={() => handleShare("whatsapp")}
                className="p-3 rounded-full hover:bg-gray-50 shadow-sm hover:shadow-md transition duration-200"
              >
                <FaWhatsapp className="text-green-500 size-6" />
              </button>
              <button
                aria-label="Telegram"
                type="button"
                onClick={() => handleShare("telegram")}
                className="p-3 rounded-full hover:bg-gray-50 shadow-sm hover:shadow-md transition duration-200"
              >
                <FaTelegram className="text-blue-500 size-6" />
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default SocialReferralModal;
