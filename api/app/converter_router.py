from fastapi import APIRouter, Depends, HTTPException, UploadFile, BackgroundTasks, Response
from helpers.authorization import get_current_user
from typing import Optional
import os
import shutil
import io
import zipfile
from sigmf import SigMFFile
from scipy.io import wavfile
import numpy as np

router = APIRouter()


def wav_to_sigmf(wav_file_path: str) -> list[str]:
    """Convert a wav file to a sigmf file."""

    sample_rate, data = wavfile.read(wav_file_path)

    dest_path = wav_file_path.split(".")[0]
    _convert_data(data, dest_path)

    meta = SigMFFile(
        data_file=f"{dest_path}.sigmf-data",
        global_info={
            SigMFFile.DATATYPE_KEY: "cf32_le",
            SigMFFile.SAMPLE_RATE_KEY: sample_rate,
            SigMFFile.VERSION_KEY: "1.0.0",
            SigMFFile.NUM_CHANNELS_KEY: 1,
        }
    )

    meta.tofile(f"{dest_path}.sigmf-meta")
    return [f"{dest_path}.sigmf-data", f"{dest_path}.sigmf-meta"]


def _convert_data(data: np.ndarray, destination_path: str):
    """Convert a numpy array to a SigMF data file."""

    with open(f"{destination_path}.sigmf-data", "wb") as f:
        if len(data.shape) == 2:
            for sample in data:
                real = sample[0].astype(np.float32)
                imag = sample[1].astype(np.float32)
                f.write(real.tobytes())
                f.write(imag.tobytes())
        else: # only one channel (eg mono audio)
            for sample in data:
                real = sample.astype(np.float32)
                imag = np.float32(0) # until IQEngine supports real-valued SigMF recordings
                f.write(real.tobytes())
                f.write(imag.tobytes())

def remove_files(file_paths: str):
    for file_path in file_paths:
        if os.path.exists(file_path):
            os.remove(file_path)


def zipfiles(zip_name, filenames):
    zip_filename = f"{zip_name}.zip"

    s = io.BytesIO()
    zf = zipfile.ZipFile(s, "w")

    for fpath in filenames:
        # Calculate path for file in zip
        fdir, fname = os.path.split(fpath)

        # Add file, at correct path
        zf.write(fpath, fname)

    # Must close zip for all contents to be written
    zf.close()

    # Grab ZIP file from in-memory, make response with correct MIME-type
    resp = Response(s.getvalue(), media_type="application/x-zip-compressed", headers={
        'Content-Disposition': f'attachment;filename={zip_filename}'
    })

    return resp


@router.post("/api/convert/wav")
async def convert_wav_to_sigmf(
    wav_file: UploadFile,
    background_tasks: BackgroundTasks,
    current_user: Optional[dict] = Depends(get_current_user),
):
    """
    Convert wav file to sigmf archive
    """

    # check if teporary conver directory exists
    if not os.path.exists("temp/conv"):
        os.makedirs("temp/conv")

    # store temp iq file
    wav_file_location = f"temp/conv/{wav_file.filename}"
    try:
        with open(wav_file_location, "wb+") as f:
            shutil.copyfileobj(wav_file.file, f)
    finally:
        wav_file.file.close()

    try:
        created_files = wav_to_sigmf(wav_file_path=wav_file_location)
        # delete temporary file
        background_tasks.add_task(
            remove_files, created_files)
        os.remove(wav_file_location)

        return zipfiles(zip_name=wav_file.filename.split(".")[0], filenames=created_files)

    except Exception as e:
        print("Error converting wav file:", e)
