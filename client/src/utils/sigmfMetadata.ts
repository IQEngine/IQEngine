import { BlobClient } from '@azure/storage-blob';
import { dataTypeToBytesPerIQSample } from './selector';
import { FileWithDirectoryAndFileHandle } from 'browser-fs-access';
import { metadataValidator } from './validators';
export class SigMFMetadata {
  global: {
    'antenna:gain'?: number;
    'antenna:type'?: string;
    'core:datatype': string;
    'core:sample_rate'?: number;
    'core:version': string;
    'core:num_channels'?: number;
    'core:sha512'?: string;
    'core:offset'?: number;
    'core:description'?: string;
    'core:author'?: string;
    'core:meta_doi'?: string;
    'core:data_doi'?: string;
    'core:recorder'?: string;
    'core:license'?: string;
    'core:hw'?: string;
    'core:dataset'?: string;
    'core:trailing_bytes'?: number;
    'core:metadata_only'?: boolean;
    'core:geolocation'?: object;
    'core:extensions'?: Array<object>;
    'core:collection'?: string;
    'traceability:revision'?: number;
    'traceability:origin'?: TraceabilityOrigin;
    'traceability:sample_length'?: number;
    [key: string]: any;
  };
  captures: Array<CaptureSegment>;
  annotations: Array<Annotation>;

  // Those 3 properties should be removed after the react query is working properly
  metadataFileHandle?: FileWithDirectoryAndFileHandle;
  dataFileHandle?: FileWithDirectoryAndFileHandle;
  dataClient?: BlobClient;

  getCapture(sampleStart: number): CaptureSegment {
    let capture = this.captures[0];
    for (let c of this.captures) {
      if (c['core:sample_start'] > sampleStart) break;

      capture = c;
    }
    return capture;
  }

  getBytesPerIQSample(): number {
    return dataTypeToBytesPerIQSample(this.global['core:datatype']) ?? 2;
  }

  getVersion() {
    return String(this.global['core:version']);
  }

  getOffset() {
    return Number(this.global['core:offset'] ?? 0);
  }

  getOrigin() {
    return this.global['traceability:origin'];
  }

  getSampleRate() {
    return Number(this.global['core:sample_rate'] ?? 1e6);
  }

  getTotalSamples() {
    return Number(this.global['traceability:sample_length'] ?? 0);
  }

  getFrequency() {
    return Number(this.captures[0]['core:frequency'] ?? 1e6);
  }
  getAuthor() {
    return String(this.global['core:author'] ?? '')
      .replace('<', '')
      .replace('>', '');
  }
  getFilePath() {
    return this.global['traceability:origin'].file_path;
  }
  getFileName() {
    return this.global['traceability:origin'].file_path.split('/').pop();
  }
  getDataFileName() {
    return this.getFileName() + '.sigmf-data';
  }
  getMetadataFileName() {
    return this.getFileName() + '.sigmf-meta';
  }
  getEmail() {
    const emailName = this.getAuthor();
    let author = emailName.split('<');
    let email: any;
    if (author.length === 1) {
      email = null;
    } else {
      email = author[1].split('>');
      email = email[0].trim();
    }
    return email;
  }
  getFullFilePath() {
    const origin = this.global['traceability:origin'];
    const type = origin?.type ?? 'local';
    if (type === 'local') {
      return origin.file_path;
    } else if (type === 'azure_blob') {
      return `https://${origin.account}.blob.core.windows.net/${origin.container}/${origin.file_path}`;
    } else if (type === 'api') {
      return `/api/datasources/${origin.account}/${origin.container}/${origin.file_path}`; // see backend- api/app/iq_router.py
    } else {
      return `${origin.account}/${origin.container}/${origin.file_path}`;
    }
  }

  getCanonicalFilePath() {
    const origin = this.global['traceability:origin'];
    if (origin) {
      return `${origin.account}/${origin.container}/${origin.file_path}`;
    }
    return '';
  }

  getShortDescription() {
    let shortDescription = this.global['core:description'] ?? '';
    shortDescription = shortDescription.substring(0, 60);
    if (shortDescription.length === 60) {
      shortDescription += '...';
    }
    return shortDescription;
  }

