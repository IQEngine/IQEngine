import React, { useCallback, useEffect, useState } from 'react';

export interface DataColumn {
  title: string;
  dataIndex: string;
}

export interface DataRow {
  [key: string]: any;
}

export interface TableProps {
  dataColumns: DataColumn[];
  dataRows: DataRow[];
}

export const DataTable = ({ dataColumns, dataRows }: TableProps) => {
  const [filterInput, setFilterInput] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [maxPage, setMaxPage] = useState(1);
  const [firstIndex, setFirstIndex] = useState(0);
  const [lastIndex, setLastIndex] = useState(0);
  const [currentPageData, setCurrentPageData] = useState(dataRows);
  const [filteredData, setFilteredData] = useState(dataRows);

  // Define a custom filtering function
  const filterRecursive = useCallback(
    (obj, filterInput) => {
      for (const key in obj) {
        const value = obj[key];

        if (typeof value === 'object' && value !== null) {
          if (Array.isArray(value)) {
            for (const item of value) {
              if (filterRecursive(item, filterInput)) {
                return true;
              }
            }
          } else {
            if (filterRecursive(value, filterInput)) {
              return true;
            }
          }
        } else if (String(value).toLowerCase().includes(filterInput.toLowerCase())) {
          return true;
        }
      }

      return false;
    },
    [filterInput]
  );

  useEffect(() => {
    setFilteredData(dataRows.filter((row) => filterRecursive(row, filterInput)));
  }, [dataRows, filterInput]);

  useEffect(() => {
    const max = Math.ceil(filteredData.length / pageSize) === 0 ? 1 : Math.ceil(filteredData.length / pageSize);
    setMaxPage(max);
  }, [filteredData, pageSize]);

  useEffect(() => {
    setFirstIndex((currentPage - 1) * pageSize);
  }, [currentPage, pageSize]);

  useEffect(() => {
    setLastIndex(firstIndex + pageSize);
  }, [firstIndex, pageSize]);

  useEffect(() => {
    setCurrentPageData(filteredData.slice(firstIndex, lastIndex));
  }, [filteredData, firstIndex, lastIndex]);

  return (
    <div>
      <div className="mb-4 flex flex-row justify-between items-center">
        <div className="flex flex-row items-center">
          <span className="mr-2">Show</span>
          <select
            className={`bg-base-100`}
            aria-label="page size"
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
            className={`bg-base-100 input input-autosize no-spin`}
            aria-label="filter"
            value={filterInput}
            onChange={(e) => {
              setFilterInput(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={`Search ${dataRows.length} records...`}
          />
        </div>
      </div>
      <table className="w-full text-left" aria-label="data table">
        <thead>
          <tr>
            {dataColumns?.map((column) => (
              <th key={column.dataIndex}>{column.title}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {currentPageData?.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {dataColumns?.map((column, colIndex) => (
                <td key={`${rowIndex}-${colIndex}`}>{row[column.dataIndex]}</td>
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
            aria-label="previous page"
            onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
            disabled={currentPage <= 1}
          >
            Prev
          </button>
          <button
            aria-label="next page"
            onClick={() => setCurrentPage((page) => Math.min(page + 1, maxPage))}
            disabled={currentPage >= maxPage}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataTable;
