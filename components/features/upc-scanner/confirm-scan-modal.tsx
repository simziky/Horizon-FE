import { Modal } from "antd";
import { IoClose } from "react-icons/io5";
import ScanVector from "@/public/assets/svg/ufc-scan-vector.svg";

interface ConfirmScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const ConfirmScanModal = ({
  isOpen,
  onClose,
  onConfirm,
}: ConfirmScanModalProps) => {
  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      closeIcon={null}
      centered
      width={500}
      styles={{
        body: { padding: 0 },
        content: { padding: 0, borderRadius: 12, overflow: "hidden" },
      }}
    >
      <div className="relative">
        <div
          className="w-full h-[285px] bg-cover bg-center"
          style={{ backgroundImage: `url(${ScanVector.src})` }}
        />

        {/* Header */}
        <div className="absolute top-3 z-10 w-full flex items-center justify-between gap-8 px-4 border-b pb-3">
          <h4 className="text-[#0A0A0A] font-medium text-lg">
            Replace Product Scanner
          </h4>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-gray-500 hover:text-gray-700 bg-white p-2 rounded-full shadow-md shadow-[#00000026]"
          >
            <IoClose className="size-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="pb-6 p-4">
          <div className="bg-[#FAF5EC] rounded-2xl p-4 text-center flex flex-col gap-4">
            <p className="text-[#CA7D09] font-medium text-base max-w-[250px] mx-auto">
              Are you sure you want to run another scan?
            </p>
            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={onClose}
                className="bg-white rounded-[10px] px-6 py-2 text-black text-sm font-medium"
              >
                No
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="bg-[#FFC56E] border border-[#F6E6CF] rounded-[10px] px-6 py-2 text-black text-sm font-medium"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmScanModal;

