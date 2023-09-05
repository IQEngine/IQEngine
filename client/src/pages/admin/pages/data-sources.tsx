import { DataSource } from '@/api/Models';
import { useGetDatasources } from '@/api/datasource/hooks/use-get-datasources';
import React, { useState } from 'react';
import { ModalDialog } from '@/features/ui/modal/Modal';
import DataSourceForm from './add-data-source';
import { useGetDatasourceFeatures, useSyncDataSource, useGetDataSource, useSasToken, useUploadDataSource } from '@/api/datasource/queries';
import toast from 'react-hot-toast';

interface DataSourceRowProps {
  dataSource: DataSource;
  onEdit?: (dataSource: DataSource) => void;
}

export const DataSourceRow = ({ dataSource, onEdit }: DataSourceRowProps) => {
  const features = useGetDatasourceFeatures(dataSource.type);
  const [progress, setProgress] = useState<number>(0);
  const sync = useSyncDataSource(dataSource.type, dataSource.account, dataSource.container);
  const edit = useGetDataSource(dataSource.type, dataSource.account, dataSource.container);
  const upload = useUploadDataSource(dataSource.type, dataSource.account, dataSource.container, setProgress);

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
        <div className="card-actions justify-center">
          <button
            aria-label={'edit ' + dataSource.name}
            className="btn btn-primary"
            onClick={async (e) => {
              e.preventDefault();
              onEdit(await edit());
            }}
          >
            Edit
          </button>
          <button
            aria-label={'upload ' + dataSource.name}
            className="btn btn-primary"
            onClick={async (e) => {
              e.preventDefault();
              upload();
            }}
          >
            {progress === 0 ? (
              "Upload"
            ) : (
              <div className="w-fill h-6 text-center outline outline-1 outline-primary rounded-lg">
                <div className="bg-secondary h-6 rounded-lg" style={{ width: `${String(progress.toFixed(1))}%` }}>
                  <span className="text-white font-bold">{`${String(progress.toFixed(1))}%`}</span>
                </div>
              </div>
            )}
          </button>
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
  const [dataSourceToEdit, setDataSourceToEdit] = useState<DataSource | null>(null);

  const handleEdit = (dataSource: DataSource) => {
    const InitDataForEdit = dataSource;
    setDataSourceToEdit(InitDataForEdit);
    setShowModal(true);
  };

  return (
    <>
      <h1 className="text-3xl font-bold">Data Sources</h1>

      <button className="btn btn-primary"
        aria-label={'Add data source'}
        onClick={() => {
          setShowModal(true);
        }}
      >
        + Add data source
      </button>

      {showModal && (
        <ModalDialog heading={dataSourceToEdit ? 'Edit Data Source' : 'Add Data Source'} setShowModal={setShowModal}>
          <DataSourceForm initialData={dataSourceToEdit} isEditMode={dataSourceToEdit ? true : false} setShowModal={setShowModal} />
        </ModalDialog>
      )}
      <div className="flex flex-wrap gap-4 pt-4 mt-2">
        {apiQuery.data?.map((item, i) => (
          <DataSourceRow key={i} dataSource={item} onEdit={handleEdit} />
        ))}
        {blobQuery.data?.map((item, i) => (
          <DataSourceRow key={i} dataSource={item} />
        ))}
      </div>
    </>
  );
};

export default DataSources;
