// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React, { useEffect, useState } from 'react';
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
import { useSasToken } from '@/api/datasource/queries';
import { toast } from 'react-hot-toast';
import { dataTypeToBytesPerIQSample } from '@/utils/selector';
import { useSpectrogramContext } from '../hooks/use-spectrogram-context';
import { useCursorContext } from '../hooks/use-cursor-context';
import { CLIENT_TYPE_API, DataType, MetadataFile, RunPluginBody } from '@/api/Models';
import { useRunPlugin, useGetJobStatus, useGetJobResult } from '@/api/plugin/run';

export const PluginsPane = () => {
  const { meta, account, type, container, spectrogramWidth, spectrogramHeight, fftSize, selectedAnnotation, setMeta } =
    useSpectrogramContext();
  const { cursorTimeEnabled, cursorTime, cursorData } = useCursorContext();
  const { data: plugins, isError } = useGetPlugins();
  const { PluginOption, EditPluginParameters, pluginParameters, setPluginParameters } = useGetPluginsComponents();
  const [selectedPlugin, setSelectedPlugin] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('Cursor');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSamples, setModalSamples] = useState<Float32Array>(new Float32Array([]));
  const [modalSpectrogram, setmodalSpectrogram] = useState(null);
  const [useCloudStorage, setUseCloudStorage] = useState(true);
  const token = useSasToken(type, account, container, meta.getDataFileName(), false);
  let byte_offset = meta.getBytesPerIQSample() * Math.floor(cursorTime.start);
  let byte_length = meta.getBytesPerIQSample() * Math.ceil(cursorTime.end - cursorTime.start);

  //let runPluginBody: RunPluginBody = null;
  const [runPluginBody, setRunPluginBody] = useState<RunPluginBody>(null);
  const {
    data: initialJobStatus,
    refetch: runPlugin,
    isFetching: isRunPluginFetchin,
  } = useRunPlugin(selectedPlugin, runPluginBody);

  const { data: jobStatus, isFetching: isJobStatusFetching } = useGetJobStatus(
    selectedPlugin,
    initialJobStatus?.job_id
  );

  const { data: jobResult, isFetching: isJobResultFetching } = useGetJobResult(selectedPlugin, jobStatus);

  const pluginIsRunning = isRunPluginFetchin || jobStatus?.progress < 100 || isJobStatusFetching || isJobResultFetching;

  useEffect(() => {
    if (type != CLIENT_TYPE_API) {
      setUseCloudStorage(false);
    }
  }, [type]);
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

    const sampleRate = meta.getSampleRate();
    const freq = meta.getCenterFrequency();

    let annotation: Annotation = null;
    if (selectedMethod === 'Annotation') {
      if (selectedAnnotation === -1) {
        toast.error('Please select the annotation you want to run a plugin on');
        setSelectedMethod('');
      } else {
        annotation = meta.annotations[selectedAnnotation];
        const calculateMultiplier = dataTypeToBytesPerIQSample(DataType[meta.getDataType()]);
        byte_offset = Math.floor(annotation['core:sample_start']) * calculateMultiplier;
        byte_length = Math.ceil(annotation['core:sample_count']) * calculateMultiplier;
      }
    }

    const metadata_files: MetadataFile[] = [
      {
        file_name: meta.getDataFileName(),
        sample_rate: sampleRate,
        center_freq: freq,
        data_type: DataType.iq_cf32_le,
      },
    ];
    let body: RunPluginBody = {
      metadata_files: metadata_files,
      iq_files: [new File([cursorData], meta.getDataFileName(), { type: DataType.iq_cf32_le })],
      custom_params: {},
    };

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
    setRunPluginBody(body);
    runPlugin();
  };

  useEffect(() => {
    console.debug('Plugin return:', jobResult);
    if (!jobResult) return;

    const BlobFromSamples = (samples_base64, data_type) => {
      const samples = window.atob(samples_base64);
      var blob_array = new Uint8Array(samples.length);
      for (var i = 0; i < samples.length; i++) {
        blob_array[i] = samples.charCodeAt(i);
      }
      return new Blob([blob_array], { type: data_type });
    };

    if (!!jobResult.data_output && jobResult.data_output.length > 0) {
      if (jobResult.data_output[0]['data_type'] == DataType.iq_cf32_le) {
        // just show the first output for now, 99% of plugins will have 0 or 1 IQ output anyway
        const samples_base64 = jobResult.data_output[0]['samples'];
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
      } else if (jobResult.data_output[0]['data_type'] == DataType.image_png) {
        let data_output = jobResult.data_output[0]['samples'];
        let data_type = jobResult.data_output[0]['data_type'];
        let blob = BlobFromSamples(data_output, data_type);
        createImageBitmap(blob).then((imageBitmap) => {
          setmodalSpectrogram(imageBitmap);
        });
        setModalOpen(true);
      } else {
        // Files to be directly downloaded
        let d = new Date();
        let datestring = new Date().toISOString().split('.')[0];

        for (let j = 0; j < jobResult.data_output.length; j++) {
          let data_type = jobResult.data_output[j]['data_type'];

          let ext = '';
          switch (data_type) {
            case DataType.audio_wav:
              ext = 'wav';
              break;
            //case MimeTypes.image_png:
            //  ext = 'png';
            //  break;
            default:
              toast.error(`The plugins pane doesn't handle the mime type ${data_type} output by the plugin.`);
              break;
          }
          if (ext == '') continue;

          let data_output = jobResult.data_output[j]['samples'];

          let blob = BlobFromSamples(data_output, data_type);

          let url = window.URL.createObjectURL(blob);
          let a = document.createElement('a');
          a.href = url;

          let filename = `sample_${datestring}_${j}.${ext}`;
          a.download = filename;
          a.click();
          window.URL.revokeObjectURL(url);
        }
      }
    }

    if (jobResult.annotations) {
      console.log('Annotations:', jobResult.annotations);
      for (let i = 0; i < jobResult.annotations.length; i++) {
        jobResult.annotations[i]['core:sample_start'] += cursorTime.start;
      }
      let newAnnotations = jobResult.annotations.map((annotation) => Object.assign(new Annotation(), annotation));
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
  }, [jobResult]);

  useEffect(() => {
    if (jobStatus?.error) {
      toast.error(`Plugin failed: ${jobStatus.error}`);
    }
  }, [jobStatus]);

  return (
    <div className="pluginForm" id="pluginFormId" onSubmit={handleSubmit}>
      {pluginIsRunning && !jobStatus?.error && (
        <div className="fixed top-0 left-0 right-0 bottom-0 w-full h-screen z-50 overflow-hidden bg-gray-700 opacity-75 flex flex-col items-center justify-center">
          <span className="loading loading-infinity loading-lg text-primary"></span>
          <h2 className="text-center text-white text-xl font-semibold">Running Plugin...</h2>
          <p className="w-1/3 text-center text-white">This may take a few minutes.</p>
          <div className="w-1/2 bg-gray-200 rounded-full h-2.5 mb-4 ">
            <div className="w-1/2 bg-blue-600 h-2.5 rounded-full" style={{ width: jobStatus?.progress + '%' }}></div>
          </div>
        </div>
      )}
      <label className="label">
        Plugin:
        <select
          className="rounded bg-base-content text-base-100 w-44"
          value={selectedPlugin}
          onChange={handleChangePlugin}
        >
          <option value="">Select Plugin</option>
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
      {type == CLIENT_TYPE_API && (
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
              <Stage width={spectrogramWidth} height={800}>
                <Layer>
                  <Image image={modalSpectrogram} x={0} y={0} width={spectrogramWidth} height={600} />
                </Layer>
              </Stage>
              <TimePlot displayedIQ={modalSamples} />
              <FrequencyPlot displayedIQ={modalSamples} />
              <IQPlot displayedIQ={modalSamples} />
            </div>
          </form>
        </dialog>
      )}
    </div>
  );
};
