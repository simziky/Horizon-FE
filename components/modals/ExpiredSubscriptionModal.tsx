"use client";

import { Modal } from "antd";
import { GoAlert } from "react-icons/go";
import Link from "next/link";

interface ExpiredSubscriptionModalProps {
  open: boolean;
  onLogout: () => void;
  subscribeHref: string;
}

const ExpiredSubscriptionModal = ({
  open,
  onLogout,
  subscribeHref,
}: ExpiredSubscriptionModalProps) => {
  return (
    <Modal
      title="Subscription Alert"
      open={open}
      footer={null}
      maskClosable={false}
      closable={false}
      centered={true}
    >
      <div className=" space-y-5">
        <div className=" flex justify-center">
          <GoAlert size={60} color="orange" />
        </div>

        <div className=" text-center">
          <h1 className=" font-semibold">
            Please be informed that your subscription has expired. To continue
            enjoying uninterrupted access to our services, please renew your
            subscription as soon as possible.
          </h1>
        </div>
        <div className=" grid grid-cols-2 gap-10">
          <button
            className="px-4 py-2 bg-gray-300 rounded-lg font-bold"
            onClick={onLogout}
          >
            Log Out
          </button>

          <Link
            href={subscribeHref}
            className=" hover:text-white text-center px-4 py-2 bg-green-500 text-white rounded-lg font-bold"
          >
            Subscribe Now
          </Link>
        </div>
      </div>
    </Modal>
  );
};

export default ExpiredSubscriptionModal;
