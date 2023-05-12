import React, { useState } from 'react';

interface Column {
  title: string;
  dataIndex: string;
}

interface RowData {
  [key: string]: any;
}

interface TableProps {
  columns: Column[];
  data: RowData[];
}

export const Table = ({ columns, data }: TableProps) => {
  const [filterInput, setFilterInput] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Define a custom filtering function
  const filteredData = data.filter((row) =>
    Object.values(row).some((value) => String(value).toLowerCase().includes(filterInput.toLowerCase()))
  );

  // Calculate pagination variables
  const maxPage = Math.ceil(filteredData.length / pageSize);
  const firstIndex = (currentPage - 1) * pageSize;
  const lastIndex = firstIndex + pageSize;
  const currentPageData = filteredData.slice(firstIndex, lastIndex);

  return (
    <div>
      <div className="mb-4 flex flex-row justify-between items-center">
        <div className="flex flex-row items-center">
          <span className="mr-2">Show</span>
          <select
            className="px-2 py-1 text-white-700 rounded-md"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
          >
            {[10, 20, 30, 40, 50].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <span className="ml-2">entries</span>
        </div>
        <div>
          <input
            className="px-2 py-1 text-white-700 rounded-md"
            value={filterInput}
            onChange={(e) => {
              setFilterInput(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={`Search ${data.length} records...`}
          />
        </div>
      </div>
      <table className="table-auto w-full">
        <thead>
          <tr>
            {columns?.map((column) => (
              <th key={column.dataIndex} className="border bg-zinc-800 px-4 py-2">
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {currentPageData?.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {columns?.map((column, colIndex) => (
                <td key={`${rowIndex}-${colIndex}`} className="border px-4 py-2">
                  {row[column.dataIndex]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 flex flex-row justify-between items-center">
        <div>
          Page{' '}
          <strong>
            {currentPage} of {maxPage}
          </strong>{' '}
          ({filteredData.length} records)
        </div>
        <div className="flex flex-row">
          <button
            className="px-2 py-1 mr-2 text-white-700 rounded-md bg-zinc-800 hover:bg-zinc-500 disabled:opacity-50"
            onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
            disabled={currentPage === 1}
          >
            Prev
          </button>
          <button
            className="px-2 py-1 text-white-700 rounded-md bg-zinc-800 hover:bg-zinc-500 disabled:opacity-50"
            onClick={() => setCurrentPage((page) => Math.min(page + 1, maxPage))}
            disabled={currentPage === maxPage}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default Table;
