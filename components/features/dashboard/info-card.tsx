export const InfoCard = ({
  icon,
  title,
  value,
  bgColor,
}: {
 icon: React.ReactNode
  title: React.ReactNode
  value: React.ReactNode | string
  bgColor?: string
}) => (
  <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
    <span
      className="size-12 rounded-lg flex items-center justify-center"
      style={{ backgroundColor: bgColor }}
    >
      {icon}
    </span>
    <span className="text-black text-sm">
      <p>{title}</p>
      <p className="text-xl font-semibold">{value}</p>
    </span>
  </div>
);
