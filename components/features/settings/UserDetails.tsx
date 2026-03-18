import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  CustomSwitch as Switch,
  CustomInput as Input,
  CustomPasswordInput,
} from "@/components/ui/AntdComponents";
import { IoMdInformationCircleOutline } from "react-icons/io";
import { useUpdateSettingsMutation } from "@/redux/api/user";
import { Button, message } from "antd";
import { useChangePasswordMutation } from "@/redux/api/auth";
//import { password } from "@/lib/validationSchema";
import { FaCheckCircle } from "react-icons/fa";
import { useRouter } from "next/navigation";

interface FormErrors {
  [key: string]: string[];
}

interface UserData {
  email: string;
  misc_fee: number;
  misc_fee_percentage: number;
  inbound_shipping: number;
  prep_fee: number;
  vat: {
    toggle: boolean;
    flat_rate: { rate: number };
    standard_rate: { rate: number; reduced_rate: number };
  };
}

interface UserDetailsProps {
  userData?: {
    email?: string;
    misc_fee?: number;
    misc_fee_percentage?: number;
    inbound_shipping?: number;
    prep_fee?: number;
    vat?: {
      toggle?: boolean;
      flat_rate?: { rate?: number };
      standard_rate?: { rate?: number; reduced_rate?: number };
    };
  };
}

const defaultUserData: UserData = {
  email: "",

  misc_fee: 0,
  misc_fee_percentage: 0,
  inbound_shipping: 0,
  prep_fee: 0,
  vat: {
    toggle: true,
    flat_rate: { rate: 0 },
    standard_rate: { rate: 0, reduced_rate: 0 },
  },
};

const ChangePasswordModal = dynamic(() => import("./changePassword"), {
  ssr: false,
});

