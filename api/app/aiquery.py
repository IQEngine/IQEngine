import json
from openai import AzureOpenAI
import os
from datetime import datetime

rf_function = [
    {
        "name": "rf",
        "description": "Query RF recordings and return a list of recordings",
        "parameters": {
            "type": "object",
            "properties": {
                "account": {"type": "string", "description": "Account to query"},
                "container": {"type": "string", "description": "Container to query"},
                "database_id": {"type": "string", "description": "Database to query"},
                "min_frequency": {"type": "number", "description": "Min frequency in Hz (VHF, UHF, etc.)"},
                "max_frequency": {"type": "number", "description": "Max frequency in Hz"},
                "author": {"type": "string", "description": "Recording author"},
                "label": {"type": "string", "description": "Recording label"},
                "comment": {"type": "string", "description": "Recording comment"},
                "description": {"type": "string", "description": "Recording description"},
                "min_datetime": {"type": "string", "description": "Min recording date"},
                "max_datetime": {"type": "string", "description": "Max recording date"},
                "min_duration": {"type": "number", "description": "Min duration"},
                "text": {"type": "string", "description": "Text in recording"},
                "captures_geo_json": {"type": "string", "description": "GeoJSON for recording location (point, line, polygon)"},
                "captures_radius": {"type": "number", "description": "Recording location radius in meters"},
                "annotations_geo_json": {"type": "string", "description": "GeoJSON for annotation location (point, line, polygon)"},
                "annotations_radius": {"type": "number", "description": "Annotation location radius in meters"},
            },
        },
    }
]


def get_query_result(query: str):
    messages = [
        {
            "role": "system",
            "content": f"""
                Configure query engine to handle RF recording conversions to Hertz frequencies.
                Prioritize polygon-based geolocation for accuracy.
                Use extended radii to capture all relevant recordings.
                Today's date is {datetime.now().strftime("%m/%d/%Y, %H:%M:%S")}.
            """,
        },
        {"role": "user", "content": query},
    ]
    try:
        client = AzureOpenAI(
            api_key=os.getenv("OPENAI_KEY"),
            api_version=os.environ.get("OPENAI_VERSION", "2024-10-01-preview"),
            azure_endpoint=os.getenv("OPENAI_ENDPOINT"),
        )
        response = client.chat.completions.create(
            model=os.environ.get("OPENAI_ENGINE"),
            messages=messages,
            functions=rf_function,
            temperature=0.2,
            max_tokens=800,
            top_p=0.95,
            frequency_penalty=0,
            presence_penalty=0,
            stop=None,
        )

        response_message = response.choices[0].message
        if not response_message.function_call:
            print("OpenAI response_message function_call was empty")
            return {}
        function_args = json.loads(response_message.function_call.arguments)
        return function_args

    except Exception as e:
        print(e)
        raise ("Error during OpenAI call:", e)


if __name__ == "__main__":
    query = "recordings that contain lte taken on new years of 2021 in central park"
    print(get_query_result(query))
    """
    on 12/14/24 it returned
    {'min_datetime': '2021-01-01T00:00:00',
     'max_datetime': '2021-01-01T23:59:59',
     'text': 'lte',
     'captures_geo_json': '{"type":"Polygon","coordinates":[[[-73.9819,40.7681],[-73.9580,40.8003],[-73.9498,40.7968],[-73.9737,40.7646],[-73.9819,40.7681]]]}',
     'captures_radius': 500}
    """
