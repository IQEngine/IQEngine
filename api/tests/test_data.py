test_datasource = {
    "type": "api",
    "name": "name",
    "account": "account",
    "container": "container",
    "description": "description",
    "imageURL": "imageURL",
    "sasToken": "sasToken",
    "account_key": "account_key",
    "public": True,
    "readers": ["IQEngine-User"],
    "owners": ["IQEngine-Admin"],
}


test_datasource_id = f'{test_datasource["account"]}_{test_datasource["container"]}'


valid_metadata = {

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
            "traceability:origin": {
                "type": "api",
                "account": "account",
                "container": "container",
                "file_path": "file_path",
            },
            "traceability:revision": None,
            "traceability:sample_length": None,
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
            "traceability:origin": {
                "type": "api",
                "account": "account",
                "container": "container",
                "file_path": "file_path",
            },
            "traceability:revision": None,
            "traceability:sample_length": None,
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

valid_datasourcereference_array = [
    {
        "type": "api",
        "account": "account",
        "container": "container",
        "file_path": "file_path",
    }
]
