// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React, { Fragment, useCallback, useMemo, useRef, useState } from 'react';
import { Layer, Rect, Text } from 'react-konva';
import { Annotation, SigMFMetadata } from '@/utils/sigmfMetadata';
import { useSpectrogramContext } from '../../hooks/use-spectrogram-context';
import { Html } from 'react-konva-utils';
import { color } from '@uiw/react-codemirror';

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
  const [editAnnotationLabelId, setEditAnnotationLabelId] = useState(null);
  const [editAnnotationLabelText, setEditAnnotationLabelText] = useState(null);

  const onAnnotationsLabelKeyDown = (e) => {
    if (e.key === 'Enter') {
      annotations[editAnnotationLabelId]['label'] = e.target.value;
      meta.annotations[annotations[editAnnotationLabelId]['index']]['core:label'] = e.target.value;
      let new_meta = Object.assign(new SigMFMetadata(), meta);
      setMeta(new_meta);
      setEditAnnotationLabelId(null);
    }
  };

  const onAnnotationLabelClick = useCallback((e) => {
    // create textarea and style it
    setEditAnnotationLabelId(e.currentTarget.id);
    setEditAnnotationLabelText(e.currentTarget.textContent);
  }, []);

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

      const visible = start < maximumFFT && end > minimumFFT;
      const labelVisible = (start > minimumFFT && start < maximumFFT) || (end < maximumFFT && end > minimumFFT);
      const capture = meta.getCapture(annotation['core:sample_start']);

      return {
        x1: (annotation['core:freq_lower_edge'] - capture['core:frequency']) / meta.getSampleRate() + 0.5,
        x2: (annotation['core:freq_upper_edge'] - capture['core:frequency']) / meta.getSampleRate() + 0.5,
        y1: (start - minimumFFT) / (fftStepSize + 1),
        y2: (end - minimumFFT) / (fftStepSize + 1),
        label: annotation.getLabel(),
        comment: annotation.getComment(),
        shortComment: annotation.getShortComment(),
        index: index,
        visible: visible,
        labelVisible: labelVisible,
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
      comment: null,
      shortComment: null,
      index: -1,
      visible: true,
      labelVisible: true,
    });

    // Add it to the meta.annotations as well. TODO: this is duplicate code
    let updatedAnnotations = [...meta.annotations];
    annotations[annotations.length - 1]['index'] = updatedAnnotations.length;

    let start_sample_index = currentFFT * fftSize;
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

      {annotations?.map(
        (annotation, index) =>
          annotation.visible && (
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
              {annotation.labelVisible && (
                <>
                  <Html>
                    <div
                      className={annotation.comment ? 'tooltip tooltip-bottom tooltip-accent absolute' : 'absolute'}
                      data-tip={annotation.shortComment}
                      id={index.toString()}
                      onClick={onAnnotationLabelClick}
                      style={{
                        top: annotation.y1 - 23,
                        left: annotation.x1 * spectrogramWidth,
                        color: selectedAnnotation == index ? 'pink' : 'black',
                      }}
                    >
                      <p
                        className="font-serif font-bold"
                        style={{
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {annotation.label}
                      </p>
                    </div>
                  </Html>
                  <>
                    {editAnnotationLabelId === index.toString() && (
                      <Html>
                        <div
                          className="form-control w-full max-w-xs"
                          style={{
                            top: annotation.y1 - 50,
                            left: annotation.x1 * spectrogramWidth,
                            position: 'absolute',
                          }}
                        >
                          <label style={{ width: '200px', fontSize: '16px' }}>
                            <span>Hit Enter to Finish</span>
                          </label>
                          <input
                            type="text"
                            value={editAnnotationLabelText}
                            onChange={(e) => setEditAnnotationLabelText(e.target.value)}
                            onKeyDown={onAnnotationsLabelKeyDown}
                            style={{ width: '200px', fontSize: '16px', color: 'black' }}
                          />
                        </div>
                      </Html>
                    )}
                  </>
                </>
              )}
            </Fragment>
          )
      )}
    </Layer>
  );
};

export { AnnotationViewer };
