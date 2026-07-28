// Helpers for the 'url' data source: a recording that is nothing more than a
// pair of publicly readable HTTP URLs (a .sigmf-meta and a .sigmf-data), with
// no IQEngine backend, Azure account or locally picked directory behind it.
//
// The recording-view route is /view/:type/:account/:container/:filePath, so a
// URL recording packs its two URLs into the account and container segments:
//
//   account   base64url(metadata URL)
//   container base64url(data URL)
//   filePath  display name, e.g. "cellular_downlink_880MHz"
//
// The two are encoded separately because they do not have to share a host --
// a site can serve the small .sigmf-meta itself while the large .sigmf-data
// lives in object storage. base64url keeps them free of '/' and '%', which
// would otherwise have to survive path-segment normalisation on the way to the
// SPA. Relative URLs ("/example_recordings/x.sigmf-data") are allowed and
// resolve against the page, so a site hosting IQEngine alongside its own
// recordings does not need to know its own origin.

export const CLIENT_TYPE_URL = 'url';

export function encodeUrlParam(url: string): string {
  const bytes = new TextEncoder().encode(url);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeUrlParam(param: string): string {
  const base64 = param.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const bytes = Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export interface UrlRecordingLocation {
  metaUrl: string;
  dataUrl: string;
}

export function urlRecordingLocation(account: string, container: string): UrlRecordingLocation {
  return { metaUrl: decodeUrlParam(account), dataUrl: decodeUrlParam(container) };
}

// Byte length of the data file, needed for the sample count when the metadata
// does not carry one. HEAD is tried first; hosts that reject it still have to
// answer a one-byte range request, whose Content-Range carries the total.
export async function fetchDataFileByteLength(dataUrl: string): Promise<number> {
  const head = await fetch(dataUrl, { method: 'HEAD' }).catch(() => null);
  const headLength = Number(head?.headers.get('content-length'));
  if (head?.ok && Number.isFinite(headLength) && headLength > 0) {
    return headLength;
  }

  const probe = await fetch(dataUrl, { headers: { Range: 'bytes=0-0' } });
  if (!probe.ok) {
    throw new Error(`${probe.status} ${probe.statusText} fetching ${dataUrl}`);
  }
  const total = Number(probe.headers.get('content-range')?.split('/').pop());
  if (Number.isFinite(total) && total > 0) {
    return total;
  }
  const probeLength = Number(probe.headers.get('content-length'));
  if (Number.isFinite(probeLength) && probeLength > 0) {
    return probeLength; // range ignored, so this is the whole file
  }
  throw new Error(`could not determine the size of ${dataUrl}`);
}

// One block of the data file. Falls back to slicing client-side when the host
// ignores Range and hands back the whole file, so a plain static file server
// still works (slowly) instead of returning misaligned samples.
export async function fetchIQRange(
  dataUrl: string,
  offsetBytes: number,
  countBytes: number,
  bytesPerIQSample: number,
  signal: AbortSignal
): Promise<ArrayBuffer> {
  const response = await fetch(dataUrl, {
    headers: { Range: `bytes=${offsetBytes}-${offsetBytes + countBytes - 1}` },
    signal: signal,
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} fetching ${dataUrl}`);
  }
  let buffer = await response.arrayBuffer();
  if (response.status !== 206 && buffer.byteLength > countBytes) {
    buffer = buffer.slice(offsetBytes, offsetBytes + countBytes);
  }
  // A read that runs into the end of the file can stop mid-sample; the typed
  // array views used downstream need whole samples.
  const usable = Math.floor(buffer.byteLength / bytesPerIQSample) * bytesPerIQSample;
  return usable === buffer.byteLength ? buffer : buffer.slice(0, usable);
}
