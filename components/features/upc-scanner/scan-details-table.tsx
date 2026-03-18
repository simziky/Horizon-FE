"use client";

import { GoSearch } from "react-icons/go";
import { CustomTable as Table } from "@/components/ui/AntdComponents";
import type { ColumnsType } from "antd/es/table";
import { useMemo } from "react";

interface ProductCost {
  amount: string | null;
  currency: string;
}

interface ProductDetails {
  asin: string | null;
  title: string | null;
  fba_fee: string | null;
  referral_fee: string | null;
  storage_fee: string | null;
  net_profit: string | null;
  net_margin: string | null;
  roi: string | null;
  potential_winner: string | null;
  rank: string | null;
  amazon_instock_rate: string | null;
  number_of_fba: string | null;
  number_of_fbm: string | null;
  number_of_amz: string | null;
  estimated_monthly_sales: string | null;
  buy_box_equity: string | null;
  out_of_stock: number | null;
  dominant_seller: string | null;
}

interface ScanProduct {
  asin_upc: string;
  product_cost: ProductCost;
  selling_price: ProductCost;
  buy_box_price: ProductCost;
  product_details: ProductDetails;
}

interface ScanDetailsProps {
  products?: ScanProduct[];
  isLoading?: boolean;
}

/* ─── Helpers ────────────────────────────────────────────────────────── */

const formatCurrency = (cost: ProductCost | undefined) => {
  if (!cost || cost.amount === null) return "-";
  return `${cost.currency}${cost.amount}`;
};

const formatValue = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) return "-";
  return value.toString();
};

const parseNumeric = (value: string | number | null | undefined): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  return parseFloat(value.replace(/[^0-9.-]/g, "")) || 0;
};

const parsePrice = (cost: ProductCost | undefined): number => {
  if (!cost || cost.amount === null) return 0;
  return parseFloat(cost.amount) || 0;
};

/* ─── Row type for Ant Design ────────────────────────────────────────── */

type TableRow = ScanProduct & { _key: string };

/* ─── Component ──────────────────────────────────────────────────────── */

