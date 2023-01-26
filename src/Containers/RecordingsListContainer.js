// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import { connect } from 'react-redux';
import {
  updateConnectionMetaFileHandle,
  updateConnectionDataFileHandle,
  updateConnectionRecording,
  updateConnectionBlobClient,
  updateConnectionAccountName,
  updateConnectionContainerName,
  updateConnectionSasToken,
} from '../Store/Actions/ConnectionActions';
import RecordingsBrowser from '../Components/RecordingsBrowser/RecordingsBrowser';
import { updateBlobTotalBytes } from '../Store/Actions/BlobActions';
import { fetchRecordingsList } from '../Store/Actions/RecordingsListActions';

function mapStateToProps(state) {
  const { recordingsListReducer, connectionReducer } = state;
  return {
    recording: { ...recordingsListReducer },
    connection: { ...connectionReducer },
  };
}

function mapDispatchToProps(dispatch) {
  return {
    updateConnectionMetaFileHandle: (handle) => dispatch(updateConnectionMetaFileHandle(handle)),
    updateConnectionDataFileHandle: (handle) => dispatch(updateConnectionDataFileHandle(handle)),
    updateConnectionRecording: (recording) => dispatch(updateConnectionRecording(recording)),
    updateBlobTotalBytes: (size) => dispatch(updateBlobTotalBytes(size)),
    updateConnectionBlobClient: (client) => dispatch(updateConnectionBlobClient(client)),
    updateConnectionAccountName: (x) => dispatch(updateConnectionAccountName(x)),
    updateConnectionContainerName: (x) => dispatch(updateConnectionContainerName(x)),
    updateConnectionSasToken: (x) => dispatch(updateConnectionSasToken(x)),
    fetchRecordingsList: (x) => dispatch(fetchRecordingsList(x)),
  };
}

const RecordingsListContainer = connect(mapStateToProps, mapDispatchToProps)(RecordingsBrowser);

export default RecordingsListContainer;
