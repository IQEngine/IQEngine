// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React from 'react';
import { Layer, Rect, Text } from 'react-konva';
import { TILE_SIZE_IN_BYTES } from '../../Utils/constants';

const AnnotationViewer = (props) => {
  let { spectrogramWidthScale, annotations, fftSize, meta, lowerTile, bytesPerSample } = props;

  // These two lines are a hack used to force a re-render when an annotation is updated, which for some reason wasnt updating
  const [, updateState] = React.useState();
  const forceUpdate = React.useCallback(() => updateState({}), []);

  function onDragEnd(e) {
    const x = e.target.x(); // coords of the corner box
    const y = e.target.y();
    const annot_indx = e.target.id().split('-')[0];
    const annot_pos_x = e.target.id().split('-')[1];
    const annot_pos_y = e.target.id().split('-')[2];
    annotations[annot_indx][annot_pos_x] = x / spectrogramWidthScale; // reverse the calcs done to generate the coords
    annotations[annot_indx][annot_pos_y] = y;
    forceUpdate(); // TODO remove the forceupdate and do it the proper way (possibly using spread?)

    // Now update the actual meta.annotations
    const f = annotations[annot_indx]['index']; // remember there are 2 different indexes- the ones on the screen and the meta.annotations
    let updatedAnnotations = [...props.meta.annotations];
    let start_sample_index = (lowerTile * TILE_SIZE_IN_BYTES) / 2 / bytesPerSample;
    updatedAnnotations[f]['core:sample_start'] = (annotations[annot_indx].y1 / 0.92) * fftSize + start_sample_index; // FIXME FIGURE OUT WHY I NEED 0.92
    updatedAnnotations[f]['core:sample_count'] =
      ((annotations[annot_indx].y2 - annotations[annot_indx].y1) / 0.92) * fftSize; // FIXME FIGURE OUT WHY I NEED 0.92
    let lower_freq = meta.captures[0]['core:frequency'] - meta.global['core:sample_rate'] / 2;
    updatedAnnotations[f]['core:freq_lower_edge'] =
      (annotations[annot_indx].x1 / fftSize) * meta.global['core:sample_rate'] + lower_freq;
    updatedAnnotations[f]['core:freq_upper_edge'] =
      (annotations[annot_indx].x2 / fftSize) * meta.global['core:sample_rate'] + lower_freq;
    props.handleMeta(updatedAnnotations);
  }

  // add cursor styling
  function onMouseOver() {
    document.body.style.cursor = 'move';
  }
  function onMouseOut() {
    document.body.style.cursor = 'default';
  }

  const newAnnotationClick = (e) => {
    annotations.push({ description: 'Fill Me In', x1: 200, x2: 400, y1: 200, y2: 400 });
    forceUpdate(); // TODO remove the forceupdate and do it the proper way (possibly using spread?)
  };

  // Ability to update annotation labels
  const handleTextClick = (e) => {
    // create textarea and style it
    var textarea = document.createElement('textarea');
    document.body.appendChild(textarea);

    textarea.value = e.target.text();
    textarea.style.position = 'absolute';
    textarea.style.top = '300px'; // middle of screen
    textarea.style.left = '600px'; // middle of screen
    textarea.style.width = '200px';
    textarea.id = e.target.id();

    textarea.focus();

    textarea.addEventListener('keydown', function (e) {
      // hide on enter
      if (e.key === 'Enter') {
        console.log(textarea.value, textarea.id);
        annotations[textarea.id]['description'] = textarea.value; // update the local version first
        // Now update the actual meta info
        let updatedAnnotations = [...props.meta.annotations];
        updatedAnnotations[textarea.id]['core:description'] = textarea.value;
        props.handleMeta(updatedAnnotations);
        document.body.removeChild(textarea);
        forceUpdate(); // TODO remove the forceupdate and do it the proper way (possibly using spread?)
      }
    });
  };

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

      {annotations.map((annotation, index) => (
        // for params of Rect see https://konvajs.org/api/Konva.Rect.html
        // for Text params see https://konvajs.org/api/Konva.Text.html
        // Note that index is for the list of annotations currently on the screen, not for meta.annotations which contains all
        <>
          {/* Main rectangle */}
          <Rect
            x={annotation.x1 * spectrogramWidthScale}
            y={annotation.y1}
            width={(annotation.x2 - annotation.x1) * spectrogramWidthScale}
            height={annotation.y2 - annotation.y1}
            fillEnabled="false"
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
            fillEnabled="true"
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
            fillEnabled="true"
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
            fillEnabled="true"
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
            fillEnabled="true"
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
        </>
      ))}
    </Layer>
  );
};

export { AnnotationViewer };
