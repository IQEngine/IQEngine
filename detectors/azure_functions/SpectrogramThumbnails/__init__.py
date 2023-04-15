import logging

from azure.storage.blob import BlobServiceClient, BlobClient, ContainerClient
import matplotlib.pyplot as plt
from pymongo import MongoClient
import azure.functions as func
from PIL import Image
import numpy as np
import urllib
import json
import io
import os

connect_str = os.getenv("AzureWebJobsStorage")
client = MongoClient(os.getenv("MongoDBConnString"))

num_bytes = 1000000
offset = 0
fft_size = 1024

def main(myblob: func.InputStream):
    #logging.info(f"Python blob trigger function processed blob \n"
                #f"Name: {myblob.name}\n"
                #f"Blob Size: {myblob.length} bytes\n"
                #f"Blob uri: {myblob.uri}")
    logging.info('Attempting to get storage account key')
    STORAGEACCOUNTURL = myblob.uri[0:len(myblob.uri)-len(myblob.name)]
    #logging.info(f"Storageaccounturl: {STORAGEACCOUNTURL}")
    splitName = myblob.name.split('/')
    CONTAINERNAME = (myblob.name.split('/')[0]).strip()
    #logging.info(f"Container Name: {CONTAINERNAME}")
    BLOBNAME = myblob.name.removeprefix(CONTAINERNAME + "/")
    #logging.info(f"Blobname: {BLOBNAME}")

    logging.info("creating blob service client and container client")
    blob_service_client = BlobServiceClient.from_connection_string(connect_str)
    container_client = blob_service_client.get_container_client(CONTAINERNAME)
    logging.info("Completed creation of various clients")
    basename = BLOBNAME.split('.')[0]
    extension = BLOBNAME.split('.')[1]
    logging.info("Making sure it ends in .sigmf-meta or .sigmf-data")
    #logging.info(f"Extension: {extension}")
    if ((extension != "sigmf-meta") and (extension != "sigmf-data")):
        logging.info("File is not a .sigmf-meta or .sigmf-data file")
        return

    logging.info("Checking if both .sigmf-meta and .sigmf-data exist")

    meta_name = basename + '.sigmf-meta'
    data_name = basename + '.sigmf-data'

    blobmeta = BlobClient.from_connection_string(conn_str=connect_str, container_name=CONTAINERNAME, blob_name=meta_name)
    metaexists = blobmeta.exists()
    logging.info(f"Does .sigmf-meta exist: {metaexists}")

    blobdata = BlobClient.from_connection_string(conn_str=connect_str, container_name=CONTAINERNAME, blob_name=data_name)
    dataexists = blobdata.exists()
    logging.info(f"Does .sigmf-data exist: {dataexists}")


    if (metaexists):
        logging.info('getting meta and data files')
        with urllib.request.urlopen(STORAGEACCOUNTURL + CONTAINERNAME + "/" + meta_name) as url:
            meta_data = json.loads(url.read().decode())
            if (extension == "sigmf-meta"):
                logging.info("Inside if statement")
                db = client.maindb
                meta_data["filename"] = BLOBNAME
                db.iqenginemetadata.update_one({"filename": BLOBNAME}, {"$set": meta_data}, upsert=True)
                """
                query = {"annotations.core:description": "Bluetooth"}
                newvalues = [{"$set": list_of_dicts}]
                db.collection2.update_many(query, newvalues)
                """
                logging.info("Insertion complete")
    
    if (not (metaexists and dataexists)):
        logging.info("either meta file or data file does not exist")
        return
    
    meta_data_global = meta_data.get("global", {})
    datatype =  meta_data_global.get("core:datatype", 'cf32_le')
    sample_rate = float(meta_data_global.get("core:sample_rate", 0))/1e6 # MHz
    center_freq = float(meta_data.get("captures", [])[0].get("core:frequency", 0))/1e6 # MHz
    
    bytes = container_client.get_blob_client(data_name).download_blob(offset, num_bytes).readall()
    if datatype == 'cf32_le':
        samples = np.frombuffer(bytes, dtype=np.complex64)
    elif datatype == 'ci16_le':
        samples = np.frombuffer(bytes, dtype=np.int16)
        samples = samples[::2] + 1j*samples[1::2]
    elif datatype == 'ri16_le':
        samples = np.frombuffer(bytes, dtype=np.int16)
    else:
        print("Datatype not implemented")
        samples = np.zeros(1024)

    # Generate spectrogram
    num_rows = int(np.floor(len(samples)/fft_size))
    spectrogram = np.zeros((num_rows, fft_size))
    for i in range(num_rows):
        spectrogram[i,:] = 10*np.log10(np.abs(np.fft.fftshift(np.fft.fft(samples[i*fft_size:(i+1)*fft_size])))**2)

    fig = plt.figure(frameon=False)
    ax = plt.Axes(fig, [0., 0., 1., 1.])
    ax.set_axis_off()
    fig.add_axes(ax)
    vmin = np.min(spectrogram) + 5 # dB
    vmax = np.max(spectrogram) - 5 # dB
    ax.imshow(spectrogram, vmin=vmin, vmax=vmax, cmap='jet', aspect='auto', extent = [sample_rate/-2 + center_freq, sample_rate/2 + center_freq, 0, len(samples)/sample_rate])

    #logging.info('Image creation')
    #Convert from matplotlib to PIL Image without saving or displaying anything
    img_buf = io.BytesIO()
    plt.savefig(img_buf, bbox_inches='tight', pad_inches = 0)
    img_buf.seek(0)
    im = Image.open(img_buf)

    img_byte_arr = io.BytesIO()
    im.convert("RGB").save(img_byte_arr, format = 'jpeg')
    output = f"{basename}.jpeg"

    logging.info("Uploading blob")
    container_client.upload_blob(name=output, data=img_byte_arr.getvalue(), overwrite=True)

    logging.info("Success!")
    
    return



