// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import Plot from 'react-plotly.js';
import React, { useEffect, useState } from 'react';
import { Annotation } from '@/utils/sigmfMetadata';
import { template } from '@/utils/plotlyTemplate';

interface Props {
  annotations: Annotation[];
}

export const FileAnnotationData = ({ annotations }: Props) => {
  const [pieChartValues, setPieChartValues] = useState([]); // so that it can be directly used in the pie chart https://plotly.com/javascript/pie-charts/
  const [pieChartLabels, setPieChartLabels] = useState([]);

  // Calc Pie chart data
  useEffect(() => {
    const counts = {};
    annotations.forEach((item) => {
      const label = item.getLabel();
      counts[label] = (counts[label] ?? 0) + 1;
    });
    const vals = [];
    const labels = [];
    Object.entries(counts).forEach(([k, v]) => {
      labels.push(k);
      vals.push(v);
    });
    setPieChartValues(vals);
    setPieChartLabels(labels);
  }, [annotations]);

  const annotationsData = annotations?.map((item, index) => {
    const deepItemCopy = JSON.parse(JSON.stringify(item));
    // remove the main fields so that everything left is shown in "other"
    delete deepItemCopy['core:sample_start'];
    delete deepItemCopy['core:sample_count'];
    delete deepItemCopy['core:freq_lower_edge'];
    delete deepItemCopy['core:freq_upper_edge'];
    delete deepItemCopy['core:label'];
    delete deepItemCopy['core:description'];
    return (
      <tr key={index} className="h-12">
        <td>{item['core:sample_start']}</td>
        <td>{item['core:sample_count']}</td>
        <td>{item['core:freq_lower_edge'] / 1e6}</td>
        <td>{item['core:freq_upper_edge'] / 1e6}</td>
        <td>{item.getLabel()}</td>
        <td>{JSON.stringify(deepItemCopy, null, 4).replaceAll('{', '').replaceAll('}', '').replaceAll('"', '')}</td>
      </tr>
    );
  });

  return (
    <div>
        <div>
          <Plot
            data={[
              {
                values: pieChartValues,
                labels: pieChartLabels,
                type: 'pie',
                hole: 0.4,
                automargin: true,
                textposition: 'outside',
                textinfo: 'label+percent+value',
              },
            ]}
            layout={{
              showlegend: false,
              width: 250,
              height: 250,
              template: template,
              margin: { t: 0, b: 0, l: 0, r: 0 },
            }}
          />
        </div>

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
        </div>
  );
};
