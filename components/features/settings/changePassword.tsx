import { CustomPasswordInput } from "@/components/ui/AntdComponents";
import { Button, Modal } from "antd";
import { useFormik } from "formik";
import { changePasswordSchema } from "@/lib/validationSchema";
import { BsFillInfoCircleFill } from "react-icons/bs";
import { useEffect } from "react";
interface modal {
  isChangeVisible: boolean;
  setIsChangeVisible: () => void;
  proceed: (values: {
    current_password: string;
    password: string;
    password_confirmation: string;
  }) => void;
  loading: boolean;
  errors?: Record<string, string[]>;
}

export default function ChangePasswordModal({
  isChangeVisible,
  setIsChangeVisible,
  proceed,
  loading,
  errors,
}: modal) {
  const formik = useFormik({
    initialValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
    validationSchema: changePasswordSchema,
    onSubmit: (values) => {
      proceed({
        current_password: values.currentPassword,
        password: values.newPassword,
        password_confirmation: values.confirmNewPassword,
      }); // Handle successful submission
    },
  });

  useEffect(() => {
    if (errors) {
      // Convert snake_case keys to camelCase
      const formattedErrors = Object.entries(errors).reduce(
        (acc, [key, value]) => {
          const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
          return { ...acc, [camelKey]: value.join(" ") };
        },
        {}
      );

      formik.setErrors(formattedErrors);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errors]);

  return (
    <>
      <Modal
        className="cancel-modal"
        title="Change Password"
        open={isChangeVisible}
        footer={null}
        maskClosable={false}
        width={500}
        onCancel={setIsChangeVisible}
        centered={true}
      >
        <form onSubmit={formik.handleSubmit} className=" space-y-5 py-3">
          <div className=" flex gap-1 items-center">
            <BsFillInfoCircleFill color="#64748b" />
            <span className=" text-xs text-slate-500">
              You will be required to login again
            </span>
          </div>
          <div>
            <label>
              <span className=" text-sm font-semibold">Current Password</span>
              <CustomPasswordInput
                name="currentPassword"
                className=" !bg-[#F4F4F5] h-[45px] !border-none"
                placeholder="******"
                value={formik.values.currentPassword}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
            </label>
            {formik.touched.currentPassword &&
              formik.errors.currentPassword && (
                <p className="text-red-500 text-xs">
                  {formik.errors.currentPassword}
                </p>
              )}
          </div>

          <div>
            <label>
              <span className=" text-sm font-semibold">New Password</span>
              <CustomPasswordInput
                name="newPassword"
                className=" !bg-[#F4F4F5] h-[45px] !border-none"
                placeholder="******"
                value={formik.values.newPassword}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
            </label>
            {formik.touched.newPassword && formik.errors.newPassword && (
              <p className="text-red-500 text-xs">
                {formik.errors.newPassword}
              </p>
            )}
          </div>
          <div>
            <label>
              <span className=" text-sm font-semibold">Retype Password</span>
              <CustomPasswordInput
                name="confirmNewPassword"
                className=" !bg-[#F4F4F5] h-[45px] !border-none"
                placeholder="******"
                value={formik.values.confirmNewPassword}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
            </label>
            {formik.touched.confirmNewPassword &&
              formik.errors.confirmNewPassword && (
                <p className="text-red-500 text-xs">
                  {formik.errors.confirmNewPassword}
                </p>
              )}
          </div>

          <Button
            htmlType="submit"
            className=" w-full !bg-[#1E6B4F] !text-white !text-sm !font-semibold"
            loading={loading}
            disabled={loading}
          >
            Proceed
          </Button>
        </form>
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
