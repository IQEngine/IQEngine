import argparse
import json
import struct
from datetime import datetime
from pathlib import Path

import numpy as np


def convert_file(file_path):
    header = np.fromfile(file_path, dtype=np.uint8, count=32)
    (
        sample_rate,
        center_frequency,
        start_time_stamp,
        sample_size,
        filler,
        crc32,
    ) = struct.unpack("<IQQIII", header.tobytes())

    meta = dict(
        sample_rate=sample_rate,
        center_frequency=center_frequency,
        start_time_stamp=start_time_stamp,
        sample_size=sample_size,
        filler=filler,
        crc32=crc32,
    )

    if sample_size == 16:
        config = {"dtype": np.int16, "scale": 0xFFFF}
    elif sample_size == 24:
        config = {"dtype": np.int32, "scale": 0xFFFFFF}
    else:
        raise Exception(f"Sample rate {sample_size} is not supported")

    # remmove the header
    data = np.fromfile(file_path, dtype=config["dtype"], offset=32)
    # transform to float32
    float_data = (data.astype(np.float32) / config["scale"]).astype(np.float32)

    metadata = {
        "global": {
            "core:author": "Gabriel Nepomuceno",
            "core:datatype": "cf32",
            "core:description": "Plubic domain FM radio recording in UK.",
            "core:license": "MIT",
            "core:sample_rate": meta["sample_rate"],
            "core:version": "1.0.0",
        },
        "captures": [
            {
                "core:datatime": datetime.fromtimestamp(
                    meta["start_time_stamp"] / 1000
                ).isoformat(),
                "core:sample_start": 0,
                "core:frequency": meta["center_frequency"],
            }
        ],
        "annotations": [],
    }

    content = json.dumps(metadata, indent=4)
    return content, float_data


parser = argparse.ArgumentParser()

parser.add_argument("path", help="Path to the directory containing the SDRIQ files")

parser.add_argument(
    "-o",
    "--output",
    help="Path to the output directory (default: .)",
    default=".",
)

parser.add_argument(
    "--do-not-overwrite",
    help="Do not overwrite existing files",
    action="store_true",
)

args = parser.parse_args()

target_dir = Path(args.path)

if not target_dir.exists():
    print("The source directory doesn't exist")
    raise SystemExit(1)

for entry in target_dir.iterdir():
    if entry.suffix == ".sdriq":
        print(f"Parsing file: {entry.name}")
        content, data = convert_file(entry)
        output_path = Path(args.output) / (entry.stem + ".sigmf-meta")
        if output_path.exists() and args.do_not_overwrite:
            print(f"File {output_path} already exists, skipping")
            continue
        with open(output_path, "w") as f:
            f.write(content)
        print(f"Created file: {output_path.name}")
        output_path = Path(args.output) / (entry.stem + ".sigmf-data")
        if output_path.exists() and args.do_not_overwrite:
            print(f"File {output_path} already exists, skipping")
            continue
        data.tofile(output_path)
        print(f"Created file: {output_path.name}")
