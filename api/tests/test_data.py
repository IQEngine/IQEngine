test_datasource = {
    "type": "api",
    "name": "name",
    "account": "account",
    "container": "container",
    "description": "description",
    "imageURL": "imageURL",
    "sasToken": "sasToken"
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
