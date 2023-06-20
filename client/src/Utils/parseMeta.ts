// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import { dataTypeToBytesPerSample } from './selector';

export default function parseMeta(
  json_string: any,
  baseUrl: any,
  fName: any,
  metaFileHandle: any,
  dataFileHandle: any
) {
  let obj;
  try {
    obj = JSON.parse(json_string); // string to JSON
  } catch (e) {
    console.debug('Error parsing meta file:', fName);
    return null;
  }
  const emailName = obj['global']['core:author'] ?? '';
  var author = emailName.split('<');
  var email;
  if (author.length === 1) {
    email = null;
  } else {
    email = author[1].split('>');
    email = email[0].trim();
    author = author[0].trim();
  }

  const bytesPerSample = dataTypeToBytesPerSample(obj['global']['core:datatype']);

  let shortDescription = obj['global']['core:description'] ?? '';
  shortDescription = shortDescription.substring(0, 60);
  if (shortDescription.length === 60) {
    shortDescription += '...';
  }

  return {
    name: fName,
    sampleRate: (obj['global']['core:sample_rate'] ?? 1e6) / 1e6, // in MHz
    dataType: obj['global']['core:datatype']
      .replace('c', 'complex\n')
      .replace('r', 'real\n')
      .replace('f', 'float\n')
      .replace('i', 'signed int\n')
      .replace('u', 'unsigned int\n')
      .replace('8', '8 bits')
      .replace('16', '16 bits')
      .replace('32', '32 bits')
      .replace('64', '64 bits')
      .replace('_le', ''),
    coreDataType: obj['global']['core:datatype'],
    frequency: (obj['captures'][0]['core:frequency'] ?? 1e6) / 1e6, // in MHz
    annotations: obj['annotations'],
    numberOfAnnotation: obj['annotations'].length,
    numberOfCaptures: obj['captures'].length,
    author: author,
    email: email,
    type: 'file',
    thumbnailUrl: baseUrl + fName + '.jpeg',
    dataUrl: baseUrl + fName + '.sigmf-data',
    metaUrl: baseUrl + fName + '.sigmf-meta',
    metaFileHandle: metaFileHandle,
    dataFileHandle: dataFileHandle,
    bytesPerSample: bytesPerSample,
    description: obj['global']['core:description'] ?? '',
    shortDescription: shortDescription,
  };
}
