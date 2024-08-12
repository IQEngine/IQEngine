from fastapi import APIRouter, Depends, UploadFile, BackgroundTasks, Response
from helpers.authorization import get_current_user
from converters.wav_to_sigmf import wav_to_sigmf
import converters.vita49_to_sigmf.vita49 as vita49
from typing import Optional
import os
import sys
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


@router.post("/api/convert/vita49")
async def convert_vita49_to_sigmf(
    file: UploadFile,
    background_tasks: BackgroundTasks,
    current_user: Optional[dict] = Depends(get_current_user),
):
    # check if teporary conver directory exists
    if not os.path.exists("temp/conv"):
        os.makedirs("temp/conv")

    # store temp iq file
    file_location = f"temp/conv/{file.filename}"
    try:
        with open(file_location, "wb+") as f:
            shutil.copyfileobj(file.file, f)
    finally:
        file.file.close()

    try:
        vita49.convert_input(file_location, file_location)  # 2nd arg is what the output will be called, with sigmf extensions added
        created_files = [file_location + "0x0.sigmf-meta", file_location + "0x0.sigmf-data"]
        background_tasks.add_task(remove_files, created_files)  # delete temporary file
        os.remove(file_location)  # remove the input file
        return zipfiles(zip_name=file.filename.split(".")[0], filenames=created_files)

    except Exception as e:
        print("Error converting vita49 file:", e)
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        print(exc_type, fname, exc_tb.tb_lineno)
