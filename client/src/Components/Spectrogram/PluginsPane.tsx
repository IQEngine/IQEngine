// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React, { useState, useEffect } from 'react';
import { configQuery } from '@/api/config/queries';
import { useAppDispatch } from '@/Store/hooks';
import { Annotation, SigMFMetadata } from '@/Utils/sigmfMetadata';
import { TimePlot } from './TimePlot';
import { FrequencyPlot } from './FrequencyPlot';
import { IQPlot } from './IQPlot';
import { Layer, Image, Stage } from 'react-konva';
import { convertFloat32ArrayToBase64, convertBase64ToFloat32Array } from '@/Utils/rfFunctions';
import { colMaps } from '@/Utils/colormap';
import { fftshift } from 'fftshift';
import { FFT } from '@/Utils/fft';

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
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSamples, setModalSamples] = useState([]);
  const [modalSpectrogram, setmodalSpectrogram] = useState(null);
  const [value, setValue] = useState(0); // integer state used to force rerender
  const dispatch = useAppDispatch();
  const config = configQuery();
  useEffect(() => {
    if (!config.data || !config.data.pluginsEndpoint) return;
    let pluginsEndpoint = 'http://127.0.0.1:8000/plugins/';
    // In local mode, IQENGINE_CONNECTION_INFO isn't defined
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

    const newSamps = convertFloat32ArrayToBase64(trimmedSamples);
    console.log(newSamps);

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
        console.log('Plugin Status:', data.status);
        console.log('data:', data);
        if (data.data_output && data.data_output.length > 0) {
          // just show the first output for now, 99% of plugins will have 0 or 1 IQ output anyway
          const samples_base64 = data.data_output[0]['samples'];
          const samples = convertBase64ToFloat32Array(samples_base64);
          //const sample_rate = data.data_output[0]['sample_rate']; // Hz
          //const center_freq = data.data_output[0]['center_freq']; // Hz
          //const data_type = data.data_output[0]['data_type']; // assumes iq/cf32_le
          setModalSamples(samples);

          // create spectrogram out of all samples
          const fftSize = 1024;
          const numFfts = Math.floor(samples.length / 2 / fftSize);
          const magnitudeMin = -40;
          const magnitudeMax = -10;
          const samples_typed = Float32Array.from(samples);

          let startOfs = 0;
          let newFftData = new Uint8ClampedArray(numFfts * fftSize * 4); // 4 because RGBA

          // loop through each row
          for (let i = 0; i < numFfts; i++) {
            let samples_slice = samples_typed.slice(i * fftSize * 2, (i + 1) * fftSize * 2); // mult by 2 because this is int/floats not IQ samples

            const f = new FFT(fftSize);
            let out = f.createComplexArray(); // creates an empty array the length of fft.size*2
            f.transform(out, samples_slice); // assumes input (2nd arg) is in form IQIQIQIQ and twice the length of fft.size

            out = out.map((x) => x / fftSize); // divide by fftsize

            // convert to magnitude
            let magnitudes = new Array(out.length / 2);
            for (let j = 0; j < out.length / 2; j++) {
              magnitudes[j] = Math.sqrt(Math.pow(out[j * 2], 2) + Math.pow(out[j * 2 + 1], 2)); // take magnitude
            }

            fftshift(magnitudes); // in-place
            magnitudes = magnitudes.map((x) => 10.0 * Math.log10(x)); // convert to dB
            magnitudes = magnitudes.map((x) => (isFinite(x) ? x : 0)); // get rid of -infinity which happens when the input is all 0s

            // apply magnitude min and max (which are in dB, same units as magnitudes prior to this point) and convert to 0-255
            const dbPer1 = 255 / (magnitudeMax - magnitudeMin);
            magnitudes = magnitudes.map((x) => x - magnitudeMin);
            magnitudes = magnitudes.map((x) => x * dbPer1);
            magnitudes = magnitudes.map((x) => (x > 255 ? 255 : x)); // clip above 255
            magnitudes = magnitudes.map((x) => (x < 0 ? 0 : x)); // clip below 0
            let ipBuf8 = Uint8ClampedArray.from(magnitudes); // anything over 255 or below 0 at this point will become a random number, hence clipping above

            // Apply colormap
            let line_offset = i * fftSize * 4;
            for (let sigVal, opIdx = 0, ipIdx = startOfs; ipIdx < fftSize + startOfs; opIdx += 4, ipIdx++) {
              sigVal = ipBuf8[ipIdx] || 0; // if input line too short add zeros
              newFftData[line_offset + opIdx] = colMaps['jet'][sigVal][0]; // red
              newFftData[line_offset + opIdx + 1] = colMaps['jet'][sigVal][1]; // green
              newFftData[line_offset + opIdx + 2] = colMaps['jet'][sigVal][2]; // blue
              newFftData[line_offset + opIdx + 3] = 255; // alpha
            }
          }

          const imageData = new ImageData(newFftData, fftSize, numFfts);
          createImageBitmap(imageData).then((imageBitmap) => {
            setmodalSpectrogram(imageBitmap);
          });

          setModalOpen(true);
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

      {modalOpen && (
        <dialog className="modal modal-open w-fit h-full">
          <form method="dialog" className="modal-box max-w-full">
            <h3 className="font-bold text-2xl mb-3 text-primary text-center">IQ Output from Plugin</h3>
            <button
              className="absolute right-2 top-2 text-secondary font-bold"
              onClick={() => {
                setModalOpen(false);
              }}
            >
              ✕
            </button>
            <div className="grid justify-items-stretch">
              <Stage width={800} height={600}>
                <Layer>
                  <Image image={modalSpectrogram} x={0} y={0} width={800} height={600} />
                </Layer>
              </Stage>
              <TimePlot currentSamples={modalSamples} cursorsEnabled={true} plotWidth={800} plotHeight={400} />
              <FrequencyPlot currentSamples={modalSamples} cursorsEnabled={true} plotWidth={800} plotHeight={400} />
              <IQPlot currentSamples={modalSamples} cursorsEnabled={true} plotWidth={800} plotHeight={400} />
            </div>
          </form>
        </dialog>
      )}
    </div>
  );
};
