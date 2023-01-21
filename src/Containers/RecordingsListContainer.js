// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { connect } from 'react-redux';
import {
  updateConnectionMetaFileHandle,
  updateConnectionDataFileHandle,
  updateConnectionRecording,
  updateConnectionBlobClient,
} from '../Store/Actions/ConnectionActions';
import RecordingsBrowser from '../Components/RecordingsBrowser/RecordingsBrowser';
import { updateBlobTotalBytes } from '../Store/Actions/BlobActions';

function mapStateToProps(state) {
  const { recordingsListReducer } = state;
  return {
    recording: { ...recordingsListReducer },
  };
}

function mapDispatchToProps(dispatch) {
  return {
    updateConnectionMetaFileHandle: (handle) => dispatch(updateConnectionMetaFileHandle(handle)),
    updateConnectionDataFileHandle: (handle) => dispatch(updateConnectionDataFileHandle(handle)),
    updateConnectionRecording: (recording) => dispatch(updateConnectionRecording(recording)),
    updateBlobTotalBytes: (size) => dispatch(updateBlobTotalBytes(size)),
    updateConnectionBlobClient: (client) => dispatch(updateConnectionBlobClient(client)),
  };
}

const RecordingsListContainer = connect(mapStateToProps, mapDispatchToProps)(RecordingsBrowser);

export default RecordingsListContainer;
