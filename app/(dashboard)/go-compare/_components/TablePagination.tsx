interface PaginationProps {
    page: number
    totalPages: number
    perPage?: number
    handlePageChange: (page: number) => void
    handlePerPageChange?: (value: number) => void
}

const TablePagination = ({ page, totalPages, handlePageChange }: PaginationProps) => {
    const pagesToShow = 5;
    const startPage = Math.max(1, page - Math.floor(pagesToShow / 2));
    const endPage = Math.min(totalPages, startPage + pagesToShow - 1);
    const adjustedStartPage = Math.max(1, endPage - pagesToShow + 1);

    // Generate array of page numbers to display
    const pageNumbers = [];
    for (let i = adjustedStartPage; i <= endPage; i++) {
        pageNumbers.push(i);
    }

    return (
        <div className="flex items-center justify-center px-4 py-3 flex-wrap border-t border-gray-200 pb-16">
            <div className="flex items-center space-x-2">
                {pageNumbers.map(pageNumber => (
                    <button
                        key={pageNumber}
                        onClick={() => handlePageChange(pageNumber)}
                        className={`h-9 w-9 border-gray-200 rounded-full text-sm flex items-center justify-center ${page === pageNumber ? "bg-green-600 text-white" : "hover:bg-gray-100 border"}`}
                    >
                        {pageNumber}
                    </button>
                ))}
            </div>
        </div>
    )
}

export default TablePagination