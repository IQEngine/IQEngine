import DataTable from '@/features/ui/data-table/DataTable';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  calculateDate,
  calculateSampleCount,
  getOriginalFrequency,
  getFrequency,
  getSeconds,
  validateFrequency,
  validateDate,
} from '@/utils/rfFunctions';
import AutoSizeInput from '@/features/ui/auto-size-input/AutoSizeInput';
import { Annotation, SigMFMetadata } from '@/utils/sigmfMetadata';
import Actions from './Actions';

interface AnnotationListProps {
  meta: SigMFMetadata;
  setHandleTop: any;
  spectrogramHeight: number;
  setMeta: (meta: SigMFMetadata) => void;
}

export const AnnotationList = ({ meta, setHandleTop, spectrogramHeight, setMeta }: AnnotationListProps) => {
  const [parents, setParents] = useState([]);
  const [data, setData] = useState([]);

  const originalColumns = [
    { title: 'Annotation', dataIndex: 'annotation' },
    { title: 'Frequency Range', dataIndex: 'frequencyRange' },
    { title: 'BW', dataIndex: 'bandwidthHz' },
    { title: 'Label', dataIndex: 'label' },
    { title: 'Time Range', dataIndex: 'timeRange' },
    { title: 'Comment', dataIndex: 'comment' },
    { title: 'Duration', dataIndex: 'duration' },
    { title: 'Actions', dataIndex: 'actions' },
  ];
  const [columns, setColumns] = useState(originalColumns);

  const calculateColumns = useCallback(() => {
    if (data.length > 0) {
      const newColumns = originalColumns.filter((column) => {
        if (data.find((row) => row[column.dataIndex] !== undefined)) {
          return column;
        }
      });
      setColumns(newColumns);
    }
  }, [columns, data]);

  const updateAnnotation = useCallback(
    (value, parent) => {
      if (!meta?.annotations) return;

      let newAnnotationValue = value;

      // Get the min and max frequencies
      const minFreq = meta.getCenterFrequency() - meta.getSampleRate() / 2;
      const maxFreq = meta.getCenterFrequency() + meta.getSampleRate() / 2;

      // Get sample rate and sample start
      const sampleRate = Number(meta.getSampleRate());
      const sampleStart = Number(parent.annotation['core:sample_start']);

      // Get the start and end dates
      if (meta.captures[0] && meta.captures[0]['core:datetime']) {
        const startDate = meta.captures[0]['core:datetime'];
        const endDate = calculateDate(meta.captures[0]['core:datetime'], meta.getTotalSamples(), sampleRate);

        if (parent.name == 'core:sample_start') {
          newAnnotationValue = calculateSampleCount(startDate, value, sampleRate);
          parent.error = validateDate(value, startDate, endDate);
        } else if (parent.name == 'core:sample_count') {
          newAnnotationValue = calculateSampleCount(startDate, value, sampleRate) - sampleStart;
          parent.error = validateDate(value, startDate, endDate);
        }
      }

      if (parent.name == 'core:freq_lower_edge') {
        newAnnotationValue = getOriginalFrequency(Number(value), parent.object.unit);
        parent.error = validateFrequency(newAnnotationValue, minFreq, maxFreq);
      } else if (parent.name == 'core:freq_upper_edge') {
        newAnnotationValue = getOriginalFrequency(Number(value), parent.object.unit);
        parent.error = validateFrequency(newAnnotationValue, minFreq, maxFreq);
      }
      let updatedAnnotation = { ...parent.annotation };
      updatedAnnotation[parent.name] = newAnnotationValue ? newAnnotationValue : updatedAnnotation[parent.name];
      meta.annotations[parent.index] = Object.assign(new Annotation(), updatedAnnotation);

      setData(calculateAnnotationsData());
      let new_meta = Object.assign(new SigMFMetadata(), meta);
      setMeta(new_meta);
    },
    [meta]
  );

  const calculateAnnotationsData = useCallback(() => {
    const data = [];
    const startCapture = meta?.captures[0];
    const currentParents = parents;

    if (!meta?.annotations) return;

    for (let i = 0; i < meta.annotations?.length; i++) {
      const annotation = meta.annotations[i];
      const sampleRate = Number(meta.global['core:sample_rate']);
      const startSampleCount = Number(annotation['core:sample_start']);
      const sampleCount = Number(annotation['core:sample_count']);
      const centerFrequency = meta.getCenterFrequency();
      const lowerEdge = annotation['core:freq_lower_edge']
        ? annotation['core:freq_lower_edge']
        : centerFrequency - sampleRate / 2;
      const upperEdge = annotation['core:freq_upper_edge']
        ? annotation['core:freq_upper_edge']
        : centerFrequency + sampleRate / 2;

      // Get description
      const description = annotation['core:description'];

      // Get start frequency range
      const startFrequency = getFrequency(lowerEdge);

      // Get end frequency range
      const endFrequency = getFrequency(upperEdge);

      // Get bandwidth
      const bandwidthHz = getFrequency(upperEdge - lowerEdge);

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
          name: 'core:sample_start',
          error: currentParents[i]?.startTime?.error,
        },
        endTime: {
          index: i,
          name: 'core:sample_count',
          error: currentParents[i]?.endTime?.error,
        },
        comment: {
          index: i,
          annotation: annotation,
          name: 'core:comment',
          error: currentParents[i]?.comment?.error,
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
            <div className="flex items-center">{startFrequency.unit} - </div>
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
            <div className="flex items-center">{endFrequency.unit}</div>
          </div>
        ),
        bandwidthHz: bandwidthHz?.freq + bandwidthHz.unit,
        label: (
          <AutoSizeInput
            label={`Annotation ${i} - Label`}
            parent={currentParents[i].description}
            value={description}
            onBlur={updateAnnotation}
          />
        ),
        duration: duration.time + duration.unit,
        comment: (
          <AutoSizeInput
            label={`Annotation ${i} - Comment`}
            parent={currentParents[i].comment}
            value={annotation['core:comment']}
            onBlur={updateAnnotation}
            minWidth={200}
          />
        ),
        actions: (
          <Actions
            startSampleCount={startSampleCount}
            spectrogramHeight={spectrogramHeight}
            index={i}
            meta={meta}
            setHandleTop={setHandleTop}
            setMeta={setMeta}
          />
        ),
      };

      if (startCapture && startCapture['core:datetime']) {
        const startDate = startCapture['core:datetime'];
        // Get start time range
        const startTime = calculateDate(startDate, startSampleCount, sampleRate);
        // Get start time range
        const endTime = calculateDate(startDate, startSampleCount + sampleCount, sampleRate);

        currentParents[i].startTime = {
          index: i,
          annotation: annotation,
          object: startTime,
          name: 'core:sample_start',
          error: currentParents[i]?.startTime?.error,
        };
        currentParents[i].endTime = {
          index: i,
          annotation: annotation,
          object: endTime,
          name: 'core:sample_count',
          error: currentParents[i]?.endTime?.error,
        };

        if (startTime && endTime) {
          currentData['timeRange'] = (
            <div className="flex flex-row">
              <div>
                <AutoSizeInput
                  label={`Annotation ${i} - Start Time`}
                  parent={currentParents[i].startTime}
                  value={startTime}
                  onBlur={updateAnnotation}
                />
              </div>
              <div className="flex items-center"> - </div>
              <div>
                <AutoSizeInput
                  label={`Annotation ${i} - End Time`}
                  parent={currentParents[i].endTime}
                  value={endTime}
                  onBlur={updateAnnotation}
                />
              </div>
            </div>
          );
        }
      }

      data.push(currentData);
    }

    setParents(currentParents);
    return data;
  }, [meta, parents, updateAnnotation]);

  useEffect(() => {
    setData(calculateAnnotationsData());
  }, [calculateAnnotationsData]);

  useEffect(() => {
    calculateColumns();
  }, [data]);

  return <DataTable dataColumns={columns} dataRows={data} />;
};

export default AnnotationList;
