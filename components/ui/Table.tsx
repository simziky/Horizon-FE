"use client";

import React, { useState } from "react";
import { BiChevronLeft, BiChevronRight } from "react-icons/bi";

export interface Column<T> {
  title: string;
  dataIndex: keyof T;
  render?: (value: T[keyof T], record: T) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  pageSize?: number;
}

const Table = <T extends object>({
  data,
  columns,
  pageSize = 5,
}: TableProps<T>) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(data.length / pageSize);
  const paginatedData = data.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="overflow-x-scroll overflow-y-hidden">
      <table className="w-full text-left border-collapse">
        <thead className="bg-neutral-100 border-b">
          <tr>
            {columns.map((col, index) => (
              <th
                key={index}
                className={`p-4 text-sm font-semibold text-neutral-700 min-w-[50px] ${
                  col.className || ""
                }`}
              >
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paginatedData.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="border-b hover:bg-neutral-50 transition"
            >
              {columns.map((col, colIndex) => (
                <td
                  key={colIndex}
                  className={`p-4 text-sm text-gray-600 ${col.className || ""}`}
                >
                  {col.render
                    ? col.render(row[col.dataIndex], row)
                    : (row[col.dataIndex] as React.ReactNode)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="flex items-center justify-center space-x-2 mt-4">
        {/* Previous Button */}
        <button
          aria-label="Previous"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`size-8 flex justify-center items-center rounded border ${
            currentPage === 1
              ? "text-neutral-400 border-neutral-300 cursor-not-allowed"
              : "text-neutral-700 border-neutral-400 hover:border-neutral-700"
          }`}
        >
          <BiChevronLeft className="size-5" />
        </button>

        {/* Page Numbers */}
        {Array.from({ length: totalPages }, (_, index) => index + 1).map(
          (page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`size-8 text-sm flex justify-center items-center rounded ${
                currentPage === page
                  ? "text-black border border-primary-400"
                  : "text-neutral-500 hover:border-neutral-700"
              }`}
            >
              {page}
            </button>
          )
        )}

        {/* Next Button */}
        <button
          aria-label="Next"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`size-8 flex justify-center items-center rounded border ${
            currentPage === totalPages
              ? "text-neutral-400 border-neutral-300 cursor-not-allowed"
              : "text-neutral-700 border-neutral-400 hover:border-neutral-700"
          }`}
        >
          <BiChevronRight className="size-5" />
        </button>
      </div>
    </div>
  );
};

export default Table;