const UserDetails = ({ userData }: UserDetailsProps) => {
  const router = useRouter();
  //const [vatEnabled, setVatEnabled] = useState(true);
  const [ChangeVisible, setChangeVisible] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [vatType, setVatType] = useState<"standard" | "flat">("flat");
  const [saveSettings, { isLoading }] = useUpdateSettingsMutation();
  const [changePassword, { isLoading: passwordLoading }] =
    useChangePasswordMutation();
  const [changePasswordErrors, setChangePasswordErrors] =
    useState<Record<string, string[]>>();
  const [messageApi, contextHolder] = message.useMessage();

  const deepMerge = (target: any, source: any): any => {
    const merged = { ...target };
    for (const key of Object.keys(source)) {
      if (source[key] instanceof Object && !Array.isArray(source[key])) {
        merged[key] = deepMerge(merged[key] || {}, source[key]);
      } else {
        merged[key] = source[key] !== undefined ? source[key] : merged[key];
      }
    }
    return merged;
  };

  const [formData, setFormData] = useState<UserData>(() =>
    deepMerge(defaultUserData, userData || {})
  );
  const [initialData, setInitialData] = useState<UserData>(() =>
    deepMerge(defaultUserData, userData || {})
  );

  // Local input state (strings)
  const [inputValues, setInputValues] = useState({
    prep_fee: userData?.prep_fee?.toString() || "0",
    misc_fee: userData?.misc_fee?.toString() || "0",
    // misc_fee_percentage: userData?.misc_fee_percentage?.toString() || "0",
    inbound_shipping: userData?.inbound_shipping?.toString() || "0",
    vat_standard_rate: userData?.vat?.standard_rate?.rate?.toString() || "0",
    vat_reduced_rate:
      userData?.vat?.standard_rate?.reduced_rate?.toString() || "0",
    vat_flat_rate: userData?.vat?.flat_rate?.rate?.toString() || "0",
  });

  // Sync input values when formData changes
  useEffect(() => {
    setInputValues({
      prep_fee: formData.prep_fee.toString(),
      misc_fee: formData.misc_fee.toString(),
      // misc_fee_percentage: formData.misc_fee_percentage.toString(),
      inbound_shipping: formData.inbound_shipping.toString(),
      vat_standard_rate: formData.vat.standard_rate.rate.toString(),
      vat_reduced_rate: formData.vat.standard_rate.reduced_rate.toString(),
      vat_flat_rate: formData.vat.flat_rate.rate.toString(),
    });
  }, [formData]);

  useEffect(() => {
    const merged = deepMerge(defaultUserData, userData || {});
    setFormData(merged);
    setInitialData(merged);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData]);
  // Handle text input changes
  const handleInputChange = (field: string, value: string) => {
    // Allow numbers and decimals only
    if (/^(\d+)?([.]?\d*)?$/.test(value)) {
      setInputValues((prev) => ({ ...prev, [field]: value }));
    }
  };

  // Convert to number on blur
  const handleBlur = (field: keyof typeof inputValues) => {
    const numericValue = parseFloat(inputValues[field]) || 0;

    if (field.startsWith("vat_")) {
      const rateType = vatType === "standard" ? "standard_rate" : "flat_rate";
      // Define a mapping between the field and the correct key name.
      const fieldMapping: { [key: string]: string } = {
        vat_standard_rate: "rate",
        vat_reduced_rate: "reduced_rate",
        vat_flat_rate: "rate",
      };
      const keyToUpdate = fieldMapping[field];

      setFormData((prev) => ({
        ...prev,
        vat: {
          ...prev.vat,
          [rateType]: {
            ...prev.vat[rateType],
            [keyToUpdate]: numericValue,
          },
        },
      }));

      setInputValues((prev) => ({
        ...prev,
        [field]: numericValue.toString(),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: numericValue,
      }));
    }
  };

  // Helper function to calculate differences between two objects.
  const getChangedValues = (initial: any, current: any) => {
    const diff: any = {};
    Object.keys(current).forEach((key) => {
      if (key === "vat") {
        // If any property within vat has changed, include the entire vat object.
        if (JSON.stringify(initial.vat) !== JSON.stringify(current.vat)) {
          diff.vat = current.vat;
        }
      } else if (typeof current[key] === "object" && current[key] !== null) {
        const nestedDiff = getChangedValues(initial[key] || {}, current[key]);
        if (Object.keys(nestedDiff).length > 0) {
          diff[key] = nestedDiff;
        }
      } else if (current[key] !== initial[key]) {
        diff[key] = current[key];
      }
    });
    return diff;
  };

  const handleSaveUser = () => {
    const changedValues = getChangedValues(initialData, formData);
    saveSettings(changedValues)
      .unwrap()
      .then(() => {
        messageApi.success("Your User Details Saved.");
        setInitialData(formData);
        setFormErrors({});
      })
      .catch((err) => {
        if (err.data?.errors) {
          setFormErrors(err.data.errors);
        }
        messageApi.error("Failed to Save Details");
      });
  };

  const success = () => {
    messageApi.open({
      type: "success",
      content: "Your password was updated successfully",
      icon: <FaCheckCircle color=" #009163" size={20} className=" mr-2" />,
      className: "custom-class",
      style: {
        marginTop: "10vh",
        fontSize: 16,
      },
    });
  };

  const handleCloseModal = () => {
    setChangeVisible(false);
    setChangePasswordErrors(undefined); // Clear errors when closing
  };

  return (
    <div className="flex flex-col gap-6">
      {contextHolder}
      {/* Email Address */}
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 justify-between sm:items-center">
        <span className="flex flex-col gap-1 sm:min-w-[400px] max-w-[412px] text-[#C2C2CE]">
          <label htmlFor="email" className="text-[#01011D] font-medium">
            Email Address<span className="text-red-500">*</span>
          </label>
        </span>
        <Input
          id="email"
          type="email"
          placeholder="Tunde@yahoo.com"
          className="px-3 py-2"
          disabled
          value={formData?.email}
        />
      </div>

      {/* Password */}
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 justify-between sm:items-center">
        <span className="flex flex-col gap-1 sm:min-w-[400px] max-w-[412px] text-[#C2C2CE]">
          <label htmlFor="password" className="text-[#01011D] font-medium">
            Password
          </label>
          <p className="text-sm flex gap-1 items-center">
            <IoMdInformationCircleOutline className="size-4" />
            To change your password,{" "}
            <button
              type="button"
              className="underline"
              onClick={() => setChangeVisible(true)}
            >
              click here
            </button>
          </p>
        </span>

        <CustomPasswordInput
          id="password"
          placeholder="******"
          className="px-3 py-2"
          disabled
        />
      </div>

      {/* VAT Scheme Toggle */}
      <div className="flex items-center gap-2">
        <p className="font-medium flex items-center gap-1">
          Sales Tax<span className="text-red-500">*</span>{" "}
          <span className="text-sm text-[#787891] flex items-center gap-1">
            (optional){" "}
            <button type="button" aria-label="Info">
              <IoMdInformationCircleOutline className="size-4" />
            </button>
          </span>
        </p>
        <Switch
          checked={formData.vat.toggle}
          onChange={(checked: boolean) =>
            setFormData((prev) => ({
              ...prev,
              vat: {
                ...prev.vat,
                toggle: checked,
              },
            }))
          }
        />
      </div>

      {/* VAT Type Selection */}
      {formData.vat.toggle && (
        <div className="bg-[#F7F7F7] border border-border rounded-2xl p-4 flex flex-col gap-1">
          <label className="font-medium">
            Sales Tax<span className="text-red-500">*</span>
          </label>

          <div className="flex flex-col gap-6">
            <div className="flex justify-between gap-2">
              {/* <button
                type="button"
                className={`flex-1 p-1.5 rounded-md border border-border text-sm font-medium ${
                  vatType === "standard" ? "bg-white" : "text-gray-600"
                }`}
                onClick={() => setVatType("standard")}
              >
                Standard Rate
              </button> */}
              <button
                type="button"
                className={`flex-1 p-1.5 rounded-md border border-border text-sm font-medium ${
                  vatType === "flat" ? "bg-white" : "text-gray-600"
                }`}
                onClick={() => setVatType("flat")}
              >
                Flat Rate
              </button>
            </div>

            {/* VAT Rate Fields */}
            {/* {vatType === "standard" && (
              <div className="grid grid-cols-2 gap-4">
                <span className="flex flex-col gap-4">
                  <label
                    htmlFor="standard-rates"
                    className="text-sm font-medium"
                  >
                    Standard Rate(%)
                  </label>
                  <div className="flex flex-col gap-1 w-full">
                    <Input
                      id="standard-rates"
                      className="px-3 py-2"
                      value={inputValues.vat_standard_rate}
                      onChange={(e) =>
                        handleInputChange("vat_standard_rate", e.target.value)
                      }
                      onBlur={() => handleBlur("vat_standard_rate")}
                      status={
                        formErrors["vat.standard_rate.rate"] ? "error" : ""
                      }
                    />
                    {formErrors["vat.standard_rate.rate"] && (
                      <div className="text-red-500 text-sm">
                        {formErrors["vat.standard_rate.rate"][0]}
                      </div>
                    )}
                  </div>
                </span>
                <span className="flex flex-col gap-4">
                  <label
                    htmlFor="reduced-rates"
                    className="text-sm font-medium"
                  >
                    Reduced Rate(%)
                  </label>
                  <div className="flex flex-col gap-1 w-full">
                    <Input
                      id="reduced-rate"
                      className="px-3 py-2"
                      value={inputValues.vat_reduced_rate}
                      onChange={(e) =>
                        handleInputChange("vat_reduced_rate", e.target.value)
                      }
                      onBlur={() => handleBlur("vat_reduced_rate")}
                      status={
                        formErrors["vat.standard_rate.reduced_rate"]
                          ? "error"
                          : ""
                      }
                    />
                    {formErrors["vat.standard_rate.reduced_rate"] && (
                      <div className="text-red-500 text-sm">
                        {formErrors["vat.standard_rate.reduced_rate"][0]}
                      </div>
                    )}
                  </div>
                </span>
              </div>
            )} */}

            {vatType === "flat" && (
              <div>
                <span className="flex flex-col gap-4">
                  <label htmlFor="flat-rate" className="text-sm font-medium">
                    Flat rate(%)
                  </label>
                  <div className="flex flex-col gap-1 w-full">
                    <Input
                      id="flat-rate"
                      className="px-3 py-2"
                      value={inputValues.vat_flat_rate}
                      onChange={(e) =>
                        handleInputChange("vat_flat_rate", e.target.value)
                      }
                      onBlur={() => handleBlur("vat_flat_rate")}
                      status={formErrors["vat.flat_rate.rate"] ? "error" : ""}
                    />
                    {formErrors["vat.flat_rate.rate"] && (
                      <div className="text-red-500 text-sm">
                        {formErrors["vat.flat_rate.rate"][0]}
                      </div>
                    )}
                  </div>
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* others */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 justify-between sm:items-center">
          <span className="flex flex-col gap-1 sm:min-w-[400px] max-w-[412px] text-[#C2C2CE]">
            <span className="text-sm text-[#787891] flex items-center gap-1">
              <label
                htmlFor="prep-fee"
                className="text-base text-[#01011D] font-medium"
              >
                Prep Fee
              </label>
              (optional)
            </span>
            <p className="text-sm flex gap-1 items-center">
              <IoMdInformationCircleOutline className="size-4" /> Fees if using
              a prep centre for FBA, to include in calculations.
            </p>
          </span>

          <div className="flex flex-col gap-1 w-full">
            <Input
              id="prep-fee"
              type="text"
              value={inputValues.prep_fee}
              onChange={(e) => handleInputChange("prep_fee", e.target.value)}
              onBlur={() => handleBlur("prep_fee")}
              className="px-3 py-2"
              status={formErrors.prep_fee ? "error" : ""}
            />
            {formErrors.prep_fee && (
              <div className="text-red-500 text-xs">
                {formErrors.prep_fee[0]}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 justify-between sm:items-center">
          <span className="flex flex-col gap-1 sm:min-w-[400px] max-w-[412px] text-[#C2C2CE]">
            <span className="text-sm text-[#787891] flex items-center gap-1">
              <label
                htmlFor="misc-fee"
                className="text-base text-[#01011D] font-medium"
              >
                Misc Fee
              </label>
              (optional)
            </span>
            <p className="text-sm flex gap-1 items-center">
              <IoMdInformationCircleOutline className="size-4" /> Any other per
              item costs to include in calculations
            </p>
          </span>

          <div className="flex flex-col gap-1 w-full">
            <Input
              id="misc-fee"
              type="text"
              value={inputValues.misc_fee}
              onChange={(e) => handleInputChange("misc_fee", e.target.value)}
              onBlur={() => handleBlur("misc_fee")}
              className="px-3 py-2"
              status={formErrors.misc_fee ? "error" : ""}
            />
            {formErrors.misc_fee && (
              <div className="text-red-500 text-sm">
                {formErrors.misc_fee[0]}
              </div>
            )}
          </div>
        </div>

        {/* <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 justify-between sm:items-center">
          <span className="flex flex-col gap-1 sm:min-w-[400px] max-w-[412px] text-[#C2C2CE]">
            <label
              htmlFor="misc-fee-percent"
              className=" text-[#01011D] font-medium"
            >
              Misc Fee %
            </label>

            <p className="text-sm flex gap-1 items-center">
              <IoMdInformationCircleOutline className="size-4" /> Any other per
              item cost, as a percentage of the product cost,to include in
              calculations
            </p>
          </span>

          <div className="flex flex-col gap-1 w-full">
            <Input
              id="misc-fee-percent"
              defaultValue="$0.00"
              className="px-3 py-2"
              value={inputValues.misc_fee_percentage}
              onChange={(e) =>
                handleInputChange("misc_fee_percentage", e.target.value)
              }
              onBlur={() => handleBlur("misc_fee_percentage")}
              status={formErrors.misc_fee_percentage ? "error" : ""}
            />
            {formErrors.misc_fee_percentage && (
              <div className="text-red-500 text-sm">
                {formErrors.misc_fee_percentage[0]}
              </div>
            )}
          </div>
        </div> */}

        <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 justify-between sm:items-center">
          <span className="flex flex-col gap-1 sm:min-w-[400px] max-w-[412px] text-[#C2C2CE]">
            <span className="text-sm text-[#787891] flex items-center gap-1">
              <label
                htmlFor="inbound-shipping"
                className="text-base text-[#01011D] font-medium"
              >
                Inbound Shipping
              </label>
              (optional)
            </span>
            <p className="text-sm flex gap-1 items-center">
              <IoMdInformationCircleOutline className="size-4" /> Your FBA
              inbound shipping rates to include in calculations
            </p>
          </span>
          <div className="flex flex-col gap-1 w-full">
            <Input
              id="inbound-shipping"
              defaultValue="$0.00"
              className="px-3 py-2"
              value={inputValues.inbound_shipping}
              onChange={(e) =>
                handleInputChange("inbound_shipping", e.target.value)
              }
              onBlur={() => handleBlur("inbound_shipping")}
              status={formErrors.inbound_shipping ? "error" : ""}
            />
            {formErrors.inbound_shipping && (
              <div className="text-red-500 text-sm">
                {formErrors.inbound_shipping[0]}
              </div>
            )}
          </div>
        </div>

        <div className=" flex justify-between items-center">
          <Button
            htmlType="submit"
            className="!px-6 !py-2 !bg-primary !border-none hover:!bg-primary-hover !rounded-xl !text-white !text-sm !font-medium"
            loading={isLoading}
            onClick={handleSaveUser}
          >
            Save
          </Button>
        </div>
      </div>

      {ChangeVisible && (
        <ChangePasswordModal
          isChangeVisible={ChangeVisible}
          setIsChangeVisible={handleCloseModal}
          loading={passwordLoading}
          errors={changePasswordErrors}
          proceed={(values) => {
            changePassword(values)
              .unwrap()
              .then(() => {
                success();
                setChangeVisible(false);
                // Redirect after 2 seconds to allow message display
                setTimeout(() => router.replace("/"), 2000);
              })
              .catch((err) => {
                messageApi.error(
                  err.data?.message || "Failed to change password"
                );
                setChangePasswordErrors(err.data?.errors);
              });
          }}
        />
      )}

      <style jsx global>{`
        .custom-class > .ant-message-notice-content {
          background-color: #fffae6 !important;
        }
      `}</style>
    </div>
  );
};

export default UserDetails;

