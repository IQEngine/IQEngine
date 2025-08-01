from typing import List, Optional

from pydantic import BaseModel, Extra, Field, SecretStr


class DataSource(BaseModel):
    type: str
    name: str
    account: str
    container: str
    awsAccessKeyId: Optional[str] = None
    description: Optional[str] = None
    imageURL: Optional[str] = None
    sasToken: Optional[SecretStr] = None
    accountKey: Optional[SecretStr] = None
    awsSecretAccessKey: Optional[SecretStr] = None
    owners: Optional[List[str]] = []
    readers: Optional[List[str]] = []
    public: Optional[bool] = False


class DataSourceReference(BaseModel):
    type: str
    account: str
    container: str
    file_path: str


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
    feature_flags: FeatureFlags = Field(None, alias="featureFlags")
    google_analytics_key: str = Field(None, alias="googleAnalyticsKey")
    UPLOAD_PAGE_BLOB_SAS_URL: str = Field(None, alias="uploadPageBlobSasUrl")
    internal_branding: str = Field(None, alias="internalBranding")
    app_id: str = Field(None, alias="appId")
    app_authority: str = Field(None, alias="appAuthority")


class GeoTrack(BaseModel):
    type: Optional[str]
    coordinates: Optional[List[List[float]]]


class TrackMetadata(BaseModel):
    iqengine_geotrack: Optional[GeoTrack] | None
    description: Optional[str] | None
    account: str
    container: str
