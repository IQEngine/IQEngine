// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React, { useState } from 'react';
import { Annotation, SigMFMetadata } from '@/utils/sigmfMetadata';
import { TimePlot } from './time-plot';
import { FrequencyPlot } from './frequency-plot';
import { IQPlot } from './iq-plot';
import { Layer, Image, Stage } from 'react-konva';
import { convertFloat32ArrayToBase64, convertBase64ToFloat32Array } from '@/utils/rf-functions';
import { colMaps } from '@/utils/colormap';
import { fftshift } from 'fftshift';
import { FFT } from '@/utils/fft';
import { useGetPluginsComponents } from '@/pages/recording-view/hooks/use-get-plugins-components';
import { useGetPlugins } from '@/api/plugin/queries';
import { toast } from 'react-hot-toast';
import { dataTypeToBytesPerIQSample } from '@/utils/selector';
import { useUserSettings } from '@/api/user-settings/use-user-settings';
import { useSpectrogramContext } from '../hooks/use-spectrogram-context';
import { useCursorContext } from '../hooks/use-cursor-context';

export enum MimeTypes {
  ci8_le = 'iq/ci8_le',
  ci16_le = 'iq/ci16_le',
  cf32_le = 'iq/cf32_le',
  audio_wav = 'audio/wav',
}

