import React from 'react';
import { CLIENT_TYPE_BLOB, DataSource } from '@/api/Models';
import { useUserSettings } from '@/api/user-settings/use-user-settings';
import toast from 'react-hot-toast';

interface CustomAzureFormProps {
  currentContainer: string;
  currentAccount: string;
  currentSas: string;
  setCurrentContainer: (container: string) => void;
  setCurrentAccount: (container: string) => void;
  setCurrentSas: (container: string) => void;
  setCurrentType: (container: string) => void;
}

export const CustomAzureForm = ({
  currentContainer,
  currentAccount,
  currentSas,
  setCurrentContainer,
  setCurrentAccount,
  setCurrentSas,
  setCurrentType,
}: CustomAzureFormProps) => {
  const { addDataSource } = useUserSettings();

  const onAccountNameChange = (event) => {
    setCurrentAccount(event.target.value);
  };

  const onContainerNameChange = (event) => {
    setCurrentContainer(event.target.value);
  };

  const onSasTokenChange = (event) => {
    setCurrentSas(event.target.value);
  };

  const onCustomAzureSubmit = async (event) => {
    event.preventDefault();
    if (currentContainer === '' || currentAccount === '') {
      toast('Please fill in all blob storage account credential fields.', {
        duration: 5000,
        position: 'top-center',
        icon: '😖',
        className: 'bg-red-100 font-bold',
      });
      return;
    }
    // Note: leaving sasToken blank works, it means the blob container is publicly accessible
    if (currentSas != '') {
      // This code has been extracted from the way that validation of sas token it si done now on RepoBrowser.tsx
      const tempExpires = currentSas.slice(currentSas.search('se')).split('&')[0].slice(3, 13); // YEAR-MONTH-DAY
      if (tempExpires.length !== 10) {
        toast('SAS token invalid', {
          icon: '😖',
          className: 'bg-red-100 font-bold',
        });
        return;
      }
      const todayDate = new Date();
      const todayFormattedDate = todayDate.toISOString().substring(0, 10);
      const tempDayDifference = Math.abs((Date.parse(todayFormattedDate) - Date.parse(tempExpires)) / 86400000);
      if (todayFormattedDate > tempExpires) {
        toast('SAS Token has expired', {
          icon: '😖',
          className: 'bg-red-100 font-bold',
        });
        return;
      } else if (tempDayDifference < 7) {
        toast('Warning: the SAS token is within 7 days of expiration.', {
          icon: '⚠️',
        });
      }
    }
    var dataSource = {
      name: currentAccount + '/' + currentContainer,
      type: CLIENT_TYPE_BLOB,
      account: currentAccount,
      container: currentContainer,
      sasToken: currentSas,
      description: 'Azure Blob Storage',
    } as DataSource;
    addDataSource(dataSource);
    setCurrentType(CLIENT_TYPE_BLOB);
  };

  return (
    <>
      {' '}
      <details>
        <summary className="gap-2 w-52 h-12 items-center pt-2 outline outline-1 outline-primary rounded-lg hover:bg-accent hover:bg-opacity-50 text-primary text-lg">
          Azure Blob Storage
        </summary>
        <div
          className="w-48 h-56 p-2 outline outline-1 outline-primary rounded-b-lg"
          id={'azure-manual'}
          aria-label={'azure manual'}
          key={'azuremanual'}
        >
          <form>
            <input
              type="text"
              placeholder="Storage Account"
              onChange={onAccountNameChange}
              className="input input-bordered input-success w-full max-w-xs mt-2"
            />
            <input
              type="text"
              placeholder="Container Name"
              onChange={onContainerNameChange}
              className="input input-bordered input-success w-full max-w-xs my-2"
            />
            <input
              type="password"
              placeholder="SAS Token"
              onChange={onSasTokenChange}
              className="input input-bordered input-success w-full max-w-xs mb-2"
            />
          </form>
          <button className="" onClick={onCustomAzureSubmit} id="AzureBlob">
            Browse
          </button>
        </div>
      </details>
    </>
  );
};
