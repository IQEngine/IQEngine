// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import 'bootstrap/dist/css/bootstrap.css';
const {
    StorageSharedKeyCredential,
    BlobServiceClient
    } = require('@azure/storage-blob');
const {AbortController} = require('@azure/abort-controller');
const fs = require("fs");
const path = require("path");

if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

const STORAGE_ACCOUNT_NAME = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const ACCOUNT_ACCESS_KEY = process.env.AZURE_STORAGE_ACCOUNT_ACCESS_KEY;

const ONE_MEGABYTE = 1024 * 1024;
const FOUR_MEGABYTES = 4 * ONE_MEGABYTE;
const ONE_MINUTE = 60 * 1000;

async function showContainerNames(aborter, blobServiceClient) {
    let iter = await blobServiceClient.listContainers(aborter);
    for await (const container of iter) {
      console.log(` - ${container.name}`);
    }
}

async function uploadLocalFile(aborter, containerClient, filePath) {
    filePath = path.resolve(filePath);

    const fileName = path.basename(filePath);

    const blobClient = containerClient.getBlobClient(fileName);
    const blockBlobClient = blobClient.getBlockBlobClient();

    return await blockBlobClient.uploadFile(filePath,aborter);
}

async function uploadStream(aborter, containerClient, filePath) {
    filePath = path.resolve(filePath);

    const fileName = path.basename(filePath).replace('.md', '-STREAM.md');

    const blobClient = containerClient.getBlobClient(fileName);
    const blockBlobClient = blobClient.getBlockBlobClient();

    const stream = fs.createReadStream(filePath, {
      highWaterMark: FOUR_MEGABYTES,
    });

    const uploadOptions = {
        bufferSize: FOUR_MEGABYTES,
        maxBuffers: 5,
    };

    return await blockBlobClient.uploadStream(
                    stream,
                    uploadOptions.bufferSize,
                    uploadOptions.maxBuffers,
                    aborter);
}

async function showBlobNames(aborter, containerClient) {

    let iter = await containerClient.listBlobsFlat(aborter);
    for await (const blob of iter) {
      console.log(` - ${blob.name}`);
    }
}

// [Node.js only] A helper method used to read a Node.js readable stream into string
async function streamToString(readableStream) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      readableStream.on("data", (data) => {
        chunks.push(data.toString());
      });
      readableStream.on("end", () => {
        resolve(chunks.join(""));
      });
      readableStream.on("error", reject);
    });
}

async function execute() {

    const containerName = "demo";
    const blobName = "quickstart.txt";
    const content = "Hello Node SDK";
    const localFilePath = "../README.md";

    const credentials = new StorageSharedKeyCredential(STORAGE_ACCOUNT_NAME, ACCOUNT_ACCESS_KEY);

    const blobServiceClient = new BlobServiceClient(`https://${STORAGE_ACCOUNT_NAME}.blob.core.windows.net`,credentials);

    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobClient = containerClient.getBlobClient(blobName);
    const blockBlobClient = blobClient.getBlockBlobClient();

    const aborter = AbortController.timeout(30 * ONE_MINUTE);

    await containerClient.create();
    console.log(`Container: "${containerName}" is created`);

    console.log("Containers:");
    await showContainerNames(aborter, blobServiceClient);

    await blockBlobClient.upload(content, content.length, aborter);
    console.log(`Blob "${blobName}" is uploaded`);

    await uploadLocalFile(aborter, containerClient, localFilePath);
    console.log(`Local file "${localFilePath}" is uploaded`);

    await uploadStream(aborter, containerClient, localFilePath);
    console.log(`Local file "${localFilePath}" is uploaded as a stream`);

    console.log(`Blobs in "${containerName}" container:`);

    await showBlobNames(aborter, containerClient);

    const downloadResponse = await blockBlobClient.download(0,aborter);
    const downloadedContent = await streamToString(downloadResponse.readableStreamBody);

    console.log(`Downloaded blob content: "${downloadedContent}"`);

    await blockBlobClient.delete(aborter);
    console.log(`Block blob "${blobName}" is deleted`);

    await containerClient.delete(aborter);
    console.log(`Container "${containerName}" is deleted`);
}

execute().then(() => console.log("Done")).catch((e) => console.log(e));
