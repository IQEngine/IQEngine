import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRightIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { Annotation, SigMFMetadata } from '@/utils/sigmfMetadata';
import { metadataValidator } from '@/utils/validators';

interface ActionsProps {
  meta: SigMFMetadata;
  startSampleCount: number;
  spectrogramHeight: number;
  index: number;
  setHandleTop: (handleTop: number) => void;
  setMeta: (meta: SigMFMetadata) => void;
}

export const Actions = ({ meta, startSampleCount, spectrogramHeight, index, setHandleTop, setMeta }: ActionsProps) => {
  const modal = useRef(null);
  const [currentAnnotation, setCurrentAnnotation] = useState(JSON.stringify(meta.annotations[index], undefined, 4));
  const [errors, setErrors] = useState([]);

  const toggle = () => {
    if (modal.current.className === 'modal w-full h-full') {
      modal.current.className = 'modal modal-open w-full h-full';
    } else {
      modal.current.className = 'modal w-full h-full';
    }
  };

  useEffect(() => {
    setCurrentAnnotation(JSON.stringify(meta.annotations[index], undefined, 4));
  }, [meta]);

  useEffect(() => {
    const annotationsString = `{"annotations":[${currentAnnotation}]}`;
    const validateAnnotations = metadataValidator(annotationsString, '/annotations');
    setErrors(validateAnnotations?.errors);
  }, [currentAnnotation]);

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
          <div className="flex justify-center text-error">
            <ul aria-label="Validator Errors" style={{ width: '700px' }}>
              {errors.map((error, i) => (
                <li key={'error ' + i}>
                  <svg
                    className="w-4 h-4 mr-1.5 text-error flex-shrink-0 inline-block"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                  {error.message} {error.instancePath ? ' inside ' + error.instancePath : ''}
                </li>
              ))}
            </ul>
          </div>
          <button
            aria-label={'Annotation ' + index + ' Modal Update Button'}
            onClick={onUpdateHandler}
            disabled={errors?.length > 0}
          >
            Update
          </button>
        </form>
      </dialog>
    </div>
  );
};

export default Actions;
