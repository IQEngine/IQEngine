// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import { connect } from 'react-redux';
import RepoBrowser from '../Components/RepoBrowser/RepoBrowser';
import {
  updateConnectionAccountName,
  updateConnectionContainerName,
  updateConnectionDomainName,
  updateConnectionSasToken,
  updateConnectionMetaFileHandle,
  updateConnectionDataFileHandle,
  updateConnectionRecording,
} from '../Store/Actions/ConnectionActions';
import { fetchRecordingsList } from '../Store/Actions/RecordingsListActions';

function mapStateToProps(state) {
  const { connectionReducer } = state;
  return {
    connection: { ...connectionReducer },
  };
}

function mapDispatchToProps(dispatch) {
  return {
    updateConnectionAccountName: (accountName) => dispatch(updateConnectionAccountName(accountName)),
    updateConnectionContainerName: (containerName) => dispatch(updateConnectionContainerName(containerName)),
    updateConnectionDomainName: (containerName) => dispatch(updateConnectionDomainName(containerName)),
    updateConnectionSasToken: (token) => dispatch(updateConnectionSasToken(token)),
    updateConnectionMetaFileHandle: (handle) => dispatch(updateConnectionMetaFileHandle(handle)),
    updateConnectionDataFileHandle: (handle) => dispatch(updateConnectionDataFileHandle(handle)),
    updateConnectionRecording: (recording) => dispatch(updateConnectionRecording(recording)),
    fetchRecordingsList: (connection) => dispatch(fetchRecordingsList(connection)),
  };
}

const RepoBrowserContainer = connect(mapStateToProps, mapDispatchToProps)(RepoBrowser);

export default RepoBrowserContainer;
