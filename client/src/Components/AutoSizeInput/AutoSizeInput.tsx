import React, { useState, useRef, useEffect } from 'react';

export const AutoSizeInput = ({ value, parent, type, className, onChange }) => {
  const [content, setContent] = useState(value);
  const [width, setWidth] = useState(0);
  const span = useRef(null);

  useEffect(() => {
    setContent(value);
  }, [value]);

  useEffect(() => {
    setWidth(span.current.offsetWidth);
  }, [content]);

  const changeHandler = (evt) => {
    setContent(evt.target.value);
  };

  const blurHandler = (evt) => {
    const updated = onChange(evt.target.value, parent);
    setContent(updated);
  };

  return (
    <div>
      <span className="hide" ref={span}>
        {content}
      </span>
      <input
        type={type ?? 'text'}
        value={content}
        className={`bg-iqengine-bg input no-spin ${className}`}
        style={{ width }}
        autoFocus
        onChange={changeHandler}
        onBlur={blurHandler}
      />
    </div>
  );
};
export default AutoSizeInput;
