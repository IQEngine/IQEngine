import React, { useState } from 'react';
import { DataSource } from '@/api/Models';
import { useAddDataSource } from '@/api/datasource/queries';
import { ClientType } from '@/api/Models';


export const Form = () => {


      const addDataSource = useAddDataSource(null)

      const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        console.log(event.target.elements.name.value)
        const formData: DataSource = {
          type: ClientType.API,
          name: event.target.elements.name.value,
          account: event.target.elements.account.value,
          container: event.target.elements.container.value,
          description: event.target.elements.description.value,
          imageURL: event.target.elements.imageURL.value,
          sasToken: event.target.elements.sasToken.value
        }
        addDataSource.mutate(formData)
      };

      return (
        <div>
        <h1>Add data source</h1>
        <form onSubmit={handleSubmit}>
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
            className="bg-white text-black px-4 py-2 rounded-md mt-3"
            >Submit</button>
        </form>
        </div>
      );
    };
    
    export default Form;

