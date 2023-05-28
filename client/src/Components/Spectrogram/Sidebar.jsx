// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React from 'react';
import SettingsPane from './SettingsPane';
import { DetectorPane } from './DetectorPane';
import InfoPane from './InfoPane';

const Sidebar = (props) => {
  return (
    <div className="flex flex-col w-64 ml-3">
      <details open>
        <summary className="pl-2 bg-iqengine-primary outline outline-1 outline-iqengine-primary text-lg text-black hover:bg-green-800">
          Settings
        </summary>
        <div className="outline outline-1 outline-iqengine-primary p-2">
          <SettingsPane
            updateMagnitudeMax={props.updateMagnitudeMax}
            updateMagnitudeMin={props.updateMagnitudeMin}
            updateFftsize={props.updateFftsize}
            updateWindowChange={props.updateWindowChange}
            handleAutoScale={props.handleAutoScale}
            autoscale={props.autoscale}
            magnitudeMax={props.fft.magnitudeMax}
            magnitudeMin={props.fft.magnitudeMin}
            toggleCursors={props.toggleCursors}
            toggleIncludeRfFreq={props.toggleIncludeRfFreq}
            updatePythonSnippet={props.updatePythonSnippet}
            updateZoomLevel={props.updateZoomLevel}
          />
        </div>
      </details>

      <details>
        <summary className="pl-2 mt-2 bg-iqengine-primary outline outline-1 outline-iqengine-primary text-lg text-black hover:bg-green-800">
          Detector
        </summary>
        <div className="outline outline-1 outline-iqengine-primary p-2">
          <DetectorPane cursorsEnabled={props.cursorsEnabled} handleProcessTime={props.handleProcessTime} />
        </div>
      </details>

      <details>
        <summary className="pl-2 mt-2 bg-iqengine-primary outline outline-1 outline-iqengine-primary text-lg text-black hover:bg-green-800">
          Metadata
        </summary>
        <div className="outline outline-1 outline-iqengine-primary p-2">
          <InfoPane />
        </div>
      </details>
    </div>
  );
};

export { Sidebar };
