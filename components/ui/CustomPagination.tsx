import { IoMdArrowForward } from "react-icons/io";
import { IoMdArrowBack } from "react-icons/io";

interface CustomPaginationProps {
  onNext: () => void;
  onPrevious: () => void;
  hasNext: boolean;
  hasPrevious: boolean;
}

const CustomPagination: React.FC<CustomPaginationProps> = ({
  onNext,
  onPrevious,
  hasNext,
  hasPrevious,
}) => {
  return (
    <div className="p-4 border-t flex items-center gap-7 justify-center">
      <button
       type="button" 
        onClick={onPrevious}
        disabled={!hasPrevious}
        className="font-semibold px-4 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 flex gap-1 items-center"
      >
        <IoMdArrowBack  size={20}/>
        Previous 
      </button>
      <button
       type="button" 
        onClick={onNext}
        disabled={!hasNext}
        className="px-4 py-1 border font-semibold rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 flex gap-1 items-center"
      >
        Next <IoMdArrowForward size={20} />
      </button>
    </div>
  );
};

export default CustomPagination;