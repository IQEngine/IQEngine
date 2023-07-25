import React, { useRef  } from 'react';
import { DataSource } from '@/api/Models';
import { useAddDataSource } from '@/api/datasource/queries';
import { ClientType } from '@/api/Models';
import toast from 'react-hot-toast';


export const DataSourceForm = () => {
      const addDataSource = useAddDataSource()
      const formRef = useRef<HTMLFormElement>(null);

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
          sasToken: event.target.elements.sasToken.value
        }
        addDataSource.mutate(formData, {
          onSuccess: () => {
            toast('Successfully added data source', {
              icon: '👍',
              className: 'bg-green-100 font-bold',
            });
          },
          onError: (err, newMeta, context) => {
            if(err.response.status == 409) {
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
          }
        })

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
        <br/>
        <input
            type="text"
            name="account"
            placeholder="Storage Account name"
            className="input input-bordered input-success w-full max-w-xs"
          />
        <br />
        <input
            type="text"
            name="container"
            placeholder="Container Name"
            className="input input-bordered input-success w-full max-w-xs"
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
          <button
            type="submit"
            aria-label="Submit Data Source Button"
            className="bg-white text-black px-4 py-2 rounded-md mt-3"
            >Submit</button>
        </form>
      );
    };

    export default DataSourceForm;

