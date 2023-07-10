import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

export const AutoSizeInput = ({
  value,
  parent = null,
  type = 'text',
  className = null,
  onBlur = null,
  label = null,
  minWidth = null,
}) => {
  const [content, setContent] = useState(value);
  const [width, setWidth] = useState(0);
  const [error, setError] = useState('');
  const span = useRef(null);

  useEffect(() => {
    setContent(value);
  }, [value]);

  useEffect(() => {
    setError(parent?.error);
  }, [parent?.error]);

  useEffect(() => {
    setWidth(span.current.offsetWidth + 3);
  }, [content, span.current?.offsetWidth]);

  const changeHandler = useCallback((evt) => {
    setContent(evt.target.value);
  }, []);

  const blurHandler = useCallback(
    (evt) => {
      if (onBlur !== null) {
        onBlur(evt.target.value, parent);
      }
    },
    [onBlur, parent]
  );

  const keyHandler = useCallback(
    (evt) => {
      if (evt.key === 'Enter') {
        blurHandler(evt);
      }
    },
    [blurHandler]
  );

  return (
    <div>
      <span className="hide" ref={span}>
        {content}
      </span>
      <div className="flex flex-row">
        <input
          aria-label={label}
          type={type ?? 'text'}
          title={content}
          value={content}
          className={`bg-base-100 input input-autosize no-spin ${className}`}
          style={{ width, minWidth: minWidth ?? width }}
          autoFocus
          onChange={changeHandler}
          onBlur={blurHandler}
          onKeyUp={keyHandler}
        />
        {error && (
          <div data-testid="test" aria-label="error">
            <ExclamationCircleIcon role="error" stroke="red" className="inline-block h-6 w-6" title={error} />
          </div>
        )}
      </div>
    </div>
  );
};
export default AutoSizeInput;
