interface ButtonProps {
  text: string;
  icon?: React.ReactNode;
  bgColor?: string;
  textColor?: string;
  borderColor?: string;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
}

const Button: React.FC<ButtonProps> = ({
  text,
  icon,
  bgColor = "",
  textColor = "text-neutral-700",
  borderColor = "border-neutral-300",
  className = "",
  onClick,
  type = "button",
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`w-max flex gap-2.5 items-center font-semibold p-2.5 rounded-lg border ${bgColor} ${textColor} ${borderColor} focus:outline-none focus:ring-1 focus:ring-offset-2 ${className}`}
    >
      {icon && <span>{icon}</span>}
      <span>{text}</span>
    </button>
  );
};

export default Button;
