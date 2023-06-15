// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React, { useState, useEffect } from 'react';
import { configQuery } from '../../api/config/queries';
import { useAppDispatch } from '@/Store/hooks';
import { Annotation, SigMFMetadata } from '@/Utils/sigmfMetadata';
import { matchPath } from 'react-router-dom';

export interface PluginsPaneProps {
  cursorsEnabled: boolean;
  handleProcessTime: () => { trimmedSamples: number[]; startSampleOffset: number };
  meta: SigMFMetadata;
  setMeta: (meta: SigMFMetadata) => void;
}

export const PluginsPane = ({ cursorsEnabled, handleProcessTime, meta, setMeta }: PluginsPaneProps) => {
  const [pluginsList, setPluginsList] = useState([]);
  const [selectedPlugin, setSelectedPlugin] = useState('default');
  const [pluginParams, setPluginParams] = useState({});
  const [value, setValue] = useState(0); // integer state used to force rerender
  const dispatch = useAppDispatch();
  const config = configQuery();
  useEffect(() => {
    if (!config.data || !config.data.pluginsEndpoint) return;
    let pluginsEndpoint = 'http://127.0.0.1:8000/plugins/';
    // In local mode, CONNECTION_INFO isn't defined
    if (config.data.pluginsEndpoint) {
      pluginsEndpoint = config.data.pluginsEndpoint;
    }
    fetch(pluginsEndpoint, { method: 'GET' })
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        console.debug('Plugins:', data);
        setPluginsList(data);
      })
      .catch((error) => {
        console.debug(error);
      });
  }, [config?.data?.pluginsEndpoint]);

  const handleChangePlugin = (e) => {
    if (!config.data || !config.data.pluginsEndpoint) return;
    setSelectedPlugin(e.target.value);
    setPluginParams({}); // in case something goes wrong
    // Fetch the custom params for this plugin
    fetch(config.data.pluginsEndpoint + e.target.value, { method: 'GET' })
      .then(function (response) {
        if (response.status === 404) {
          return {};
        }
        return response.json();
      })
      .then(function (data) {
        console.debug('Plugin Params:', data);
        setPluginParams(data);
      });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!cursorsEnabled) {
      alert('First enable cursors and choose a region of time to run the plugin on');
      return;
    }

    // this does the tile calc and gets the right samples in currentSamples
    const { trimmedSamples, startSampleOffset } = handleProcessTime();

    const sampleRate = meta['global']['core:sample_rate'];
    const freq = meta['captures'][0]['core:frequency'];

    // We can only send normal Arrays over JSON for some reason, so convert it
    const newSamps = Array.from(trimmedSamples);

    let body = {
      data_input: [
        {
          samples: newSamps,
          sample_rate: sampleRate,
          center_freq: freq,
          data_type: 'iq/cf32_le',
        },
      ],
      custom_params: {},
    };
    // Add custom params
    for (const [key, value] of Object.entries(pluginParams)) {
      if (value['type'] === 'integer') {
        body['custom_params'][key] = parseInt(value['default']); // remember, we updated default with whatever the user enters
      } else if (value['type'] === 'number') {
        body['custom_params'][key] = parseFloat(value['default']);
      } else {
        body['custom_params'][key] = value['default'];
      }
    }
    console.debug(body);

    fetch(config.data.pluginsEndpoint + selectedPlugin, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        console.debug('Plugin Status:', data.status);
        //console.debug('data:', data);
        if (data.data_output.length > 0) {
          console.log(data.data_output);
        }
        if (data.annotations) {
          for (let i = 0; i < data.annotations.length; i++) {
            data.annotations[i]['core:sample_start'] += startSampleOffset;
          }
          let newAnnotations = data.annotations.map((annotation) => Object.assign(new Annotation(), annotation));
          console.log(newAnnotations);
          // for now replace the existing annotations
          if (true) {
            meta['annotations'] = newAnnotations;
          } else {
            meta['annotations'].push(...newAnnotations);
            meta['annotations'] = meta['annotations'].flat();
          }
          let newMeta = Object.assign(new SigMFMetadata(), meta);
          setMeta(newMeta);
        }
      });
  };

  const handleChange = (e) => {
    pluginParams[e.target.name]['default'] = e.target.value; // the schema uses default so we'll just replace it with the new value
    setPluginParams(pluginParams);
    setValue((value) => value + 1); // update state to force render
  };

  return (
    <div className="pluginForm" id="pluginFormId" onSubmit={handleSubmit}>
      <label className="label">
        Plugin:
        <select className="rounded bg-base-content text-base-100" value={selectedPlugin} onChange={handleChangePlugin}>
          <option disabled value="default">
            Select a Plugin
          </option>
          {pluginsList.map((pluginName, index) => (
            <option key={index} value={pluginName}>
              {pluginName}
            </option>
          ))}
        </select>
      </label>
      {Object.keys(pluginParams).length > 0 && (
        <>
          <div className="mb-3">
            {Object.keys(pluginParams).map((key, index) => (
              <div key={index + 100000}>
                <label className="label pb-0">{pluginParams[key]['title']}</label>
                <input
                  type={pluginParams[key]['type']}
                  name={key}
                  value={pluginParams[key]['default']}
                  onChange={handleChange}
                  className="h-8 rounded text-base-100 ml-1 pl-2"
                />
              </div>
            ))}
          </div>
          <button onClick={handleSubmit}>Run Plugin</button>
        </>
      )}
    </div>
  );
};
