import { Modal } from "antd";
import { AiOutlineStop } from "react-icons/ai";
interface modal{
    isCancelVisible:boolean,
    setIsCancelVisible: ()=> void,
    handleReason: ()=> void
}

export default function CancelModal({
    isCancelVisible,
    setIsCancelVisible,
    handleReason
}:modal){
   
    return (
        <>
        
        <Modal
         className="cancel-modal"
        title=""
        open={isCancelVisible}
        footer={null}
        maskClosable={false}
        width={400}
        closable={false}
        centered={true}
        
      >
        <div className=" space-y-5">
          <div className=" flex justify-center">
            <div className=" size-16 rounded-full bg-slate-100 place-content-center place-items-center">
           <AiOutlineStop color="#FD3E3E" size={40} />
           </div>
          </div>

          <div className=" text-center">
            <h1 className=" text-lg font-semibold">Cancel Subscription?</h1>
            <h1 className=" font-semibold text-sm">
            Are you sure you want to cancel your subscription, you will no longer receive pro services
            </h1>
          </div>
          <div className=" grid grid-cols-1 gap-4">
          <button
              className="px-4 py-2 !bg-[#FD3E3E] !text-white !rounded-lg !font-medium !h-[40px] border-none shadow-[0px_4px_8px_0px_#00000029]"
              onClick={handleReason}
            >
             Yes, Cancel Subscription
            </button>
            
            <button
              className="px-4 py-2 bg-white border rounded-lg font-medium !h-[40px] shadow-[0px_4px_8px_0px_#00000029]"
              onClick={setIsCancelVisible}
            >
            No, Don’t Cancel
            </button>

           
          </div>
        </div>
      </Modal>
      
      <style jsx global>{`
        .ant-modal-mask {
          backdrop-filter: blur(3px) !important;
          background-color: rgba(0, 0, 0, .5) !important;
        }
      `}</style>
        </>
      
    )
    
}

