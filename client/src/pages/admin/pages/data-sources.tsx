import { DataSource } from '@/api/Models';
import { useGetDatasources } from '@/api/datasource/hooks/use-get-datasources';
import React, { useState } from 'react';
import { ModalDialog } from '@/features/ui/modal/Modal';
import DataSourceForm from './add-data-source';
import { useGetDatasourceFeatures, useSyncDataSource } from '@/api/datasource/queries';
import toast from 'react-hot-toast';

interface DataSourceRowProps {
  dataSource: DataSource;
}

export const DataSourceRow = ({ dataSource }: DataSourceRowProps) => {
  const features = useGetDatasourceFeatures(dataSource.type);
  const sync = useSyncDataSource(dataSource.type, dataSource.account, dataSource.container);
  return (
    <div className="card p-2 pb-4 w-80 bg-base-100 shadow-xl border-secondary border-2">
      <figure className="p-2">
        <img src={dataSource.imageURL} alt={dataSource.description} />
      </figure>
      <div className="card-body">
        <h2 className="card-title">
          {dataSource.name}
          <div className="badge badge-accent">{dataSource.type}</div>
        </h2>
        <p>{dataSource.description}</p>
      </div>
      {features.sync && (
        <div className="card-actions justify-end">
          <button
            aria-label={'sync ' + dataSource.name}
            className="btn btn-primary"
            onClick={(e) => {
              e.preventDefault();
              toast('Syncing the datasource with the storage account', {
                icon: '🔄',
                className: 'font-bold',
              });
              sync();
            }}
          >
            Sync
          </button>
        </div>
      )}
    </div>
  );
};

export const DataSources = () => {
  const { apiQuery, blobQuery } = useGetDatasources();
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <h1 className="text-3xl font-bold">Data Sources</h1>

      <button
        aria-label={'Add data source'}
        onClick={() => {
          setShowModal(true);
        }}
      >
        <h3 className="text-l font-bold ml-2">+ Add data source</h3>
      </button>

      {showModal && (
        <ModalDialog heading={'Add data source'} setShowModal={setShowModal}>
          <DataSourceForm />
        </ModalDialog>
      )}
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
