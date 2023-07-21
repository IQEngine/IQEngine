import { DataSource } from '@/api/Models';
import { useGetDatasources } from '@/api/datasource/hooks/use-get-datasources';
import React from 'react';
import { Link } from 'react-router-dom';
interface DataSourceRowProps {
  dataSource: DataSource;
}

export const DataSourceRow = ({ dataSource }: DataSourceRowProps) => {
  return (
    <div className="card w-80 bg-base-100 shadow-xl border-secondary border-2">
      <figure className="p-4">
        <img src={dataSource.imageURL} alt={dataSource.description} />
      </figure>
      <div className="card-body">
        <h2 className="card-title">
          {dataSource.name}
          <div className="badge badge-accent">{dataSource.type}</div>
        </h2>
        <p>{dataSource.description}</p>
      </div>
    </div>
  );
};

export const DataSources = () => {
  const { apiQuery, blobQuery } = useGetDatasources();

  return (
    <>
      <h1 className="text-3xl font-bold">Data Sources</h1>
      <Link to="/admin/add-data-source">
        <h3 className="text-l font-bold ml-2">+ Add data source</h3>
      </Link>
      <div className="flex flex-wrap gap-4 pt-4 mt-2">
        {apiQuery.data?.map((item, i) => (
          <DataSourceRow key={i} dataSource={item} />
        ))}
        {blobQuery.data?.map((item, i) => (
          <DataSourceRow key={i} dataSource={item} />
        ))}
      </div>
    </>
  );
};

export default DataSources;
