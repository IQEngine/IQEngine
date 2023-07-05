from typing import Optional

from pydantic import BaseModel, Extra, Field


class Annotation(BaseModel):
    core_sample_start: int = Field(alias="core:sample_start")
    core_sample_count: int = Field(alias="core:sample_count")
    core_generator: str | None = Field(alias="core:generator")
    core_label: str | None = Field(alias="core:label")
    core_comment: str | None = Field(alias="core:comment")
    core_freq_lower_edge: float | None = Field(alias="core:freq_lower_edge")
    core_freq_upper_edge: float | None = Field(alias="core:freq_upper_edge")
    core_uuid: str | None = Field(alias="core:uuid")

    class Config:
        extra = Extra.allow


class SamplesB64(BaseModel):
    samples: str
    data_type: str
    sample_rate: Optional[int] = None
    center_freq: Optional[int] = None


class SamplesCloud(BaseModel):
    account_name: str
    container_name: str
    file_path: str
    sas_token: Optional[str] = None
    data_type: str
    sample_rate: Optional[int] = 1
    byte_offset: Optional[int] = 0
    byte_length: Optional[int] = None
    center_freq: Optional[int] = 0


class CustomParams(BaseModel):
    class Config:
        extra = Extra.allow


class Plugin(BaseModel):
    samples_b64: Optional[list[SamplesB64]] = None
    samples_cloud: Optional[list[SamplesCloud]] = None
    annotations: Optional[list[Annotation]] = None
    custom_params: Optional[dict] = None
