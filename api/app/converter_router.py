from fastapi import APIRouter, Depends, UploadFile, BackgroundTasks, Response
from helpers.authorization import get_current_user
from converters.wav_to_sigmf import wav_to_sigmf
from typing import Optional
import os
import shutil
import io
import zipfile

router = APIRouter()

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
