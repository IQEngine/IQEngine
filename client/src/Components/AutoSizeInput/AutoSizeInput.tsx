import React, { useState, useRef, useEffect } from 'react';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

export const AutoSizeInput = ({ value, parent = null, type = 'text', className = null, onBlur = null }) => {
  const [content, setContent] = useState(value);
  const [width, setWidth] = useState(0);
  const [error, setError] = useState(parent?.error);
  const span = useRef(null);

  useEffect(() => {
    setContent(value);
    setError(parent?.error);
  }, [value]);

  useEffect(() => {
    setWidth(span.current.offsetWidth);
  }, [content]);

  const changeHandler = (evt) => {
    setContent(evt.target.value);
  };

  const blurHandler = (evt) => {
    if (onBlur !== null) {
      const updated = onBlur(evt.target.value, parent);
      setContent(updated);
      setError(parent?.error);
    }
  };

  const keyHandler = (evt) => {
    if (evt.key === 'Enter') {
      blurHandler(evt);
    }
  };

  return (
    <div>
      <span className="hide" ref={span}>
        {content}
      </span>
      <div className="flex flex-row">
        <input
          type={type ?? 'text'}
          title={content}
          value={content}
          className={`bg-iqengine-bg input no-spin ${className}`}
          style={{ width }}
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
