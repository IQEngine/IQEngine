# Old python snippet backend stuff

import logging
import azure.functions as func
import fastapi
import numpy as np
from fastapi.middleware.cors import CORSMiddleware
from azure.storage.blob import BlobServiceClient, BlobClient, ContainerClient
import os

CONTAINERNAME = "iqengine"
connect_str = os.getenv("AzureWebJobsStorage")
@app.post("/pythonsnippet")
async def pythonsnippet(info : fastapi.Request):
    function_input = await info.json()
    logging.info(function_input)
    pythonSnippet = function_input["pythonSnippet"]
    logging.info(pythonSnippet)
    dataType = function_input["dataType"]
    offset = function_input["offset"]
    count = function_input["count"]
    blobName = function_input["blobName"] # sigmf-data blob name including dir
    logging.info("got here")
    blob_service_client = BlobServiceClient.from_connection_string(connect_str)
    container_client = blob_service_client.get_container_client(CONTAINERNAME)
    logging.info("connected to container")
    bytes = container_client.get_blob_client(blobName).download_blob(offset, count).readall()
    logging.info("read bytes")
    if dataType == 'cf32_le':
        samples = np.frombuffer(bytes, dtype=np.float32)
    elif dataType == 'ci16_le':
        samples = np.frombuffer(bytes, dtype=np.int16)
    else:
        print("Datatype not implemented")
        return


    x = samples[::2] + 1j*samples[1::2] # convert to complex

    # Run the specified python snippet
    logging.info("pre-snippet")
    x = eval(pythonSnippet)
    logging.info("post-snippet")
    # TODO: add some checking here to make sure x is still a complex array and the length we expect
    
    # Convert back to real, and the same type as specified in dataType
    if dataType == 'cf32_le':
        samples = np.zeros(len(x)*2, dtype=np.float32)
    elif dataType == 'ci16_le':
        samples = np.zeros(len(x)*2, dtype=np.int16)
    samples[::2] = x.real
    samples[1::2] = x.imag
    
    return fastapi.Response(samples.tobytes(), media_type='application/octet-stream')
'''
    async function fetchUsingPythonSnippet(offset, count, blobName, dataType) {
      const resp = await fetch('https://iqengine-azure-functions2.azurewebsites.net/pythonsnippet', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dataType: dataType,
          offset: offset,
          count: count,
          blobName: blobName,
        }),
      });
      return resp.arrayBuffer(); // not typed- we convert it to the right type later
    }
    
    const blobName = recording.replaceAll('(slash)', '/') + '.sigmf-data';
    buffer = await fetchUsingPythonSnippet(offset, count, blobName, data_type, pythonSnippet);
'''