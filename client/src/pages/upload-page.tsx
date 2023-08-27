// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React, { useState } from 'react';
import { useConfigQuery } from '@/api/config/queries';
import { ContainerClient, newPipeline, AnonymousCredential, BlockBlobClient } from '@azure/storage-blob';
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
    //let content = await readFile(f);

    // Create azure blob client
    const blobName = f.name.split('.')[0] + '_' + new Date().toISOString().split('.')[0] + '.' + f.name.split('.')[1];

    const fullBlobURL =
      'https://gnuradio.blob.core.windows.net/triage/' +
      blobName +
      '?sp=racwdli&st=2023-08-27T18:14:28Z&se=2023-09-28T02:14:28Z&sv=2022-11-02&sr=c&sig=84AXbsLwge1EDEu20FQ3N8e%2BKIcpVm91pLWUv%2FFPnro%3D';
    console.log(fullBlobURL);
    const pipeline = newPipeline(new AnonymousCredential());
    const blockBlobClient = new BlockBlobClient(fullBlobURL, pipeline);

    // chunking related
    const blockSize = 1 * 1024 * 1024; // 1MB
    const blockCount = Math.ceil(f.size / blockSize);
    console.log(blockCount, 'blocks');
    const blockIds = [];
    for (let i = 0; i < blockCount; i++) {
      console.log(i);
      const start = i * blockSize;
      const end = Math.min(start + blockSize, f.size);
      const chunk = f.slice(start, end);
      const chunkSize = end - start;
      const blockId = btoa('block-' + i.toString().padStart(6, '0'));
      blockIds.push(blockId);
      await blockBlobClient.stageBlock(blockId, chunk, chunkSize);
    }
    await blockBlobClient.commitBlockList(blockIds);
    console.log('done uploading ' + f.name);

    // Create a new blob
    //try {
    //  const resp = await blockBlobClient.upload(content, f.size);
    //  console.log(resp);
    //} catch (error) {
    //  console.error(error);
    //}
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