const ScanDetailsTable = ({ products = [], isLoading = false }: ScanDetailsProps) => {
  const tableData = useMemo<TableRow[]>(
    () => products.map((p, i) => ({ ...p, _key: `${p.asin_upc}-${i}` })),
    [products],
  );

  const columns = useMemo<ColumnsType<TableRow>>(() => [
    {
      title: <GoSearch className="size-4 text-gray-500" />,
      key: "icon",
      width: 44,
      fixed: "left",
      render: () => <GoSearch className="size-4 text-gray-500" />,
    },
    {
      title: "UPC / EAN",
      dataIndex: "asin_upc",
      key: "asin_upc",
      width: 150,
      fixed: "left",
      render: (v: string) => v,
    },
    {
      title: "Product Cost",
      key: "product_cost",
      width: 120,
      fixed: "left",
      render: (_: unknown, r: TableRow) => formatCurrency(r.product_cost),
    },
    {
      title: "Buy Box Price",
      key: "buy_box_price",
      width: 130,
      fixed: "left",
      sorter: (a: TableRow, b: TableRow) => parsePrice(a.buy_box_price) - parsePrice(b.buy_box_price),
      render: (_: unknown, r: TableRow) => formatCurrency(r.buy_box_price),
    },
    {
      title: "FBA Fee",
      key: "fba_fee",
      width: 110,
      sorter: (a: TableRow, b: TableRow) =>
        parseNumeric(a.product_details.fba_fee) - parseNumeric(b.product_details.fba_fee),
      render: (_: unknown, r: TableRow) => formatValue(r.product_details.fba_fee),
    },
    {
      title: "Referral Fee",
      key: "referral_fee",
      width: 110,
      render: (_: unknown, r: TableRow) => formatValue(r.product_details.referral_fee),
    },
    {
      title: "Storage Fee",
      key: "storage_fee",
      width: 110,
      sorter: (a: TableRow, b: TableRow) =>
        parseNumeric(a.product_details.storage_fee) - parseNumeric(b.product_details.storage_fee),
      render: (_: unknown, r: TableRow) => formatValue(r.product_details.storage_fee),
    },
    {
      title: "Net Profit",
      key: "net_profit",
      width: 110,
      sorter: (a: TableRow, b: TableRow) =>
        parseNumeric(a.product_details.net_profit) - parseNumeric(b.product_details.net_profit),
      render: (_: unknown, r: TableRow) => formatValue(r.product_details.net_profit),
    },
    {
      title: "Net Margin",
      key: "net_margin",
      width: 110,
      sorter: (a: TableRow, b: TableRow) =>
        parseNumeric(a.product_details.net_margin) - parseNumeric(b.product_details.net_margin),
      render: (_: unknown, r: TableRow) => formatValue(r.product_details.net_margin),
    },
    {
      title: "ROI",
      key: "roi",
      width: 90,
      sorter: (a: TableRow, b: TableRow) =>
        parseNumeric(a.product_details.roi) - parseNumeric(b.product_details.roi),
      render: (_: unknown, r: TableRow) => formatValue(r.product_details.roi),
    },
    {
      title: "Potential Winner",
      key: "potential_winner",
      width: 150,
      render: (_: unknown, r: TableRow) => (
        <div className="truncate max-w-full" title={formatValue(r.product_details.potential_winner)}>
          {formatValue(r.product_details.potential_winner)}
        </div>
      ),
    },
    {
      title: "Rank",
      key: "rank",
      width: 100,
      sorter: (a: TableRow, b: TableRow) =>
        parseNumeric(a.product_details.rank) - parseNumeric(b.product_details.rank),
      render: (_: unknown, r: TableRow) => formatValue(r.product_details.rank),
    },
    {
      title: "Amazon Instock Rate",
      key: "amazon_instock_rate",
      width: 165,
      sorter: (a: TableRow, b: TableRow) =>
        parseNumeric(a.product_details.amazon_instock_rate) - parseNumeric(b.product_details.amazon_instock_rate),
      render: (_: unknown, r: TableRow) => formatValue(r.product_details.amazon_instock_rate),
    },
    {
      title: "# FBA Sellers",
      key: "number_of_fba",
      width: 120,
      sorter: (a: TableRow, b: TableRow) =>
        parseNumeric(a.product_details.number_of_fba) - parseNumeric(b.product_details.number_of_fba),
      render: (_: unknown, r: TableRow) => formatValue(r.product_details.number_of_fba),
    },
    {
      title: "# FBM Sellers",
      key: "number_of_fbm",
      width: 120,
      sorter: (a: TableRow, b: TableRow) =>
        parseNumeric(a.product_details.number_of_fbm) - parseNumeric(b.product_details.number_of_fbm),
      render: (_: unknown, r: TableRow) => formatValue(r.product_details.number_of_fbm),
    },
    {
      title: "# AMZ Sellers",
      key: "number_of_amz",
      width: 120,
      render: (_: unknown, r: TableRow) => formatValue(r.product_details.number_of_amz),
    },
    {
      title: "Est. Monthly Sold",
      key: "estimated_monthly_sales",
      width: 145,
      sorter: (a: TableRow, b: TableRow) =>
        parseNumeric(a.product_details.estimated_monthly_sales) - parseNumeric(b.product_details.estimated_monthly_sales),
      render: (_: unknown, r: TableRow) => formatValue(r.product_details.estimated_monthly_sales),
    },
    {
      title: "Buy Box Equity",
      key: "buy_box_equity",
      width: 130,
      sorter: (a: TableRow, b: TableRow) =>
        parseNumeric(a.product_details.buy_box_equity) - parseNumeric(b.product_details.buy_box_equity),
      render: (_: unknown, r: TableRow) => formatValue(r.product_details.buy_box_equity),
    },
    {
      title: "Out of Stock",
      key: "out_of_stock",
      width: 110,
      render: (_: unknown, r: TableRow) => formatValue(r.product_details.out_of_stock),
    },
    {
      title: "Dominant Seller",
      key: "dominant_seller",
      width: 140,
      sorter: (a: TableRow, b: TableRow) =>
        (a.product_details.dominant_seller ?? "").localeCompare(b.product_details.dominant_seller ?? ""),
      render: (_: unknown, r: TableRow) => (
        <div className="truncate max-w-full" title={formatValue(r.product_details.dominant_seller)}>
          {formatValue(r.product_details.dominant_seller)}
        </div>
      ),
    },
    {
      title: "ASIN",
      key: "asin",
      width: 110,
      render: (_: unknown, r: TableRow) => formatValue(r.product_details.asin),
    },
    {
      title: "Title",
      key: "title",
      width: 400,
      render: (_: unknown, r: TableRow) => (
        <div className="truncate max-w-full" title={formatValue(r.product_details.title)}>
          {formatValue(r.product_details.title)}
        </div>
      ),
    },
  ], []);

  return (
    <Table
      columns={columns}
      dataSource={tableData}
      rowKey="_key"
      pagination={false}
      virtual
      scroll={{ x: "max-content", y: 600 }}
      loading={isLoading}
      className="custom-table"
      size="small"
    />
  );
};

export default ScanDetailsTable;
