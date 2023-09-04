import React, { useEffect, useRef } from 'react';
import { DataSource } from '@/api/Models';
import { useAddDataSource, useUpdateDataSource } from '@/api/datasource/queries';
import { ClientType } from '@/api/Models';
import toast from 'react-hot-toast';

interface DataSourceFormProps {
  initialData?: DataSource;
  isEditMode?: boolean;
  setShowModal?: (show: boolean) => void;
}

export const DataSourceForm = ({ initialData, isEditMode, setShowModal }: DataSourceFormProps) => {
  const addDataSource = useAddDataSource();
  const updateDataSource = useUpdateDataSource();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const form = formRef.current;
    if (initialData && form) {
      form.name.value = initialData.name || '';
      form.account.value = initialData.account || '';
      form.container.value = initialData.container || '';
      form.description.value = initialData.description || '';
      form.imageURL.value = initialData.imageURL || '';
      form.sasToken.value = initialData.sasToken || '';
      form.accountKey.value = initialData.accountKey || '';
      form.owners.value = initialData.owners?.join(', ') || '';
      form.readers.value = initialData.readers?.join(', ') || '';
      form.public.value = initialData.public ? 'true' : 'false';
    }
  }, [initialData]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const form = formRef.current;

    const formData: DataSource = {
      type: ClientType.API,
      name: event.target.elements.name.value,
      account: event.target.elements.account.value,
      container: event.target.elements.container.value,
      description: event.target.elements.description.value,
      imageURL: event.target.elements.imageURL.value,
      sasToken: event.target.elements.sasToken.value,
      accountKey: event.target.elements.accountKey.value,
      owners: event.target.elements.owners.value === '' ? [] : event.target.elements.owners.value.split(',').map(s => s.trim()),
      readers: event.target.elements.readers.value === '' ? [] : event.target.elements.readers.value.split(',').map(s => s.trim()),
      public: event.target.elements.public.value.toLowerCase() === 'true' ? true : false,

    };

    if (isEditMode) {
      updateDataSource.mutate(formData, {
        onSuccess: () => {
          toast('Successfully updated data source', {
            icon: '👍',
            className: 'bg-green-100 font-bold',
          });
          setShowModal(false);
        },
        onError: (err, newMeta, context) => {
          toast('Something went wrong updating the data source', {
            icon: '😖',
            className: 'bg-red-100 font-bold',
          });
          console.error('onError', err);
        },
      });
    } else {
      addDataSource.mutate(formData, {
        onSuccess: () => {
          toast('Successfully added data source', {
            icon: '👍',
            className: 'bg-green-100 font-bold',
          });
        },
        onError: (err, newMeta, context) => {
          if (err.response.status == 409) {
            toast('You have already added this data source', {
              icon: '💾',
              className: 'bg-red-100 font-bold',
            });
          } else {
            toast('Something went wrong adding the data source', {
              icon: '😖',
              className: 'bg-red-100 font-bold',
            });
          }
          console.error('onError', err);
        },
      });
    }

    form.reset();
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
      <input
        type="text"
        name="name"
        placeholder="Data Source Name"
        className="input input-bordered input-success w-full max-w-xs"
      />
      <br />
      <input
        type="text"
        name="account"
        placeholder="Storage Account name"
        className="input input-bordered input-success w-full max-w-xs"
        disabled={isEditMode}
      />
      <br />
      <input
        type="text"
        name="container"
        placeholder="Container Name"
        className="input input-bordered input-success w-full max-w-xs"
        disabled={isEditMode}
      />
      <br />
      <input
        type="text"
        name="description"
        placeholder="Description (optional)"
        className="input input-bordered input-success w-full max-w-xs"
      />
      <br />
      <input
        type="text"
        name="imageURL"
        placeholder="Image URL (optional)"
        className="input input-bordered input-success w-full max-w-xs"
      />
      <br />
      <input
        type="text"
        name="sasToken"
        placeholder="SAS Token (optional)"
        className="input input-bordered input-success w-full max-w-xs"
      />
      <br />
      <input
        type="text"
        name="accountKey"
        placeholder="Account Key (optional)"
        className="input input-bordered input-success w-full max-w-xs"
      />
      <input
        type="text"
        name="owners"
        placeholder="Owners (optional)"
        className="input input-bordered input-success w-full max-w-xs"
      />
      <input
        type="text"
        name="readers"
        placeholder="Readers (optional)"
        className="input input-bordered input-success w-full max-w-xs"
      />
      <input
        type="text"
        name="public"
        placeholder="Public access (optional)"
        className="input input-bordered input-success w-full max-w-xs"
      />
      <br />
      <button type="submit" aria-label="Submit Data Source" className="bg-white text-black px-4 py-2 rounded-md mt-3">
        Submit
      </button>
    </form>
  );
};

export default DataSourceForm;