export const PluginsPane = () => {
  const { meta, account, container, spectrogramHeight, fftSize, selectedAnnotation, setMeta } = useSpectrogramContext();
  const { cursorTimeEnabled, cursorTime, cursorData } = useCursorContext();
  const { data: plugins, isError } = useGetPlugins();
  const { PluginOption, EditPluginParameters, pluginParameters, setPluginParameters } = useGetPluginsComponents();
  const [selectedPlugin, setSelectedPlugin] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSamples, setModalSamples] = useState<Float32Array>(new Float32Array([]));
  const [modalSpectrogram, setmodalSpectrogram] = useState(null);
  const [useCloudStorage, setUseCloudStorage] = useState(true);
  const { dataSourcesQuery } = useUserSettings();
  const connectionInfo = dataSourcesQuery?.data[`${account}/${container}`];
  let byte_offset = meta.getBytesPerIQSample() * cursorTime.start;
  let byte_length = meta.getBytesPerIQSample() * (cursorTime.end - cursorTime.start);
  const handleChangePlugin = (e) => {
    setSelectedPlugin(e.target.value);
  };

  const handleChangeMethod = (e) => {
    setSelectedMethod(e.target.value);
  };

  const methodOptions = [
    // { value: 'Full', label: '' },
    { value: 'Cursor', label: 'Cursor' },
    { value: 'Annotation', label: 'Annotation' },
  ];

  const handleSubmit = (e) => {
    console.log('Plugin Params:', pluginParameters);
    e.preventDefault();

    if (selectedMethod == 'Cursor' && !cursorTimeEnabled) {
      toast.error('First enable cursors and choose a region of time to run the plugin on');
      return;
    }

    // this does the tile calc and gets the right samples in currentSamples
    // const { trimmedSamples, startSampleOffset } = handleProcessTime();

    const sampleRate = meta.getSampleRate();
    const freq = meta.getCenterFrequency();

    let annotation: Annotation = null;
    if (selectedMethod == 'Annotation') {
      if (selectedAnnotation == -1) {
        toast.error('Please select the annotation you want to run a plugin on');
        setSelectedMethod('');
      } else {
        annotation = meta.annotations[selectedAnnotation];
        const calculateMultiplier = dataTypeToBytesPerIQSample(MimeTypes[meta.getDataType()]);
        byte_offset = Math.floor(annotation['core:sample_start']) * calculateMultiplier;
        byte_length = annotation['core:sample_count'] * calculateMultiplier;
      }
    }

    let body = {
      samples_b64: [],
      samples_cloud: [],
      custom_params: {},
    };

    if (useCloudStorage && connectionInfo) {
      body = {
        samples_b64: [],
        samples_cloud: [
          {
            account_name: connectionInfo.account,
            container_name: connectionInfo.container,
            file_path: meta.getFileName(),
            sas_token: connectionInfo.sasToken,
            sample_rate: sampleRate,
            center_freq: freq,
            data_type: MimeTypes[meta.getDataType()],
            byte_offset: byte_offset,
            byte_length: byte_length,
          },
        ],
        custom_params: {
          start_freq: annotation ? annotation['core:freq_lower_edge'] : null,
          end_freq: annotation ? annotation['core:freq_upper_edge'] : null,
        },
      };
    } else {
      const newSamps = convertFloat32ArrayToBase64(cursorData);
      console.log(newSamps);

      body = {
        samples_b64: [
          {
            samples: newSamps,
            sample_rate: sampleRate,
            center_freq: freq,
            data_type: MimeTypes[meta.getDataType()],
          },
        ],
        samples_cloud: [],
        custom_params: {},
      };
    }

    // Add custom params
    for (const [key, value] of Object.entries(pluginParameters)) {
      if (value.type === 'integer') {
        body['custom_params'][key] = parseInt(value.value); // remember, we updated default with whatever the user enters
      } else if (value.type === 'number') {
        body['custom_params'][key] = parseFloat(value.value);
      } else {
        body['custom_params'][key] = value.value;
      }
    }

    fetch(selectedPlugin, {
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
        console.debug('data:', data);
        if (data.status !== 'SUCCESS') {
          toast.error(`Plugin failed to run: ${data.status}`);
          return;
        }
        if (data.data_output && data.data_output.length > 0) {
          if (data.data_output[0]['data_type'] == MimeTypes.cf32_le) {
            // just show the first output for now, 99% of plugins will have 0 or 1 IQ output anyway
            const samples_base64 = data.data_output[0]['samples'];
            const samples = convertBase64ToFloat32Array(samples_base64);
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
          } else {
            // non-IQ Data file
            const samples_base64 = data.data_output[0]['samples'];
            const samples = window.atob(samples_base64);
            var blob_array = new Uint8Array(samples.length);
            for (var i = 0; i < samples.length; i++) {
              blob_array[i] = samples.charCodeAt(i);
            }
            const a = document.createElement('a');
            const blob = new Blob([blob_array], { type: data.data_output[0]['data_type'] });
            const url = window.URL.createObjectURL(blob);

            a.href = url;

            let filename = '';
            switch (data.data_output[0]['data_type']) {
              case MimeTypes.audio_wav:
                filename = 'samples.wav';
                break;
            }
            if (filename != '') {
              a.download = filename;
              a.click();
            } else {
              toast.error("The plugins pane doesn't handle the mime type output by the plugin.");
            }
            window.URL.revokeObjectURL(url);
          }
        }

        if (data.annotations) {
          for (let i = 0; i < data.annotations.length; i++) {
            data.annotations[i]['core:sample_start'] += cursorTime.start;
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

  return (
    <div className="pluginForm" id="pluginFormId" onSubmit={handleSubmit}>
      <label className="label">
        Plugin:
        <select
          className="rounded bg-base-content text-base-100 w-44"
          value={selectedPlugin}
          onChange={handleChangePlugin}
        >
          {plugins &&
            !isError &&
            plugins?.map((plugin, groupIndex) => (
              <PluginOption key={groupIndex} groupIndex={groupIndex} plugin={plugin} />
            ))}
        </select>
      </label>
      <label className="label">
        Method:
        <select
          className="rounded bg-base-content text-base-100 w-34"
          value={selectedMethod}
          onChange={handleChangeMethod}
        >
          {methodOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      {connectionInfo && (
        <label className="label cursor-pointer">
          <span>Use Cloud Storage</span>
          <input
            type="checkbox"
            checked={useCloudStorage}
            className="checkbox checkbox-primary"
            onChange={() => {
              setUseCloudStorage(!useCloudStorage);
            }}
          />
        </label>
      )}
      {selectedPlugin && (
        <>
          <EditPluginParameters
            pluginUrl={selectedPlugin}
            handleSubmit={handleSubmit}
            setPluginParameters={setPluginParameters}
            pluginParameters={pluginParameters}
          />
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
