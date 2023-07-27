import React from 'react';
import { useParams } from 'react-router-dom';

export function RecordingViewPage() {
  const { type, account, container, filePath } = useParams();
  return (
    <div>
      <h1>Recording View</h1>
      <p>type: {type}</p>
      <p>account: {account}</p>
      <p>container: {container}</p>
      <p>filePath: {filePath}</p>
    </div>
  );
}
