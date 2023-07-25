import React, { useEffect, useRef, useState } from 'react';
import { ArrowRightIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { Annotation, SigMFMetadata } from '@/utils/sigmfMetadata';
import { metadataValidator } from '@/utils/validators';
import { ModalDialog } from '@/features/ui/modal/Modal';

interface ActionsProps {
  meta: SigMFMetadata;
  startSampleCount: number;
  spectrogramHeight: number;
  index: number;
  setHandleTop: (handleTop: number) => void;
  setMeta: (meta: SigMFMetadata) => void;
  setSelectedAnnotation: (index: number) => void;
}

export const Actions = ({
  meta,
  startSampleCount,
  spectrogramHeight,
  index,
  setHandleTop,
  setMeta,
  setSelectedAnnotation,
}: ActionsProps) => {
  const [currentAnnotation, setCurrentAnnotation] = useState(JSON.stringify(meta.annotations[index], undefined, 4));
  const [errors, setErrors] = useState([]);
  const [showModal, setShowModal] = useState(false);

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
      setShowModal(!showModal);
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
          setSelectedAnnotation(index);
          setHandleTop(handleTop);
        }}
      >
        <ArrowRightIcon className="h-4 w-4" />
      </button>

      <button aria-label={'Annotation ' + index + ' Modal Open'} onClick={() => {
              setShowModal(true);
            }}>
        <ArrowTopRightOnSquareIcon className="h-4 w-4" />
      </button>

      {showModal && <ModalDialog heading={'Annotation ' + index} setShowModal={setShowModal}>
      <div>
          <div>
            <textarea
              aria-label={'Annotation ' + index + ' Modal'}
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
            aria-label={'Annotation ' + index + ' Modal Update'}
            onClick={onUpdateHandler}
            disabled={errors?.length > 0}
          >
            Update
          </button>
          </div>
        </ModalDialog>}
    </div>

  );
};

export default Actions;
