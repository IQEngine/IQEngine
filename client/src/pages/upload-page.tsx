import React, { useState, useEffect } from 'react';
import { useConfigQuery } from '@/api/config/queries';
import { newPipeline, AnonymousCredential, BlockBlobClient } from '@azure/storage-blob';
import { fileOpen } from 'browser-fs-access';

export const UploadPage = () => {
  const [statusText, setStatusText] = useState<string>('Choose one or multiple Files');
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [progress, setProgress] = useState<Number>(0);
  const [expired, setExpired] = useState<boolean>(false);

  const config = useConfigQuery();

  // Check if sas token is expired
  useEffect(() => {
    const expireDateTime = config.data.uploadPageBlobSasUrl.split('&se=')[1].split('&')[0];
    if (Date.parse(expireDateTime) - Date.parse(new Date()) < 0) setExpired(true);
  }, []);

  async function uploadBlob(f) {
    // Create azure blob client
    //const blobName = f.name.split('.')[0] + '_' + new Date().toISOString().split('.')[0] + '.' + f.name.split('.')[1];
    const blobName = f.name;
    const containerUrl = config.data.uploadPageBlobSasUrl; // Note - it needs ADD, CREATE, WRITE (acw)
    const blobUrl = containerUrl.split('?')[0] + '/' + blobName + '?' + containerUrl.split('?')[1];
    const pipeline = newPipeline(new AnonymousCredential());
    const blockBlobClient = new BlockBlobClient(blobUrl, pipeline);

    // chunking related
    const blockSize = 1 * 1024 * 1024; // 1MB
    const blockCount = Math.ceil(f.size / blockSize);
    console.log(blockCount, 'blocks');
    const blockIds = [];
    for (let i = 0; i < blockCount; i++) {
      setProgress((i / blockCount) * 100); // update progress bar
      const start = i * blockSize;
      const end = Math.min(start + blockSize, f.size);
      const chunk = f.slice(start, end);
      const chunkSize = end - start;
      const blockId = btoa('block-' + i.toString().padStart(6, '0'));
      blockIds.push(blockId);
      await blockBlobClient.stageBlock(blockId, chunk, chunkSize);
    }
    await blockBlobClient.commitBlockList(blockIds);
    setProgress(100);
    console.log('done uploading ' + f.name);
  }

  const openFiles = async () => {
    const files = await fileOpen({
      multiple: true,
    });

    let uploadedFilesList = [];
    for (let indx in files) {
      setStatusText('Uploading ' + files[indx].name + '...');
      await uploadBlob(files[indx]);
      uploadedFilesList = uploadedFilesList.concat(files[indx].name);
      setUploadedFiles(uploadedFilesList);
    }

    setStatusText('Done uploading all files!');
  };

  if (expired) {
    return (
      <div className="my-24 grid justify-center">
        <h2>Upload SAS token is expired, contact site admin to get it updated</h2>
      </div>
    );
  } else {
    return (
      <div className="my-24 grid justify-center">
        <h2>Files will be uploaded to a triage container where they will be reviewed by admins</h2>

        <div className="my-4 grid justify-center">
          <button className="btn btn-primary opacity-75 w-32" onClick={openFiles}>
            Upload
          </button>
        </div>

        {progress !== 0 && (
          <div className="w-fill h-6 text-center outline outline-1 outline-primary rounded-lg">
            <div className="bg-secondary h-6 rounded-lg" style={{ width: `${String(progress.toFixed(1))}%` }}>
              <span className="text-white font-bold">{`${String(progress.toFixed(1))}%`}</span>
            </div>
          </div>
        )}

        <div className="mt-4 grid justify-center">Status: {statusText}</div>

        {uploadedFiles.map((fname) => (
          <div className="mt-4 grid justify-center" key={fname}>
            Uploaded {fname}
          </div>
        ))}
      </div>
    );
  }
};
