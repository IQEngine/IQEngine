// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import Plot from 'react-plotly.js';
import React, { useEffect, useState } from 'react';

export const AnnotationModal = (props) => {
  let { setShowModal, annotationsData, fileName } = props;

  return (
    <dialog className="modal modal-open w-full h-full">
      <form method="dialog" className="modal-box  max-w-full">
        <h3 className="font-bold text-lg text-primary">{fileName}</h3>
        <button
          className="absolute right-2 top-2 text-secondary font-bold"
          onClick={() => {
            setShowModal(false);
          }}
        >
          ✕
        </button>
        <div className="grid justify-items-stretch">
          <table className="text-base-content">
            <thead className="text-primary border-b-2 h-12 border-accent">
              <tr>
                <th>Sample Start</th>
                <th>Sample Count</th>
                <th>Frequency Min [MHz]</th>
                <th>Frequency Max [MHz]</th>
                <th>Description</th>
                <th>Other</th>
              </tr>
            </thead>
            <tbody>{annotationsData}</tbody>
          </table>
        </div>
      </form>
    </dialog>
  );
};
