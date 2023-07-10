// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React from 'react';
import SettingsPane from './SettingsPane';
import { PluginsPane } from './components/PluginsPane';
import { SigMFMetadata } from '@/utils/sigmfMetadata';

export interface SidebarProps {
  updateMagnitudeMax: (magnitudeMax: number) => void;
  updateMagnitudeMin: (magnitudeMin: number) => void;
  updateFftsize: (fftSize: number) => void;
  updateWindowChange: (fftWindow: string) => void;
  magnitudeMax: number;
  magnitudeMin: number;
  toggleCursors: (e: React.ChangeEvent<HTMLInputElement>) => void;
  toggleIncludeRfFreq: (e: React.ChangeEvent<HTMLInputElement>) => void;
  cursorsEnabled: boolean;
  handleProcessTime: (processTime: number) => void;
  zoomLevel: number;
  taps: [];
  setTaps: (taps: []) => void;
  setZoomLevel: (zoomLevel: number) => void;
  windowFunction: string;
  pythonSnippet: string;
  setPythonSnippet: (pythonSnippet: string) => void;
  meta: SigMFMetadata;
  setMeta: (meta: SigMFMetadata) => void;
  colorMap: any;
  setColorMap: any;
}

const Sidebar = (props) => {
  return (
    <div className="flex flex-col w-64 ml-3">
      <details open>
        <summary className="pl-2 bg-primary outline outline-1 outline-primary text-lg text-base-100 hover:bg-green-800">
          Settings
        </summary>
        <div className="outline outline-1 outline-primary p-2">
          <SettingsPane
            meta={props.meta}
            updateMagnitudeMax={props.updateMagnitudeMax}
            updateMagnitudeMin={props.updateMagnitudeMin}
            updateFftsize={props.updateFftsize}
            updateWindowChange={props.updateWindowChange}
            magnitudeMax={props.magnitudeMax}
            magnitudeMin={props.magnitudeMin}
            toggleCursors={props.toggleCursors}
            toggleIncludeRfFreq={props.toggleIncludeRfFreq}
            updateZoomLevel={props.updateZoomLevel}
            zoomLevel={props.zoomLevel}
            taps={props.taps}
            setTaps={props.setTaps}
            windowFunction={props.windowFunction}
            pythonSnippet={props.pythonSnippet}
            setPythonSnippet={props.setPythonSnippet}
            handleProcessTime={props.handleProcessTime}
            colorMap={props.colorMap}
            setColorMap={props.setColorMap}
          />
        </div>
      </details>

      <details>
        <summary className="pl-2 mt-2 bg-primary outline outline-1 outline-primary text-lg text-base-100 hover:bg-green-800">
          Plugins
        </summary>
        <div className="outline outline-1 outline-primary p-2">
          {props.meta && (
            <PluginsPane
              cursorsEnabled={props.cursorsEnabled}
              handleProcessTime={props.handleProcessTime}
              meta={props.meta}
              setMeta={props.setMeta}
            />
          )}
        </div>
      </details>
    </div>
  );
};

export { Sidebar };
