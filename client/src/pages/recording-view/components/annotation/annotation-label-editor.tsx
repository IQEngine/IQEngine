import React, { useRef } from 'react';
import { Text } from 'react-konva';
import { Html } from 'react-konva-utils';

interface AnnotationLabelEditorProps {
  labelText: string;
  top: string;
  left: string;
  visible: boolean;
  setEditAnnotationLabel: (editAnnotationLabel: boolean) => void;
}

export const AnnotationLabelEditor = ({
  labelText,
  top,
  left,
  visible,
  setEditAnnotationLabel,
}: AnnotationLabelEditorProps) => {
  if (!visible) {
    return <></>;
  }

  let style = 'top: ' + top + ';left: ' + left + ';width:400px;fontSize:25px;position:absolute';

  return (
    <Html>
      <textarea placeholder={labelText} data-style={style} data-rows="1"></textarea>
    </Html>
  );
};

// textarea.value = e.target.text();
// textarea.style.position = 'absolute';
// textarea.style.top = spectrogram.top + e.target.attrs.y + 'px';
// textarea.style.left = spectrogram.left + e.target.attrs.x + 'px';
// textarea.style.width = '400px';
// textarea.style.fontSize = '25px';
// textarea.rows = 1;
// textarea.id = e.target.id();
// textarea.focus();
// textarea.classList.add('text-base-100');
