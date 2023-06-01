export interface SigMFMetadata {
    "global": {
      "core:datatype": String
      "core:sample_rate"?: Number
      "core:version": String
      "core:num_channels"?: Number
      "core:sha512"?: String
      "core:offset"?: Number
      "core:description"?: String
      "core:author"?: String
      "core:meta_doi"?: String
      "core:data_doi"?: String
      "core:recorder"?: String
      "core:license"?: String
      "core:hw"?: String
      "core:dataset"?: String
      "core:trailing_bytes"?: Number
      "core:metadata_only"?: Boolean
      "core:geolocation"?: Object
      "core:extensions"?: Array<Object>
      "core:collection"?: String
      [key: string]: any
    }
    "captures": Array<CaptureSegment>
    "annotations": Array<Annotation>
  }

  export interface CaptureSegment {
    "core:sample_start": Number
    "core:global_index"?: Number
    "core:header_bytes"?: Number
    "core:frequency"?: Number
    "core:datetime"?: String
    [key: string]: any
  }

  export interface Annotation {
    "core:sample_start": Number
    "core:sample_count"?: Number
    "core:generator"?: String
    "core:label"?: String
    "core:comment"?: String
    "core:freq_lower_edge"?: Number
    "core:freq_upper_edge"?: Number
    "core:uuid"?: String
    "capture_details"?: String
    [key: string]: any
  }
