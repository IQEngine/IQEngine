// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React, { Fragment, useCallback } from 'react';
import { Layer, Rect, Text } from 'react-konva';
import { TILE_SIZE_IN_IQ_SAMPLES } from '@/utils/constants';
import { Annotation, SigMFMetadata } from '@/utils/sigmfMetadata';

interface AnnotationViewerProps {
  spectrogramWidthScale: number;
  meta: SigMFMetadata;
  fftSize: number;
  lowerTile: number;
  upperTile: number;
  zoomLevel: number;
  setMeta: (meta: SigMFMetadata) => void;
}

const AnnotationViewer = ({
  spectrogramWidthScale,
  meta,
  fftSize,
  lowerTile,
  zoomLevel,
  upperTile,
  setMeta,
}: AnnotationViewerProps) => {
  function onDragEnd(e) {
    const x = e.target.x(); // coords of the corner box
    const y = e.target.y();
    const annot_indx = e.target.id().split('-')[0];
    const annot_pos_x = e.target.id().split('-')[1];
    const annot_pos_y = e.target.id().split('-')[2];
    annotations[annot_indx][annot_pos_x] = x / spectrogramWidthScale; // reverse the calcs done to generate the coords
    annotations[annot_indx][annot_pos_y] = y;
    const start_sample_index = lowerTile * TILE_SIZE_IN_IQ_SAMPLES;
    const lower_freq = meta.captures[0]['core:frequency'] - meta.global['core:sample_rate'] / 2;
    const f = annotations[annot_indx]['index'];
    console.log('Starting changes to meta');
    console.log(meta.annotations[f]);
    meta.annotations[f]['core:sample_start'] = annotations[annot_indx].y1 * fftSize * zoomLevel + start_sample_index;
    meta.annotations[f]['core:sample_count'] =
      (annotations[annot_indx].y2 - annotations[annot_indx].y1) * fftSize * zoomLevel;
    meta.annotations[f]['core:freq_lower_edge'] =
      (annotations[annot_indx].x1 / fftSize) * meta.global['core:sample_rate'] + lower_freq;
    meta.annotations[f]['core:freq_upper_edge'] =
      (annotations[annot_indx].x2 / fftSize) * meta.global['core:sample_rate'] + lower_freq;
    console.log('Finish changes to meta');
    console.log(meta);
    console.log(meta.annotations[f]);
    let new_meta = Object.assign(new SigMFMetadata(), meta);
    setMeta(new_meta);
  }

  const annotations =
    meta?.annotations.map((annotation, index) => {
      let position = annotation.getAnnotationPosition(
        lowerTile,
        upperTile,
        meta.getCenterFrequency(),
        meta.getSampleRate(),
        fftSize,
        zoomLevel
      );
      let result = {
        ...position,
        description: annotation.getDescription(),
        index: index,
      };
      return result;
    }) ?? [];

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
      description: 'Fill Me In',
      index: -1,
      visible: true,
    });

    // Add it to the meta.annotations as well. TODO: this is duplicate code
    let updatedAnnotations = [...meta.annotations];
    annotations[annotations.length - 1]['index'] = updatedAnnotations.length;

    let start_sample_index = lowerTile * TILE_SIZE_IN_IQ_SAMPLES;
    const annot_indx = annotations.length - 1;
    let lower_freq = meta.captures[0]['core:frequency'] - meta.global['core:sample_rate'] / 2;
    meta.annotations.push(
      Object.assign(new Annotation(), {
        'core:sample_start': annotations[annot_indx].y1 * fftSize * zoomLevel + start_sample_index,
        'core:sample_count': (annotations[annot_indx].y2 - annotations[annot_indx].y1) * fftSize * zoomLevel,
        'core:freq_lower_edge': (annotations[annot_indx].x1 / fftSize) * meta.global['core:sample_rate'] + lower_freq,
        'core:freq_upper_edge': (annotations[annot_indx].x2 / fftSize) * meta.global['core:sample_rate'] + lower_freq,
        'core:description': annotations[annot_indx]['description'],
      })
    );
    let new_meta = Object.assign(new SigMFMetadata(), meta);
    setMeta(new_meta);
  }, [annotations, meta, lowerTile, fftSize, zoomLevel, setMeta]);

  // Ability to update annotation labels
  const handleTextClick = useCallback(
    (e) => {
      // create textarea and style it
      var textarea = document.createElement('textarea');
      document.body.appendChild(textarea);

      textarea.value = e.target.text();
      textarea.style.position = 'absolute';
      textarea.style.top = '300px'; // middle of screen
      textarea.style.left = '500px'; // middle of screen
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
      textarea2.style.top = '270px';
      textarea2.style.left = '600px';
      textarea2.style.width = '140px';
      textarea2.style.height = '30px';
      textarea2.rows = 1;
      textarea2.disabled = true;
      textarea2.style.resize = 'none';
      textarea2.classList.add('text-base-100');

      textarea.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          console.debug(textarea.value, textarea.id);
          annotations[textarea.id]['description'] = textarea.value; // update the local version first
          // Now update the actual meta info
          meta.annotations[annotations[textarea.id]['index']]['core:description'] = textarea.value;
          let new_meta = Object.assign(new SigMFMetadata(), meta);
          setMeta(new_meta);
          document.body.removeChild(textarea);
          document.body.removeChild(textarea2);
        }
      });
    },
    [annotations, meta, setMeta]
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
            x={annotation.x1 * spectrogramWidthScale}
            y={annotation.y1}
            width={(annotation.x2 - annotation.x1) * spectrogramWidthScale}
            height={annotation.y2 - annotation.y1}
            fillEnabled={true}
            stroke="black"
            strokeWidth={4}
            key={index}
          />
          {/* Top Left Corner */}
          <Rect
            x={annotation.x1 * spectrogramWidthScale - 4}
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
            id={index.toString() + '-x1-y1'} // tells the event which annotation, and which x and y to update
          />
          {/* Top Right Corner */}
          <Rect
            x={annotation.x2 * spectrogramWidthScale - 4}
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
            id={index.toString() + '-x2-y1'} // tells the event which annotation, and which x and y to update
          />
          {/* Bottom Left Corner */}
          <Rect
            x={annotation.x1 * spectrogramWidthScale - 4}
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
            id={index.toString() + '-x1-y2'} // tells the event which annotation, and which x and y to update
          />
          {/* Bottom Right Corner */}
          <Rect
            x={annotation.x2 * spectrogramWidthScale - 4}
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
            id={index.toString() + '-x2-y2'} // tells the event which annotation, and which x and y to update
          />
          {/* Description Label */}
          <Text
            text={annotation.description}
            fontFamily="serif"
            fontSize={24}
            x={annotation.x1 * spectrogramWidthScale}
            y={annotation.y1 - 23}
            fill="black"
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
