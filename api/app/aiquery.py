import json
import openai
import os
from datetime import datetime
openai.api_type = os.environ.get("OPENAI_TYPE", "azure")
openai.api_base = os.environ.get("OPENAI_ENDPOINT")
openai.api_version = os.environ.get("OPENAI_VERSION", "2023-07-01-preview")
openai.api_key = os.environ.get("OPENAI_KEY")
engine = os.environ.get("OPENAI_ENGINE")

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
                "annotations_radius": {"type": "number", "description": "Annotation location radius in meters"}
            }
        }
    }

]

def is_open_ai_available():
    return \
        openai.api_type != None and openai.api_type != "" and \
        openai.api_key != None and openai.api_key != "" and \
        openai.api_base != None and openai.api_base != "" and \
        openai.api_version != None and openai.api_version != ""


def get_query_result(query: str):
    if not is_open_ai_available():
        return {}
    messages = [
        {
            "role": "system",
            "content": f"""
                Configure query engine to handle RF recording conversions to Hertz frequencies.
                Prioritize polygon-based geolocation for accuracy.
                Use extended radii to capture all relevant recordings.
                Today's date is {datetime.now().strftime("%m/%d/%Y, %H:%M:%S")}.
            """
        },
        {
            "role": "user",
            "content": query
        }
    ]
    try:
        response = openai.ChatCompletion.create(
            engine=engine,
            messages=messages,
            functions=rf_function,
            temperature=0.2,
            max_tokens=800,
            top_p=0.95,
            frequency_penalty=0,
            presence_penalty=0,
            stop=None
        )
        response_message = response["choices"][0]["message"]
        if not response_message.get("function_call"):
            return {}
        function_args = json.loads(response_message["function_call"]["arguments"])
        return function_args

    except Exception as e:
        print(e)
        raise ("Open AI is not available", e)
