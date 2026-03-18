import { RiSearchLine } from "react-icons/ri";

interface SearchInputProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onKeyPress?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  className?: string;
}

const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = "Search for products on Amazon (For best results use specific keywords, UPC Code, ASIN or ISBN code)",
  value,
  onChange,
  onKeyPress,
  className = "",
}) => {
  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className={`w-full ${className}`}
    >
      <div className="relative z-0">
        <RiSearchLine className="absolute top-0 bottom-0 size-5 my-auto text-gray-400 left-3" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={onKeyPress}
          placeholder={placeholder}
          className="w-full py-2 pl-10 pr-4 text-[#52525B] text-sm border border-transparent rounded-[10px] outline-none bg-[#F4F4F5] focus:bg-white focus:border-primary-focused duration-200"
        />
      </div>
    </form>
  );
};

export default SearchInput;