import React from 'react';

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

const Table: React.FC<TableProps> = ({ columns, data }) => {
  return (
    <table className="tw-table-auto tw-w-full">
      <thead>
        <tr>
          {columns?.map((column) => (
            <th key={column.dataIndex} className="tw-px-4 tw-py-2">
              {column.title}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data?.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {columns?.map((column, colIndex) => (
              <td key={`${rowIndex}-${colIndex}`} className="tw-border tw-px-4 tw-py-2">
                {row[column.dataIndex]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default Table;
