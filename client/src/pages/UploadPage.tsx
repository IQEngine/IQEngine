// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React, { useState } from 'react';
import { useConfigQuery } from '@/api/config/queries';
import { ContainerClient } from '@azure/storage-blob';
import { fileOpen } from 'browser-fs-access';

function readFile(file: Blob): Promise<ArrayBuffer> {
  return new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (!reader.result || typeof reader.result === 'string') {
        reject(new Error('Failed to read the file'));
        return;
      }
      resolve(reader.result);
    };
    reader.onerror = () => {
      reject(new Error('Failed to read the file'));
    };
    reader.readAsArrayBuffer(file);
  });
}

export const UploadPage = () => {
  const [statusText, setStatusText] = useState<string>('Choose one or multiple Files');

  const config = useConfigQuery();

  async function uploadBlob(f) {
    const containerClient = new ContainerClient(config.data.uploadPageBlobSasUrl);
    let content = await readFile(f);

    const blobName = f.name.split('.')[0] + '_' + new Date().toISOString().split('.')[0] + '.' + f.name.split('.')[1];
    let blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Create a new blob
    try {
      const resp = await blockBlobClient.upload(content, f.size);
      console.log(resp);
    } catch (error) {
      console.error(error);
    }
  }

  const openFiles = async () => {
    const files = await fileOpen({
      multiple: true,
    });

    for (let indx in files) {
      setStatusText('Uploading ' + files[indx].name + '...');
      await uploadBlob(files[indx]);
    }
    setStatusText('Done uploading all files!');
  };

  return (
    <div className="my-24 grid justify-center">
      <h2>Files will be uploaded to a triage container where they will be reviewed by admins</h2>

      <div className="mt-4 grid justify-center">
        <button className="btn btn-primary opacity-75 w-32" onClick={openFiles}>
          Upload
        </button>
      </div>

      <div className="mt-4 grid justify-center">Status: {statusText}</div>
    </div>
  );
};