  getThumbnailUrl() {
    return this.getFullFilePath() + '.jpg';
  }
  getDataUrl() {
    return this.getFullFilePath() + '.sigmf-data'; // see api/app/iq_router.py
  }
  getMetadataUrl() {
    /* old way where metadata would show up in the browser, not be downloaded
    const origin = this.global['traceability:origin'];
    const type = origin?.type ?? 'local';
    if (type === 'api') {
      return this.getFullFilePath() + '/meta'; // see api/app/metadata_router.py
    } else return this.getFullFilePath() + '.sigmf-meta';
    */
    return this.getFullFilePath() + '.sigmf-meta'; // see api/app/iq_router.py
  }
  getDataType() {
    return this.global['core:datatype'] ?? '';
  }
  getDataTypeDescription() {
    return this.global['core:datatype']
      .replace('c', 'complex\n')
      .replace('r', 'real\n')
      .replace('f', 'float\n')
      .replace('i', 'signed int\n')
      .replace('u', 'unsigned int\n')
      .replace('8', '8 bits')
      .replace('16', '16 bits')
      .replace('32', '32 bits')
      .replace('64', '64 bits')
      .replace('_le', '');
  }
  getDescription() {
    return String(this.global['core:description'] ?? '');
  }

  getLengthInMillionIQSamples() {
    return Number((this.global['traceability:sample_length'] ?? 0) / 1e6);
  }

  getLengthInIQSamples() {
    return Number(this.global['traceability:sample_length'] ?? 0);
  }

  getLengthInBytes() {
    return Number(this.getLengthInIQSamples() * this.getBytesPerIQSample());
  }

  getCenterFrequency() {
    for (let i = 0; i < this.captures.length; i++) {
      if (this.captures[i]['core:frequency']) {
        return Number(this.captures[i]['core:frequency']);
      }
    }
    return 0;
  }

  getSigMFRaw() {
    return JSON.stringify(
      {
        global: this.global ?? {},
        captures: this.captures ?? [],
        annotations: this.annotations ?? [],
      },
      null,
      4
    );
  }

  metadataValidation() {
    return metadataValidator(this.getSigMFRaw());
  }
}

export class CaptureSegment {
  'core:sample_start': number;
  'core:global_index'?: number;
  'core:header_bytes'?: number;
  'core:frequency'?: number;
  'core:datetime'?: string;
  [key: string]: any;
}

export class TraceabilityOrigin {
  type: string;
  account: string;
  container: string;
  file_path: string;
}

export class GeoTrack {
  type: string;
  coordinates: Array<Array<number>>;
}

export class Track {
  iqengine_geotrack: GeoTrack;
  description: string;
  account: string;
  container: string;
}

export class Annotation {
  'core:sample_start': number;
  'core:sample_count'?: number;
  'core:generator'?: string;
  'core:label'?: string;
  'core:comment'?: string;
  'core:freq_lower_edge'?: number;
  'core:freq_upper_edge'?: number;
  'core:uuid'?: string;
  capture_details?: string;

  getLabel() {
    return String(this['core:label'] ?? this['core:description'] ?? '');
  }

  getComment() {
    return String(this['core:comment'] ?? '');
  }

  getShortComment() {
    let shortComment = this.getComment();
    shortComment = shortComment.substring(0, 240);
    if (shortComment.length === 240) {
      shortComment += '...';
    }
    return shortComment;
  }

  getRaw() {
    return JSON.stringify(
      {
        'core:sample_start': this['core:sample_start'] ?? 0,
        'core:sample_count': this['core:sample_count'] ?? 0,
        'core:generator': this['core:generator'],
        'core:label': this['core:label'],
        'core:comment': this['core:comment'],
        'core:freq_lower_edge': this['core:freq_lower_edge'] ?? 0,
        'core:freq_upper_edge': this['core:freq_upper_edge'] ?? 0,
        'core:uuid': this['core:uuid'],
        capture_details: this.capture_details,
      },
      (key, value) => {
        if (value !== null) {
          return value;
        }
      },
      4
    );
  }

  [key: string]: any;
}
