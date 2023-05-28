// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React, { Fragment } from 'react';
import { Layer, Rect, Text } from 'react-konva';
import { TILE_SIZE_IN_IQ_SAMPLES } from '../../Utils/constants';
import { useAppSelector, useAppDispatch } from '@/Store/hooks';
import { setMetaAnnotations } from '@/Store/Reducers/FetchMetaReducer';

const AnnotationViewer = (props) => {
  const meta = useAppSelector((state) => state.meta);
  const dispatch = useAppDispatch();
  let { spectrogramWidthScale, annotations, fftSize, lowerTile, zoomLevel } = props;

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
    let updatedAnnotations = [...meta.annotations];
    let start_sample_index = lowerTile * TILE_SIZE_IN_IQ_SAMPLES;
    updatedAnnotations[f]['core:sample_start'] = annotations[annot_indx].y1 * fftSize * zoomLevel + start_sample_index;
    updatedAnnotations[f]['core:sample_count'] =
      (annotations[annot_indx].y2 - annotations[annot_indx].y1) * fftSize * zoomLevel;
    let lower_freq = meta.captures[0]['core:frequency'] - meta.global['core:sample_rate'] / 2;
    updatedAnnotations[f]['core:freq_lower_edge'] =
      (annotations[annot_indx].x1 / fftSize) * meta.global['core:sample_rate'] + lower_freq;
    updatedAnnotations[f]['core:freq_upper_edge'] =
      (annotations[annot_indx].x2 / fftSize) * meta.global['core:sample_rate'] + lower_freq;
    dispatch(setMetaAnnotations(updatedAnnotations));
  }

  // add cursor styling
  function onMouseOver() {
    document.body.style.cursor = 'move';
  }
  function onMouseOut() {
    document.body.style.cursor = 'default';
  }

  const newAnnotationClick = (e) => {
    annotations.push({
      x1: 200,
      x2: 400,
      y1: 200,
      y2: 400,
      description: 'Fill Me In',
      index: -1,
    });
    forceUpdate(); // TODO remove the forceupdate and do it the proper way (possibly using spread?)

    // Add it to the meta.annotations as well. TODO: this is duplicate code
    let updatedAnnotations = [...meta.annotations];
    annotations[annotations.length - 1]['index'] = updatedAnnotations.length;
    updatedAnnotations.push({});
    const f = updatedAnnotations.length - 1;
    const annot_indx = annotations.length - 1;
    let start_sample_index = lowerTile * TILE_SIZE_IN_IQ_SAMPLES;
    updatedAnnotations[f]['core:sample_start'] = annotations[annot_indx].y1 * fftSize * zoomLevel + start_sample_index;
    updatedAnnotations[f]['core:sample_count'] =
      (annotations[annot_indx].y2 - annotations[annot_indx].y1) * fftSize * zoomLevel;
    let lower_freq = meta.captures[0]['core:frequency'] - meta.global['core:sample_rate'] / 2;
    updatedAnnotations[f]['core:freq_lower_edge'] =
      (annotations[annot_indx].x1 / fftSize) * meta.global['core:sample_rate'] + lower_freq;
    updatedAnnotations[f]['core:freq_upper_edge'] =
      (annotations[annot_indx].x2 / fftSize) * meta.global['core:sample_rate'] + lower_freq;
    updatedAnnotations[f]['core:description'] = annotations[annot_indx]['description'];
    dispatch(setMetaAnnotations(updatedAnnotations));
  };

  // Ability to update annotation labels
  const handleTextClick = (e) => {
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
    textarea2.style.backgroundColor = 'black';

    textarea.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        console.log(textarea.value, textarea.id);
        annotations[textarea.id]['description'] = textarea.value; // update the local version first
        // Now update the actual meta info
        let updatedAnnotations = [...meta.annotations];
        updatedAnnotations[annotations[textarea.id]['index']]['core:description'] = textarea.value;
        dispatch(setMetaAnnotations(updatedAnnotations));
        document.body.removeChild(textarea);
        document.body.removeChild(textarea2);
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
        <Fragment key={index}>
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
        </Fragment>
      ))}
    </Layer>
  );
};

export { AnnotationViewer };
