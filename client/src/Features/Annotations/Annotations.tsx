import DataTable from '@/Components/DataTable/DataTable';
import React, { useCallback, useEffect, useState } from 'react';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import {
  calculateDate,
  calculateSampleCount,
  getOriginalFrequency,
  getFrequency,
  getSeconds,
  validateFrequency,
  validateDate,
} from '@/Utils/rfFunctions';
import AutoSizeInput from '@/Components/AutoSizeInput/AutoSizeInput';

export const Annotations = ({ meta, totalIQSamples, updateSpectrogram }) => {
  const [metadata, setMetadata] = useState(meta);
  const [parents, setParents] = useState([]);
  const [data, setData] = useState([]);

  useEffect(() => {
    setParents([]);
  }, []);

  useEffect(() => {
    setMetadata(meta);
  }, [meta]);

  const getActions = useCallback(
    (startSampleCount) => {
      return (
        <div>
          <button
            className="btn-primary"
            onClick={() => {
              updateSpectrogram(startSampleCount);
            }}
          >
            <ArrowRightIcon className="h-4 w-4" />
          </button>
        </div>
      );
    },
    [updateSpectrogram]
  );

  const updateAnnotation = useCallback(
    (value, parent) => {
      let newAnnotationValue = value;
      let currentMetadata = metadata;

      // Get the min and max frequencies
      const minFreq = currentMetadata.captures[0]['core:frequency'] - currentMetadata.global['core:sample_rate'] / 2;
      const maxFreq = currentMetadata.captures[0]['core:frequency'] + currentMetadata.global['core:sample_rate'] / 2;

      // Get sample rate and sample start
      const sampleRate = Number(currentMetadata.global['core:sample_rate']);
      const sampleStart = Number(parent.annotation['core:sample_start']);

      // Get the start and end dates
      const startDate = currentMetadata.captures[0]['core:datetime'];
      const endDate = calculateDate(currentMetadata.captures[0]['core:datetime'], totalIQSamples, sampleRate);

      if (parent.name == 'core:freq_lower_edge') {
        newAnnotationValue = getOriginalFrequency(value, parent.object.unit);
        parent.error = validateFrequency(newAnnotationValue, minFreq, maxFreq);
      } else if (parent.name == 'core:freq_upper_edge') {
        newAnnotationValue = getOriginalFrequency(value, parent.object.unit);
        parent.error = validateFrequency(newAnnotationValue, minFreq, maxFreq);
      } else if (parent.name == 'core:sample_start') {
        newAnnotationValue = calculateSampleCount(startDate, value, sampleRate);
        parent.error = validateDate(value, startDate, endDate);
      } else if (parent.name == 'core:sample_count') {
        newAnnotationValue = calculateSampleCount(startDate, value, sampleRate) - sampleStart;
        parent.error = validateDate(value, startDate, endDate);
      }

      let updatedAnnotation = parent.annotation;
      updatedAnnotation[parent.name] = newAnnotationValue ? newAnnotationValue : updatedAnnotation[parent.name];
      currentMetadata.annotations[parent.index] = updatedAnnotation;
      setMetadata(currentMetadata);
      setData(calculateAnnotationsData());
      updateSpectrogram();
    },
    [metadata, totalIQSamples]
  );

  const calculateAnnotationsData = useCallback(() => {
    let data = [];
    const startCapture = metadata?.captures[0];
    let currentParents = parents;

    if (startCapture && startCapture['core:datetime']) {
      for (let i = 0; i < metadata.annotations?.length; i++) {
        const annotation = metadata.annotations[i];
        const sampleRate = Number(metadata.global['core:sample_rate']);
        const startDate = startCapture['core:datetime'];
        const startSampleCount = Number(annotation['core:sample_start']);
        const sampleCount = Number(annotation['core:sample_count']);

        // Get description
        const description = annotation['core:description'];

        // Get start frequency range
        const startFrequency = getFrequency(annotation['core:freq_lower_edge']);

        // Get end frequency range
        const endFrequency = getFrequency(annotation['core:freq_upper_edge']);

        // Get bandwidth
        const bandwidthHz = getFrequency(annotation['core:freq_upper_edge'] - annotation['core:freq_lower_edge']);

        // Get start time range
        const startTime = calculateDate(startDate, startSampleCount, sampleRate);

        // Get start time range
        const endTime = calculateDate(startDate, startSampleCount + sampleCount, sampleRate);

        // Get duration
        const duration = getSeconds(sampleCount / sampleRate);

        currentParents[i] = {
          description: {
            index: i,
            annotation: annotation,
            object: description,
            name: 'core:description',
            error: currentParents[i]?.description?.error,
          },
          startFrequency: {
            index: i,
            annotation: annotation,
            object: startFrequency,
            name: 'core:freq_lower_edge',
            error: currentParents[i]?.startFrequency?.error,
          },
          endFrequency: {
            index: i,
            annotation: annotation,
            object: endFrequency,
            name: 'core:freq_upper_edge',
            error: currentParents[i]?.endFrequency?.error,
          },
          startTime: {
            index: i,
            annotation: annotation,
            object: startTime,
            name: 'core:sample_start',
            error: currentParents[i]?.startTime?.error,
          },
          endTime: {
            index: i,
            annotation: annotation,
            object: endTime,
            name: 'core:sample_count',
            error: currentParents[i]?.endTime?.error,
          },
        };

        let currentData = {
          annotation: i,
          frequencyRange: (
            <div className="flex flex-row">
              <div>
                <AutoSizeInput
                  label={`Annotation ${i} - Frequency Start`}
                  type="number"
                  className={'input-number'}
                  parent={currentParents[i].startFrequency}
                  value={startFrequency.freq}
                  onBlur={updateAnnotation}
                />
              </div>
              <div>{startFrequency.unit} - </div>
              <div>
                <AutoSizeInput
                  label={`Annotation ${i} - Frequency End`}
                  type="number"
                  className={'input-number'}
                  parent={currentParents[i].endFrequency}
                  value={endFrequency.freq}
                  onBlur={updateAnnotation}
                />
              </div>
              <div>{endFrequency.unit}</div>
            </div>
          ),
          bandwidthHz: bandwidthHz.freq + bandwidthHz.unit,
          label: (
            <AutoSizeInput
              label={`Annotation ${i} - Label`}
              parent={currentParents[i].description}
              value={description}
              onBlur={updateAnnotation}
            />
          ),
          timeRange: (
            <div className="flex flex-row">
              <div>
                <AutoSizeInput
                  label={`Annotation ${i} - Start Time`}
                  parent={currentParents[i].startTime}
                  value={startTime}
                  onBlur={updateAnnotation}
                />
              </div>
              <div> - </div>
              <div>
                <AutoSizeInput
                  label={`Annotation ${i} - End Time`}
                  parent={currentParents[i].endTime}
                  value={endTime}
                  onBlur={updateAnnotation}
                />
              </div>
            </div>
          ),
          duration: duration.time + duration.unit,
          actions: getActions(startSampleCount),
        };

        data.push(currentData);
      }
    }

    setParents(currentParents);
    return data;
  }, [metadata, parents, updateAnnotation]);

  useEffect(() => {
    setData(calculateAnnotationsData());
  }, [calculateAnnotationsData]);

  return (
    <DataTable
      dataColumns={[
        { title: 'Annotation', dataIndex: 'annotation' },
        { title: 'Frequency Range', dataIndex: 'frequencyRange' },
        { title: 'BW', dataIndex: 'bandwidthHz' },
        { title: 'Label', dataIndex: 'label' },
        { title: 'Time Range', dataIndex: 'timeRange' },
        { title: 'Duration', dataIndex: 'duration' },
        { title: 'Actions', dataIndex: 'actions' },
      ]}
      dataRows={data}
    />
  );
};

export default Annotations;
