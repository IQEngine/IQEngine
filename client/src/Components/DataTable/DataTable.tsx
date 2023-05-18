import React, { useState } from 'react';
import Button from '@/Components/Button/Button';
import { Table, Input, Select } from 'react-daisyui';

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

  // Define a custom filtering function
  const filteredData = dataRows.filter((row) =>
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
          <Select
            data-testid="pagesize"
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
          </Select>
          <span className="ml-2">entries</span>
        </div>
        <div>
          <Input
            value={filterInput}
            onChange={(e) => {
              setFilterInput(e.target.value);
              setCurrentPage(1);
            }}
            name="search"
            placeholder={`Search ${dataRows.length} records...`}
          />
        </div>
      </div>

      <Table>
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
      </Table>
      <div className="mt-4 flex flex-row justify-between items-center">
        <div>
          Page{' '}
          <strong>
            {currentPage} of {maxPage}
          </strong>{' '}
          ({filteredData.length} records)
        </div>
        <div className="flex flex-row">
          <Button onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))} disabled={currentPage === 1}>
            Prev
          </Button>
          <Button
            onClick={() => setCurrentPage((page) => Math.min(page + 1, maxPage))}
            disabled={currentPage === maxPage}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DataTable;
