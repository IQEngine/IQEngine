// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React, { Fragment, useCallback, useMemo } from 'react';
import { Layer, Rect, Text } from 'react-konva';
import { TILE_SIZE_IN_IQ_SAMPLES } from '@/utils/constants';
import { Annotation, SigMFMetadata } from '@/utils/sigmfMetadata';
import { useSpectrogramContext } from '../../hooks/use-spectrogram-context';

interface AnnotationViewerProps {
  currentFFT: number;
}

const AnnotationViewer = ({ currentFFT }: AnnotationViewerProps) => {
  const {
    meta,
    setMeta,
    spectrogramWidth,
    spectrogramHeight,
    fftSize,
    fftStepSize,
    selectedAnnotation,
    setSelectedAnnotation,
  } = useSpectrogramContext();
  const lower_freq = meta.getCenterFrequency() - meta.getSampleRate() / 2;

  function onDragEnd(e) {
    const x = e.target.x(); // coords of the corner box
    const y = e.target.y();
    // Getting the index of the annotation from the id of the box
    const annot_indx = e.target.id().split('-')[0];
    const annot_pos_x = e.target.id().split('-')[1];
    const annot_pos_y = e.target.id().split('-')[2];
    annotations[annot_indx][annot_pos_x] = x / spectrogramWidth; // reverse the calcs done to generate the coords
    annotations[annot_indx][annot_pos_y] = y;

    // Check if the min/max is swapped for x and y
    if (annotations[annot_indx].x1 > annotations[annot_indx].x2) {
      // one-liner for swapping the two
      annotations[annot_indx].x2 = [
        annotations[annot_indx].x1,
        (annotations[annot_indx].x1 = annotations[annot_indx].x2),
      ][0];
    }
    if (annotations[annot_indx].y1 > annotations[annot_indx].y2) {
      // one-liner for swapping the two
      annotations[annot_indx].y2 = [
        annotations[annot_indx].y1,
        (annotations[annot_indx].y1 = annotations[annot_indx].y2),
      ][0];
    }

    // Getting new values for the annotation
    const newValues = {
      'core:sample_start': (annotations[annot_indx].y1 + currentFFT) * fftSize * (fftStepSize + 1),
      'core:sample_count': (annotations[annot_indx].y2 - annotations[annot_indx].y1) * fftSize * (fftStepSize + 1),
      'core:freq_lower_edge': annotations[annot_indx].x1 * meta.getSampleRate() + lower_freq,
      'core:freq_upper_edge': annotations[annot_indx].x2 * meta.getSampleRate() + lower_freq,
    };
    const f = annotations[annot_indx]['index'];
    // Updating the annotation
    meta.annotations[f] = Object.assign(meta.annotations[f], {
      ...meta.annotations[f],
      ...newValues,
    });
    let new_meta = Object.assign(new SigMFMetadata(), meta);
    setMeta(new_meta);
    setSelectedAnnotation(annot_indx);
  }

  const annotations = useMemo(() => {
    const minimumFFT = currentFFT;
    const maximumFFT = currentFFT + spectrogramHeight * (fftStepSize + 1);
    const annotations = meta.annotations.map((annotation, index) => {
      if (!annotation['core:sample_count']) {
        return;
      }
      const start = annotation['core:sample_start'] / fftSize;
      const end = annotation['core:sample_count'] / fftSize + start;
      const visible = start < maximumFFT || end > minimumFFT;
      return {
        x1: (annotation['core:freq_lower_edge'] - meta.getCenterFrequency()) / meta.getSampleRate() + 0.5,
        x2: (annotation['core:freq_upper_edge'] - meta.getCenterFrequency()) / meta.getSampleRate() + 0.5,
        y1: (start - minimumFFT) / (fftStepSize + 1),
        y2: (end - minimumFFT) / (fftStepSize + 1),
        label: annotation.getLabel(),
        index: index,
        visible: visible,
      };
    });
    return annotations;
  }, [meta, currentFFT, fftStepSize, fftSize, spectrogramWidth]);

  // add cursor styling
  function onMouseOver() {
    document.body.style.cursor = 'move';
  }
  function onMouseOut() {
    document.body.style.cursor = 'default';
  }

  const newAnnotationClick = useCallback(() => {
    annotations.push({
      x1: 200,
      x2: 400,
      y1: 200,
      y2: 400,
      label: 'Fill Me In',
      index: -1,
      visible: true,
    });

    // Add it to the meta.annotations as well. TODO: this is duplicate code
    let updatedAnnotations = [...meta.annotations];
    annotations[annotations.length - 1]['index'] = updatedAnnotations.length;

    let start_sample_index = currentFFT * TILE_SIZE_IN_IQ_SAMPLES;
    const annot_indx = annotations.length - 1;
    let lower_freq = meta.captures[0]['core:frequency'] - meta.global['core:sample_rate'] / 2;
    meta.annotations.push(
      Object.assign(new Annotation(), {
        'core:sample_start': annotations[annot_indx].y1 * fftSize * (fftStepSize + 1) + start_sample_index,
        'core:sample_count': (annotations[annot_indx].y2 - annotations[annot_indx].y1) * fftSize * (fftStepSize + 1),
        'core:freq_lower_edge': (annotations[annot_indx].x1 / fftSize) * meta.global['core:sample_rate'] + lower_freq,
        'core:freq_upper_edge': (annotations[annot_indx].x2 / fftSize) * meta.global['core:sample_rate'] + lower_freq,
        'core:label': annotations[annot_indx]['label'],
      })
    );
    let new_meta = Object.assign(new SigMFMetadata(), meta);
    console.log('new_meta', new_meta);
    setMeta(new_meta);
    // setSelectedAnnotation(annot_indx);
  }, [annotations, meta, currentFFT, fftSize, fftStepSize, setMeta]);

  // Ability to update annotation labels
  const handleTextClick = useCallback(
    (e) => {
      // create textarea and style it
      var textarea = document.createElement('textarea');
      document.body.appendChild(textarea);

      const element = document.getElementById('spectrogram');
      const spectrogram = element.getBoundingClientRect();

      textarea.value = e.target.text();
      textarea.style.position = 'absolute';
      textarea.style.top = spectrogram.top + e.target.attrs.y + 'px';
      textarea.style.left = spectrogram.left + e.target.attrs.x + 'px';
      textarea.style.width = '400px';
      textarea.style.fontSize = '25px';
      textarea.rows = 1;
      textarea.id = e.target.id();
      textarea.focus();
      textarea.classList.add('text-base-100');

      // Add a note about hitting enter to finish the edit
      var textarea2 = document.createElement('textarea');
      document.body.appendChild(textarea2);
      textarea2.value = 'Hit Enter to Finish';
      textarea2.style.position = 'absolute';
      textarea2.style.top = spectrogram.top + e.target.attrs.y - 30 + 'px';
      textarea2.style.left = spectrogram.left + e.target.attrs.x + 100 + 'px';
      textarea2.style.width = '140px';
      textarea2.style.height = '30px';
      textarea2.rows = 1;
      textarea2.disabled = true;
      textarea2.style.resize = 'none';
      textarea2.classList.add('text-base-100');

      textarea.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          console.debug(textarea.value, textarea.id);
          annotations[textarea.id]['label'] = textarea.value; // update the local version first
          // Now update the actual meta info
          meta.annotations[annotations[textarea.id]['index']]['core:label'] = textarea.value;
          let new_meta = Object.assign(new SigMFMetadata(), meta);
          setMeta(new_meta);
          document.body.removeChild(textarea);
          document.body.removeChild(textarea2);
        }
      });
    },
    [annotations, meta, setMeta]
  );

  const onBoxCornerClick = useCallback(
    (e) => {
      const annot_indx = e.target.id().split('-')[0];
      setSelectedAnnotation(annot_indx);
    },
    [setSelectedAnnotation]
  );

  const onBoxClick = useCallback(
    (e) => {
      const annot_indx = e.target.id();
      setSelectedAnnotation(annot_indx);
    },
    [setSelectedAnnotation]
  );

  return (
    <Layer>
      {/* Button to add a new annotation */}
      <Rect x={10} y={10} width={122} height={20} fill="black" opacity={0.6} onClick={newAnnotationClick} />
      <Text
        text="Add Annotation"
        fontFamily="serif"
        fontSize={18}
        x={12}
        y={12}
        fill="white"
        onClick={newAnnotationClick}
        key="newannotation"
      />

      {annotations?.map((annotation, index) => (
        // for params of Rect see https://konvajs.org/api/Konva.Rect.html
        // for Text params see https://konvajs.org/api/Konva.Text.html
        // Note that index is for the list of annotations currently on the screen, not for meta.annotations which contains all
        <Fragment key={index}>
          {/* Main rectangle */}
          <Rect
            x={annotation.x1 * spectrogramWidth}
            y={annotation.y1}
            width={(annotation.x2 - annotation.x1) * spectrogramWidth}
            height={annotation.y2 - annotation.y1}
            fillEnabled={false}
            stroke={selectedAnnotation == index ? 'pink' : 'black'}
            strokeWidth={4}
            onClick={onBoxClick}
            onMouseOver={onMouseOver}
            onMouseOut={onMouseOut}
            key={index}
            id={index.toString()}
          />
          {/* Top Left Corner */}
          <Rect
            x={annotation.x1 * spectrogramWidth - 4}
            y={annotation.y1 - 4}
            width={8}
            height={8}
            fillEnabled={true}
            fill="white"
            stroke="black"
            strokeWidth={1}
            key={index + 4000000}
            draggable
            onDragEnd={onDragEnd}
            onMouseOver={onMouseOver}
            onMouseOut={onMouseOut}
            onClick={onBoxCornerClick}
            id={index.toString() + '-x1-y1'} // tells the event which annotation, and which x and y to update
          />
          {/* Top Right Corner */}
          <Rect
            x={annotation.x2 * spectrogramWidth - 4}
            y={annotation.y1 - 4}
            width={8}
            height={8}
            fillEnabled={true}
            fill="white"
            stroke="black"
            strokeWidth={1}
            key={index + 5000000}
            draggable
            onDragEnd={onDragEnd}
            onMouseOver={onMouseOver}
            onMouseOut={onMouseOut}
            onClick={onBoxCornerClick}
            id={index.toString() + '-x2-y1'} // tells the event which annotation, and which x and y to update
          />
          {/* Bottom Left Corner */}
          <Rect
            x={annotation.x1 * spectrogramWidth - 4}
            y={annotation.y2 - 4}
            width={8}
            height={8}
            fillEnabled={true}
            fill="white"
            stroke="black"
            strokeWidth={1}
            key={index + 6000000}
            draggable
            onDragEnd={onDragEnd}
            onMouseOver={onMouseOver}
            onMouseOut={onMouseOut}
            onClick={onBoxCornerClick}
            id={index.toString() + '-x1-y2'} // tells the event which annotation, and which x and y to update
          />
          {/* Bottom Right Corner */}
          <Rect
            x={annotation.x2 * spectrogramWidth - 4}
            y={annotation.y2 - 4}
            width={8}
            height={8}
            fillEnabled={true}
            fill="white"
            stroke="black"
            strokeWidth={1}
            key={index + 7000000}
            draggable
            onDragEnd={onDragEnd}
            onMouseOver={onMouseOver}
            onMouseOut={onMouseOut}
            onClick={onBoxCornerClick}
            id={index.toString() + '-x2-y2'} // tells the event which annotation, and which x and y to update
          />
          {/* Label */}
          <Text
            text={annotation.label}
            fontFamily="serif"
            fontSize={24}
            x={annotation.x1 * spectrogramWidth}
            y={annotation.y1 - 23}
            fill={selectedAnnotation == index ? 'pink' : 'black'}
            fontStyle="bold"
            key={index + 1000000}
            onClick={handleTextClick}
            id={index.toString()} // tells the event which annotation to update
          />
        </Fragment>
      ))}
    </Layer>
  );
};

export { AnnotationViewer };
