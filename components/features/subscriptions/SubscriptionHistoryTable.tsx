import { Table, Checkbox } from "antd";
import { useEffect, useState } from "react";
import { AiOutlineDownload } from "react-icons/ai";
import { FaFilePdf } from "react-icons/fa";

interface SubscriptionHistoryTableProps {
  tableData: {
    data: {
      data: {
        id: number;
        transaction_id: string;
        plan: string;
        date: string;
        date_text: string;
        amount: string;
        currency: string;
        card: {
          brand: string;
          last4: string;
        };
        email: string;
        status: string;
      }[];
    };
  };
  loading: boolean;
  convertPrice?: (price: string) => string;
}

export interface SubscriptionData {
  key: string;
  invoice: string;
  date: string;
  date_text: string;
  plan: string;
  amount: string;
  status: string;
  transaction_id: string;
  card: {
    brand: string;
    last4: string;
  };
  email: string;
}

const SubscriptionHistoryTable: React.FC<SubscriptionHistoryTableProps> = ({
  tableData,
  loading,
  //convertPrice,
}) => {
  const [data, setData] = useState<SubscriptionData[]>([]);

  useEffect(() => {
    if (tableData?.data) {
      const transformedData = tableData.data.data?.map((item) => ({
        key: item.id.toString(),
        invoice: `Invoice ${String(item.id).padStart(4, "0")}`,
        date: item.date,
        date_text: item.date_text,
        plan: item.plan,
        amount: item.amount,
        status: item.status,
        transaction_id: item.transaction_id,
        card: {
          brand: item.card.brand,
          last4: item.card.last4,
        },
        email: item.email,
      }));
      setData(transformedData);
    }
  }, [tableData]);

  const handleDownload = async (record: SubscriptionData) => {
    const { generateReceiptPdf } = await import("@/utils/generateReceiptPdf");
    generateReceiptPdf(record);
  };

  const columns = [
    {
      title: <Checkbox />,
      dataIndex: "checkbox",
      key: "checkbox",
      render: () => <Checkbox />,
    },
    {
      title: "Invoice History",
      dataIndex: "invoice",
      key: "invoice",
      render: (text: string) => (
        <div className="flex items-center gap-2">
          <FaFilePdf className="text-lg text-gray-500" />
          <span className="text-gray-600">{text}</span>
        </div>
      ),
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
    },
    {
      title: "Plan",
      dataIndex: "plan",
      key: "plan",
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
    },
    {
      title: "",
      dataIndex: "download",
      key: "download",
      render: (text: string, record: SubscriptionData) => (
        <AiOutlineDownload
          className="text-gray-500 text-lg cursor-pointer"
          onClick={() => void handleDownload(record)}
        />
      ),
    },
  ];

  return (
    <div className="overflow-x-scroll">
      <Table
        columns={columns}
        dataSource={data}
        pagination={false}
        loading={loading}
      />
    </div>
  );
};

export default SubscriptionHistoryTable;
