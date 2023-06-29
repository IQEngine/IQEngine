test_datasource = {
    "type": "api",
    "name": "name",
    "account": "account",
    "container": "container",
    "description": "description",
    "imageURL": "imageURL",
    "sasToken": "sasToken",
}


test_datasource_id = f'{test_datasource["account"]}_{test_datasource["container"]}'


valid_metadata = {
    "global": {
        "core:datatype": "string",
        "core:sample_rate": 1,
        "core:version": "1.0.0",
    },
    "captures": [
        {
            "core:sample_start": 1,
        }
    ],
    "annotations": [
        {
            "core:sample_start": 1,
            "core:sample_count": 1,
        }
    ],
}


valid_metadata_array = [
    {
        "global": {
            "antenna:gain": None,
            "antenna:type": None,
            "core:author": None,
            "core:collection": None,
            "core:data_doi": None,
            "core:dataset": None,
            "core:datatype": "rf",
            "core:description": None,
            "core:extensions": None,
            "core:geolocation": None,
            "core:hw": None,
            "core:license": None,
            "core:meta_doi": None,
            "core:metadata_only": None,
            "core:num_channels": None,
            "core:offset": None,
            "core:recorder": None,
            "core:sample_rate": 1000000,
            "core:sha512": None,
            "core:trailing_bytes": None,
            "core:version": "0.0.1",
            "traceability:origin": None,
            "traceability:revision": None,
        },
        "captures": [
            {
                "core:sample_start": 0,
                "core:global_index": 0,
                "core:header_bytes": 0,
                "core:frequency": 8486285000.0,
                "core:datetime": "2020-12-20T17:32:07.142626",
            }
        ],
        "annotations": [
            {
                "core:comment": None,
                "core:freq_lower_edge": None,
                "core:freq_upper_edge": None,
                "core:generator": None,
                "core:label": None,
                "core:sample_count": 0,
                "core:sample_start": 0,
                "core:uuid": None,
            }
        ],
    }
]
