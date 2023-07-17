// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import Plot from 'react-plotly.js';
import React, { useEffect, useState } from 'react';

export const AnnotationModal = (props) => {
  let { setShowModal, fileName, annotations } = props;

  console.log(annotations);

  // Pie chart data
  const counts = {};
  for (let item in annotations) {
    const label = item['core:label'];
    if (label in counts) {
      counts[label] = counts[label] + 1;
    } else {
      counts[label] = 1;
    }
  }
  console.log(counts);

  const annotationsData = annotations?.map((item, index) => {
    const deepItemCopy = JSON.parse(JSON.stringify(item));
    delete deepItemCopy['core:sample_start'];
    delete deepItemCopy['core:sample_count'];
    delete deepItemCopy['core:freq_lower_edge'];
    delete deepItemCopy['core:freq_upper_edge'];
    delete deepItemCopy['core:label'];
    return (
      <tr key={index} className="h-12">
        <td>{item['core:sample_start']}</td>
        <td>{item['core:sample_count']}</td>
        <td>{item['core:freq_lower_edge'] / 1e6}</td>
        <td>{item['core:freq_upper_edge'] / 1e6}</td>
        <td>{item['core:label']}</td>
        <td>{JSON.stringify(deepItemCopy, null, 4).replaceAll('{', '').replaceAll('}', '').replaceAll('"', '')}</td>
      </tr>
    );
  });

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
                <th>Label</th>
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
