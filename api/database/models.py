from typing import Optional

from pydantic import BaseModel, Extra, Field, SecretStr


class DataSource(BaseModel):
    type: str
    name: str
    account: str
    container: str
    description: Optional[str] = None
    imageURL: Optional[str] = None
    sasToken: Optional[SecretStr] = None


class DataSourceReference(BaseModel):
    type: str
    account: str
    container: str
    file_path: str


class MetadataGlobal(BaseModel):
    antenna_gain: float | None = Field(alias="antenna:gain")
    antenna_type: str | None = Field(alias="antenna:type")
    core_datatype: str = Field(alias="core:datatype")
    core_sample_rate: int = Field(alias="core:sample_rate")
    core_version: str = Field(alias="core:version")
    core_num_channels: int | None = Field(alias="core:num_channels")
    core_sha512: str | None = Field(alias="core:sha512")
    core_offset: int | None = Field(alias="core:offset")
    core_description: str | None = Field(alias="core:description")
    core_author: str | None = Field(alias="core:author")
    core_meta_doi: str | None = Field(alias="core:meta_doi")
    core_data_doi: str | None = Field(alias="core:data_doi")
    core_recorder: str | None = Field(alias="core:recorder")
    core_license: str | None = Field(alias="core:license")
    core_hw: str | None = Field(alias="core:hw")
    core_dataset: str | None = Field(alias="core:dataset")
    core_trailing_bytes: int | None = Field(alias="core:trailing_bytes")
    core_metadata_only: bool | None = Field(alias="core:metadata_only")
    core_geolocation: dict | None = Field(alias="core:geolocation")
    core_extensions: list[dict] | None = Field(alias="core:extensions")
    core_collection: str | None = Field(alias="core:collection")
    traceability_revision: int | None = Field(alias="traceability:revision")
    traceability_origin: DataSourceReference | None = Field(alias="traceability:origin")

    class Config:
        extra = Extra.allow


class MetadataCapture(BaseModel):
    core_sample_start: int = Field(alias="core:sample_start")
    core_global_index: int | None = Field(alias="core:global_index")
    core_header_bytes: int | None = Field(alias="core:header_bytes")
    core_frequency: float | None = Field(alias="core:frequency")
    core_datetime: str | None = Field(alias="core:datetime")

    class Config:
        extra = Extra.allow


class MetadataAnnotation(BaseModel):
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


class Metadata(BaseModel):
    globalMetadata: MetadataGlobal = Field(alias="global")
    captures: list[MetadataCapture]
    annotations: list[MetadataAnnotation]


class Plugin(BaseModel):
    name: str
    url: str


class FeatureFlags(BaseModel):
    class Config:
        extra = Extra.allow


class ConnectionInfo(BaseModel):
    class Config:
        extra = Extra.allow


class Configuration(BaseModel):
    connection_info: ConnectionInfo = Field({}, alias="connectionInfo")
    feature_flags: FeatureFlags = Field({}, alias="featureFlags")
    google_analytics_key: str = Field(None, alias="googleAnalyticsKey")
    internal_branding: str = Field(None, alias="internalBranding")
    app_id: str = Field(None, alias="appId")
    app_authority: str = Field(None, alias="appAuthority")
