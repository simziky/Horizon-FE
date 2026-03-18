
//import { useAppSelector } from "@/redux/hooks";
import { Button, Modal } from "antd";


interface modal {
isRenewVisible: boolean;
setIsRenewVisible: () => void,
loading:boolean,
handleRenewSubscription: () => void; 
}

export default function RenewSubscriptionModal({
  isRenewVisible,
  setIsRenewVisible,
  loading,
  handleRenewSubscription
}: modal) {
  
 //const {payment_method } =useAppSelector((state) => state.api?.user) || {};
   
  return (
    <>
      <Modal
        className="cancel-modal"
        title="Renew Subscription"
        open={isRenewVisible}
        footer={null}
        maskClosable={false}
        width={400}
        closable={false}
        centered={true}
      >
        <div className=" space-y-5">
            <p></p>
          <p>
          your card will be charged at the end of your subscription
          </p>

          

          <div className=" grid grid-cols-1 gap-4">
            <Button
              className="px-4 py-2 !bg-[#1E6B4F] !text-white !rounded-lg !font-medium !h-[40px] border-none shadow-[0px_4px_8px_0px_#00000029]"
              loading={loading}
              disabled={loading}
              onClick={handleRenewSubscription}
            >
              Proceed
            </Button>

            <button
              className="px-4 py-2 bg-white border rounded-lg font-medium !h-[40px] shadow-[0px_4px_8px_0px_#00000029]"
              onClick={setIsRenewVisible}
            >
              No, Cancel
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
