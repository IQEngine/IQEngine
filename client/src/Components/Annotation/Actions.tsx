import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRightIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { Annotation, SigMFMetadata } from '@/Utils/sigmfMetadata';

interface ActionsProps {
  meta: SigMFMetadata;
  startSampleCount: number;
  spectrogramHeight: number;
  index: number;
  annotation: Annotation;
  setHandleTop: (handleTop: number) => void;
  setMeta: (meta: SigMFMetadata) => void;
}

export const Actions = ({
  meta,
  startSampleCount,
  spectrogramHeight,
  index,
  annotation,
  setHandleTop,
  setMeta,
}: ActionsProps) => {
  const modal = useRef(null);
  const [currentAnnotation, setCurrentAnnotation] = useState(JSON.stringify(annotation, undefined, 4));

  const toggle = () => {
    if (modal.current.className === 'modal w-full h-full') {
      modal.current.className = 'modal modal-open w-full h-full';
    } else {
      modal.current.className = 'modal w-full h-full';
    }
  };

  const onChangeHandler = (e) => {
    setCurrentAnnotation(e.target.value);
  };

  const onUpdateHandler = (e) => {
    try {
      meta.annotations[index] = Object.assign(new Annotation(), JSON.parse(currentAnnotation));
      let new_meta = Object.assign(new SigMFMetadata(), meta);
      setMeta(new_meta);
      toggle();
    } catch (e) {
      console.error(e.message);
      return;
    }
  };

  return (
    <div>
      <button
        onClick={() => {
          const fractionIntoFile = startSampleCount / meta.getLengthInIQSamples();
          const handleTop = fractionIntoFile * spectrogramHeight;
          setHandleTop(handleTop);
        }}
      >
        <ArrowRightIcon className="h-4 w-4" />
      </button>
      <button aria-label={'Annotation ' + index + ' Modal Open Button'} onClick={toggle}>
        <ArrowTopRightOnSquareIcon className="h-4 w-4" />
      </button>
      <dialog aria-label={'Annotation ' + index + ' Modal'} ref={modal} className="modal w-full h-full">
        <form method="dialog" className="modal-box">
          <h3 className="font-bold text-lg text-primary">Annotation {index}</h3>
          <button
            aria-label={'Annotation ' + index + ' Modal Close Button'}
            className="absolute right-2 top-2 bg-base-100 text-primary font-bold"
            onClick={toggle}
          >
            ✕
          </button>
          <div>
            <textarea
              aria-label={'Annotation ' + index + ' Modal Text Area'}
              className="w-full textarea bg-base-100 text-base-content overflow-hidden hover:overflow-auto"
              rows={8}
              onChange={onChangeHandler}
              value={currentAnnotation}
            ></textarea>
          </div>
          <button
            aria-label={'Annotation ' + index + ' Modal Update Button'}
            className="btn btn-primary btn-sm"
            onClick={onUpdateHandler}
          >
            Update
          </button>
        </form>
      </dialog>
    </div>
  );
};

export default Actions;
