/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import {
  ConfigProvider,
  Button,
  ButtonProps,
  Input,
  CheckboxProps,
  Checkbox,
  TableProps,
  Table,
  Tabs,
  DatePicker,
  Steps,
  Select,
  Switch,
  Radio,
  RadioProps,
  RadioGroupProps,
  Calendar,
  CalendarProps,
  Slider,
} from "antd";
import type { Dayjs } from "dayjs";
import { InputProps, PasswordProps } from "antd/es/input";
import React from "react";
import Search from "antd/es/input/Search";
import { AiOutlineFilter } from "react-icons/ai";
import TextArea from "antd/es/input/TextArea";

const primaryConfig = {
  fontFamily: "Inter, sans-serif",
  colorPrimary: "#18CB96",
};

export const CustomButton = ({ ...props }: ButtonProps) => (
  <ConfigProvider theme={{ token: { ...primaryConfig, borderRadius: 5 } }}>
    <Button {...props} />
  </ConfigProvider>
);
export const CustomPasswordInput = ({ ...props }: PasswordProps) => (
  <ConfigProvider
    theme={{
      token: {
        ...primaryConfig,
      },
    }}
  >
    <Input.Password {...props} />
  </ConfigProvider>
);

export const CustomInput = ({ ...props }: InputProps) => (
  <ConfigProvider
    theme={{
      token: { ...primaryConfig },
    }}
  >
    <Input {...props} />
  </ConfigProvider>
);

export const CustomCheckbox = ({ ...props }: CheckboxProps) => (
  <ConfigProvider
    theme={{
      token: { ...primaryConfig },
    }}
  >
    <Checkbox {...props} />
  </ConfigProvider>
);
export const CustomTable = ({ ...props }: TableProps<any>) => (
  <ConfigProvider
    theme={{
      token: {
        ...primaryConfig,
        borderRadius: 5,
      },
    }}
  >
    <Table
      {...props}
      pagination={{
        className: "custom-pagination",
      }}
      rowClassName={(record, index) => (index % 2 === 1 ? "even-row" : "")}
    />
  </ConfigProvider>
);

export const CustomCalender = ({ ...props }: CalendarProps<Dayjs>) => (
  <ConfigProvider
    theme={{
      token: {
        ...primaryConfig,
        borderRadius: 5,
      },
    }}
  >
    <Calendar {...props} />
  </ConfigProvider>
);

export const CustomTabs = ({ ...props }) => (
  <ConfigProvider
    theme={{
      token: { ...primaryConfig },
      components: {
        Tabs: {
          itemSelectedColor: "#000000",
          itemActiveColor: "#000000",
          itemColor: "#000000",
          fontSize: 16,
          fontWeightStrong: 600,
          colorBgContainer: "#F3F4F8",
        },
      },
    }}
  >
    <Tabs {...props} className="custom-tabs" />{" "}
  </ConfigProvider>
);
export const CustomDatePicker = ({ ...props }) => (
  <ConfigProvider
    theme={{
      token: {
        ...primaryConfig,
      },
    }}
  >
    <DatePicker
      {...props}
      placeholder="Select Date"
      suffixIcon={<AiOutlineFilter />}
      className="custom-date-picker"
    />
  </ConfigProvider>
);
export const CustomRadio = ({ ...props }: RadioProps) => (
  <ConfigProvider
    theme={{
      token: {
        ...primaryConfig,
      },
      components: {
        Radio: {
          colorPrimary: "#02434A",
          fontSize: 14,
        },
      },
    }}
  >
    <Radio {...props} />
  </ConfigProvider>
);

export const CustomRadioGroup = ({ ...props }: RadioGroupProps) => (
  <ConfigProvider
    theme={{
      token: {
        ...primaryConfig,
      },
      components: {
        Radio: {
          colorPrimary: "#5B0D1B",
        },
      },
    }}
  >
    <Radio.Group {...props} />
  </ConfigProvider>
);
export const CustomSearch = ({ ...props }) => (
  <ConfigProvider
    theme={{
      token: { ...primaryConfig },
      components: {},
    }}
  >
    <Search {...props} />
  </ConfigProvider>
);
export const CustomSteps = ({ ...props }) => (
  <ConfigProvider
    theme={{
      token: { ...primaryConfig },
      components: {},
    }}
  >
    <Steps {...props} />
  </ConfigProvider>
);

export const CustomSelect = ({
  children,
  ...props
}: {
  children?: React.ReactNode;
  [key: string]: any;
}) => (
  <ConfigProvider
    theme={{
      token: {
        ...primaryConfig,
      },
      components: {
        Select: {
          borderRadius: 10,
        },
      },
    }}
  >
    <Select
      {...props}
      popupMatchSelectWidth={true}
       popupClassName="custom-select-dropdown"
      virtual={false}
      dropdownStyle={{
        maxHeight: 300,
        overflowY: "auto",
        willChange: "transform",
      }}
      getPopupContainer={(trigger) => trigger.parentElement as HTMLElement}
    >
      {children}
    </Select>
  </ConfigProvider>
);

export const Customtextarea = ({ ...props }) => (
  <ConfigProvider
    theme={{
      token: { ...primaryConfig },
      components: {},
    }}
  >
    <TextArea {...props} />
  </ConfigProvider>
);

export const CustomSwitch = ({ ...props }) => (
  <ConfigProvider
    theme={{
      token: { ...primaryConfig },
      components: {},
    }}
  >
    <Switch {...props} />
  </ConfigProvider>
);

export const CustomSlider = ({ ...props }) => (
  <ConfigProvider
    theme={{
      token: { ...primaryConfig },
      components: {},
    }}
  >
    <Slider {...props} />
  </ConfigProvider>
);

