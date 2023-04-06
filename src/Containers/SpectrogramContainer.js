// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import { connect } from 'react-redux';
import SpectrogramPage from '../Components/Spectrogram/SpectrogramPage';
import {
  updateConnectionAccountName,
  updateConnectionContainerName,
  updateConnectionSasToken,
  updateConnectionMetaFileHandle,
  updateConnectionDataFileHandle,
  updateConnectionRecording,
  updateConnectionBlobClient,
  resetConnection,
} from '../Store/Actions/ConnectionActions';
import {
  fetchMoreData,
  resetBlob,
  updateBlobTaps,
  updateBlobPythonSnippet,
  updateBlobTotalBytes,
} from '../Store/Actions/BlobActions';
import { fetchMetaDataBlob, resetMeta } from '../Store/Actions/FetchMetaActions';
import { fetchMinimap } from '../Store/Actions/MinimapActions';

function mapStateToProps(state) {
  const { connectionReducer, blobReducer, fetchMetaReducer, minimapReducer } = state;
  return {
    connection: { ...connectionReducer },
    blob: { ...blobReducer },
    meta: { ...fetchMetaReducer },
    minimap: { ...minimapReducer },
  };
}

function mapDispatchToProps(dispatch) {
  return {
    // The order of these dont matter, it's not actually calling the functions here
    updateConnectionAccountName: (accountName) => dispatch(updateConnectionAccountName(accountName)),
    updateConnectionContainerName: (containerName) => dispatch(updateConnectionContainerName(containerName)),
    updateConnectionSasToken: (token) => dispatch(updateConnectionSasToken(token)),
    updateConnectionMetaFileHandle: (handle) => dispatch(updateConnectionMetaFileHandle(handle)),
    updateConnectionDataFileHandle: (handle) => dispatch(updateConnectionDataFileHandle(handle)),
    updateConnectionRecording: (recording) => dispatch(updateConnectionRecording(recording)),
    updateConnectionBlobClient: (client) => dispatch(updateConnectionBlobClient(client)),
    updateBlobTaps: (taps) => dispatch(updateBlobTaps(taps)),
    updateBlobPythonSnippet: (pythonSnippet) => dispatch(updateBlobPythonSnippet(pythonSnippet)),
    updateBlobTotalBytes: (n) => dispatch(updateBlobTotalBytes(n)),
    fetchMoreData: (args) => dispatch(fetchMoreData(args)),
    fetchMetaDataBlob: (connection) => dispatch(fetchMetaDataBlob(connection)),
    resetConnection: () => dispatch(resetConnection()),
    resetMeta: () => dispatch(resetMeta()),
    resetBlob: () => dispatch(resetBlob()),
    fetchMinimap: (args) => dispatch(fetchMinimap(args)),
  };
}

const SpectrogramContainer = connect(mapStateToProps, mapDispatchToProps)(SpectrogramPage);

export default SpectrogramContainer;
