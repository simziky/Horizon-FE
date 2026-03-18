import { CustomRadio, CustomRadioGroup } from "@/components/ui/AntdComponents";
import { Button, Modal } from "antd";
import { useState } from "react";

interface modal {
  isReasonVisible: boolean;
  setIsReasonVisible: () => void,
  loading:boolean,
  handleCancelSubscription: (reason: string) => void; 
}

export default function CancelReason({
  isReasonVisible,
  setIsReasonVisible,
  loading,
  handleCancelSubscription
}: modal) {
  const [selectedReason, setSelectedReason] = useState("");
  const [otherReason, setOtherReason] = useState("");

  const handleProceed = () => {
    const reason = otherReason.trim() || selectedReason;
    if (reason) {
      handleCancelSubscription(reason);
      //setIsReasonVisible(); // Close modal
    }
  };
    
  return (
    <>
      <Modal
        className="cancel-modal"
        title="Reasons for cancellation"
        open={isReasonVisible}
        footer={null}
        maskClosable={false}
        width={400}
        closable={false}
        centered={true}
      >
        <div className=" space-y-5">
          <div className=" ">
            <CustomRadioGroup className=" w-full space-y-2"
            onChange={(e) => setSelectedReason(e.target.value)}
             value={selectedReason}
            >
            <div className=" w-full bg-[#F4F4F5] rounded-xl py-2 px-3">
              <CustomRadio className="" value="Too expensive">Too expensive</CustomRadio>
            </div>
            <div className=" w-full bg-[#F4F4F5] rounded-xl py-2 px-3">
              <CustomRadio value="I need more features">I need more features</CustomRadio>
            </div>
            <div className=" w-full bg-[#F4F4F5] rounded-xl py-2 px-3">
              <CustomRadio value="I found an alternative">I found an alternative</CustomRadio>
            </div>
            <div className=" w-full bg-[#F4F4F5] rounded-xl py-2 px-3">
              <CustomRadio className="" value="I no longer need it">I no longer need it</CustomRadio>
            </div>
            <div className=" w-full bg-[#F4F4F5] rounded-xl py-2 px-3">
              <CustomRadio value="Customer service was less than expected">Customer service was less than expected</CustomRadio>
            </div>
            <div className=" w-full bg-[#F4F4F5] rounded-xl py-2 px-3">
              <CustomRadio value="Ease of use was less than expected">Ease of use was less than expected</CustomRadio>
            </div>
            <div className=" w-full bg-[#F4F4F5] rounded-xl py-2 px-3">
              <CustomRadio value="Quality was less than expected">Quality was less than expected</CustomRadio>
            </div>
            </CustomRadioGroup>
          </div>

          <div>
            <h5>Others</h5>
            <textarea 
            className=" h-[50px] resize-none bg-[#F4F4F5] w-full p-2 focus:outline-none rounded-xl"
            placeholder="Please type here..."
            value={otherReason}
            onChange={(e) => setOtherReason(e.target.value)}
            />
          </div>

          <div className=" grid grid-cols-1 gap-4">
            <Button
              className="px-4 py-2 !bg-[#1E6B4F] !text-white !rounded-lg !font-medium !h-[40px] border-none shadow-[0px_4px_8px_0px_#00000029]"
              loading={loading}
              disabled={loading}
              onClick={handleProceed}
            >
              Proceed
            </Button>

            <button
              className="px-4 py-2 bg-white border rounded-lg font-medium !h-[40px] shadow-[0px_4px_8px_0px_#00000029]"
              onClick={setIsReasonVisible}
            >
              No, Don’t Cancel
            </button>
          </div>
        </div>
      </Modal>

      <style jsx global>{`
        .ant-modal-mask {
          backdrop-filter: blur(3px) !important;
          background-color: rgba(0, 0, 0, 0.5) !important;
        }
      `}</style>
    </>
  );
}
