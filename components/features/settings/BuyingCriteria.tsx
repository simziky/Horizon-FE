import { CustomInput as Input } from "@/components/ui/AntdComponents";
import { useUpdateSettingsMutation } from "@/redux/api/user";
import { Button, message } from "antd";
import { useState, useEffect } from "react";
import { IoMdInformationCircleOutline } from "react-icons/io";

interface BuyingCriteriaProps {
  buyingCriteria: {
    maximum_bsr_percentage: number;
    minimum_roi_percentage: number;
    minimum_bsr_percentage: number;
    minimum_profit_percentage: number;
  };
}

const DEFAULT_BUYING_CRITERIA = {
  maximum_bsr_percentage: 0,
  minimum_roi_percentage: 0,
  minimum_bsr_percentage: 0,
  minimum_profit_percentage: 0,
};

const BuyingCriteria = ({ buyingCriteria }: BuyingCriteriaProps) => {
  const [saveSettings, { isLoading }] = useUpdateSettingsMutation();
  const [messageApi, contextHolder] = message.useMessage();
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});

  // Numeric form state
  const [formData, setFormData] = useState(DEFAULT_BUYING_CRITERIA);
  // String input state
  const [inputValues, setInputValues] = useState({
    maximum_bsr_percentage: "",
    minimum_roi_percentage: "",
    minimum_bsr_percentage: "",
    minimum_profit_percentage: "",
  });

  // Initialize states
  useEffect(() => {
    const initialData = buyingCriteria
      ? {
          maximum_bsr_percentage: buyingCriteria.maximum_bsr_percentage,
          minimum_roi_percentage: buyingCriteria.minimum_roi_percentage,
          minimum_bsr_percentage: buyingCriteria.minimum_bsr_percentage,
          minimum_profit_percentage: buyingCriteria.minimum_profit_percentage,
        }
      : DEFAULT_BUYING_CRITERIA;

    setFormData(initialData);
    setInputValues({
      maximum_bsr_percentage: initialData.maximum_bsr_percentage.toString(),
      minimum_roi_percentage: initialData.minimum_roi_percentage.toString(),
      minimum_bsr_percentage: initialData.minimum_bsr_percentage.toString(),
      minimum_profit_percentage:
        initialData.minimum_profit_percentage.toString(),
    });
  }, [buyingCriteria]);

  const handleInputChange = (
    field: keyof typeof inputValues,
    value: string
  ) => {
    if (/^(\d+)?([.]?\d*)?$/.test(value)) {
      setInputValues((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleBlur = (field: keyof typeof inputValues) => {
    const numericValue = parseFloat(inputValues[field]) || 0;
    setFormData((prev) => ({ ...prev, [field]: numericValue }));
  };

  const handleSaveSettings = () => {
    // Create field whitelist
    const allowedFields = [
      "maximum_bsr_percentage",
      "minimum_roi_percentage",
      "minimum_bsr_percentage",
      "minimum_profit_percentage",
    ];

    const updatedFields = allowedFields.reduce((acc, key) => {
      const formKey = key as keyof typeof formData;
      const originalValue =
        buyingCriteria?.[formKey] ?? DEFAULT_BUYING_CRITERIA[formKey];

      if (formData[formKey] !== originalValue) {
        acc[formKey] = formData[formKey];
      }
      return acc;
    }, {} as Partial<typeof formData>);

    if (Object.keys(updatedFields).length === 0) {
      messageApi.info("No changes made.");
      return;
    }

    saveSettings(updatedFields)
      .unwrap()
      .then(() => {
        messageApi.success("Buying Criteria Saved Successfully");
        setFormErrors({});
      })
      .catch((err) => {
        if (err.data?.errors) {
          setFormErrors(err.data.errors);
        }
        messageApi.error("Failed to save setting");
      });
  };

  return (
    <div className="flex flex-col gap-6">
      {contextHolder}
      {/* Minimum BSR */}
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 justify-between sm:items-center">
        <span className="flex flex-col gap-1 sm:min-w-[400px] max-w-[412px] text-[#C2C2CE]">
          <label htmlFor="mimimum-bsr" className=" text-[#01011D] font-medium">
            Minimum BSR
          </label>
          <p className="text-sm flex gap-1 items-center">
            <IoMdInformationCircleOutline className="size-4" /> Opitsage will
            highlight if the product meets this minimum best sellers rank
            requirement (as a percentage, within the category)
          </p>
        </span>
        <div className="flex flex-col gap-1 w-full">
          <Input
            id="minimum-bsr"
            className="px-3 py-2"
            value={inputValues.minimum_bsr_percentage}
            onChange={(e) =>
              handleInputChange("minimum_bsr_percentage", e.target.value)
            }
            onBlur={() => handleBlur("minimum_bsr_percentage")}
            status={formErrors.minimum_bsr_percentage ? "error" : ""}
          />
          {formErrors.minimum_bsr_percentage && (
            <div className="text-red-500 text-sm">
              {formErrors.minimum_bsr_percentage[0]}
            </div>
          )}
        </div>
      </div>

      {/* Maximum BSR */}
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 justify-between sm:items-center">
        <span className="flex flex-col gap-1 sm:min-w-[400px] max-w-[412px] text-[#C2C2CE]">
          <label htmlFor="maximum-bsr" className=" text-[#01011D] font-medium">
            Maximum BSR
          </label>
          <p className="text-sm flex gap-1 items-center">
            <IoMdInformationCircleOutline className="size-4" /> Opitsage will
            highlight if the product meets this maximum best sellers rank
            requirement (as a percentage, within the category)
          </p>
        </span>
        <div className="flex flex-col gap-1 w-full">
          <Input
            id="maximum-bsr"
            className="px-3 py-2"
            value={inputValues.maximum_bsr_percentage}
            onChange={(e) =>
              handleInputChange("maximum_bsr_percentage", e.target.value)
            }
            onBlur={() => handleBlur("maximum_bsr_percentage")}
            status={formErrors.maximum_bsr_percentage ? "error" : ""}
          />
          {formErrors.maximum_bsr_percentage && (
            <div className="text-red-500 text-sm">
              {formErrors.maximum_bsr_percentage[0]}
            </div>
          )}
        </div>
      </div>

      {/* Minimum Profit */}
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 justify-between sm:items-center">
        <span className="flex flex-col gap-1 sm:min-w-[400px] max-w-[412px] text-[#C2C2CE]">
          <label
            htmlFor="minimum-profit"
            className=" text-[#01011D] font-medium"
          >
            Minimum Profit
          </label>
          <p className="text-sm flex gap-1 items-center">
            <IoMdInformationCircleOutline className="size-4" /> Opitsage
            highlights if the product meets this minimum profit. Also used to
            calculate the max cost to meet this requirement.
          </p>
        </span>
        <div className="flex flex-col gap-1 w-full">
          <Input
            id="minimum-profit"
            className="px-3 py-2"
            value={inputValues.minimum_profit_percentage}
            onChange={(e) =>
              handleInputChange("minimum_profit_percentage", e.target.value)
            }
            onBlur={() => handleBlur("minimum_profit_percentage")}
            status={formErrors.minimum_profit_percentage ? "error" : ""}
          />
          {formErrors.minimum_profit_percentage && (
            <div className="text-red-500 text-sm">
              {formErrors.minimum_profit_percentage[0]}
            </div>
          )}
        </div>
      </div>

      {/* Minimum ROI */}
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 justify-between sm:items-center">
        <span className="flex flex-col gap-1 sm:min-w-[400px] max-w-[412px] text-[#C2C2CE]">
          <label htmlFor="minimum-roi" className=" text-[#01011D] font-medium">
            Minimum ROI
          </label>
          <p className="text-sm flex gap-1 items-center">
            <IoMdInformationCircleOutline className="size-4" /> Opitsage
            highlights if the product meets this minimum return on investment.
            Also used to calculate the max cost to meet this requirement.
          </p>
        </span>
        <div className="flex flex-col gap-1 w-full">
          <Input
            id="minimum-roi"
            className="px-3 py-2"
            value={inputValues.minimum_roi_percentage}
            onChange={(e) =>
              handleInputChange("minimum_roi_percentage", e.target.value)
            }
            onBlur={() => handleBlur("minimum_roi_percentage")}
            status={formErrors.minimum_roi_percentage ? "error" : ""}
          />
          {formErrors.minimum_roi_percentage && (
            <div className="text-red-500 text-sm">
              {formErrors.minimum_roi_percentage[0]}
            </div>
          )}
        </div>
      </div>

      <div>
        <Button
          htmlType="submit"
          className="!px-6 !py-2 !bg-primary !border-none hover:!bg-primary-hover !rounded-xl !text-white !text-sm !font-medium"
          onClick={handleSaveSettings}
          loading={isLoading}
        >
          Save
        </Button>
      </div>
    </div>
  );
};

export default BuyingCriteria;

