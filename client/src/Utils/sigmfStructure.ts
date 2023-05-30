
export interface SigMFMetadata {
    global: {
      datatype: String
      sample_rate?: Number
      version: String
      num_channels?: Number
      sha512?: String
      offset?: Number
      description?: String
      author?: String
      meta_doi?: String
      data_doi?: String
      recorder?: String
      license?: String
      hw?: String
      dataset?: String
      trailing_bytes?: Number
      metadata_only?: Boolean
      geolocation?: Object
      extensions?: Array<Object>
      collection?: String;
    }
    captures: Array<CaptureSegment>
    annotations: Array<Annotation>;
  }
  
  export interface CaptureSegment {
    sample_start: Number
    global_index?: Number
    header_bytes?: Number
    frequency?: Number
    datetime?: String;
  }
  
  export interface Annotation {
    sample_start: Number
    sample_count?: Number
    generator?: String
    label?: String
    comment?: String
    freq_lower_edge?: Number
    freq_upper_edge?: Number
    uuid?: String;
  }