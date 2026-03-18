"use client";

import React from "react";
import { Modal } from "antd";
import { IoMdClose } from "react-icons/io";
import Button from "@/components/ui/Button";

interface LogoutModalProps {
  openModal: boolean;
  setOpenModal: React.Dispatch<React.SetStateAction<boolean>>;
  handleLogout: () => void;
}

const LogoutModal: React.FC<LogoutModalProps> = ({
  openModal,
  setOpenModal,
  handleLogout,
}) => (
  <Modal
    open={openModal}
    onCancel={() => setOpenModal(false)}
    footer={null}
    centered
    width={400}
    closeIcon={null}
  >
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1.5">
        <span className="flex items-center gap-8 justify-between">
          <h2 className="text-xl font-semibold">Log Out</h2>
          <button
            type="button"
            onClick={() => setOpenModal(false)}
            aria-label="Close"
          >
            <IoMdClose className="text-neutral-700 size-6" />
          </button>
        </span>

        <p className="text-neutral-500 text-sm">
          Are you sure you want to log out?
        </p>
      </div>

      <div className="flex gap-3 items-center">
        <Button
          onClick={() => setOpenModal(false)}
          text="Cancel"
          className="px-4 py-2 flex-1 justify-center"
        />

        <Button
          onClick={() => {
            handleLogout();
            setOpenModal(false);
          }}
          text="Log Out"
          borderColor="border-transparent"
          bgColor="bg-error-700"
          textColor="text-white"
          className="px-4 py-2 flex-1 justify-center"
        />
      </div>
    </div>
  </Modal>
);

export default LogoutModal;
