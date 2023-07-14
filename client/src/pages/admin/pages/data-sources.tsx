import { DataSource } from '@/api/Models';
import { useGetDatasources } from '@/api/datasource/hooks/use-get-datasources';
import React from 'react';
import DataTable from '@/features/ui/data-table/DataTable';
interface DataSourceRowProps {
  dataSource: DataSource;
}

export const DataSourceRow = ({ dataSource }: DataSourceRowProps) => {
  return (
    <tr>
      <td>{dataSource.name}</td>
      <td>{dataSource.type}</td>
      <td>{dataSource.account}</td>
      <td>{dataSource.container}</td>
      <td>
        <img src={dataSource.imageURL} alt={dataSource.description} />
      </td>
      <td>{dataSource.description}</td>
    </tr>
  );
};

export const DataSources = () => {
  const { apiQuery, blobQuery } = useGetDatasources();
  const originalColumns = [
    { title: 'Name', dataIndex: 'name' },
    { title: 'Type', dataIndex: 'type' },
    { title: 'Account', dataIndex: 'account' },
    { title: 'Container', dataIndex: 'container' },
    { title: 'Image', dataIndex: 'imageURL' },
    { title: 'Description', dataIndex: 'description' },
  ];
  return (
    <div className="card shadow-lg compact side bg-base-100">
      <h2>Data Sources</h2>
      <div className="relative flex flex-col min-w-0 break-words bg-white w-full mb-6 shadow-lg rounded ">
        <div className="rounded-t mb-0 px-4 py-3 border-0">
          <div className="flex flex-wrap items-center">
            <div className="relative w-full px-4 max-w-full flex-grow flex-1">
              <h3 className="font-semibold text-base text-blueGray-700">API</h3>
            </div>
          </div>
        </div>
        <div className="block w-full overflow-x-auto"></div>
        <table className="items-center bg-transparent w-full border-collapse">
          <thead>
            <tr>
              <th className="px-6 bg-blueGray-50 text-blueGray-500 align-middle border border-solid border-blueGray-100 py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                Name
              </th>
              <th className="px-6 bg-blueGray-50 text-blueGray-500 align-middle border border-solid border-blueGray-100 py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                Type
              </th>
              <th className="px-6 bg-blueGray-50 text-blueGray-500 align-middle border border-solid border-blueGray-100 py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                Account
              </th>
              <th className="px-6 bg-blueGray-50 text-blueGray-500 align-middle border border-solid border-blueGray-100 py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                Container
              </th>
              <th className="px-6 bg-blueGray-50 text-blueGray-500 align-middle border border-solid border-blueGray-100 py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                Image
              </th>
              <th className="px-6 bg-blueGray-50 text-blueGray-500 align-middle border border-solid border-blueGray-100 py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            {blobQuery.data?.map((item, i) => (
              <DataSourceRow key={i} dataSource={item} />
            ))}
            {apiQuery.data?.map((item, i) => (
              <DataSourceRow key={i} dataSource={item} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataSources;
