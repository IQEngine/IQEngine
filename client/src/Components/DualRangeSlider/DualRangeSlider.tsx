import React, { useCallback, useEffect, useState, useRef } from 'react';

const DualRangeSlider = ({ min, minValue, max, maxValue, onChangeMin, onChangeMax }) => {
  const [minVal, setMinVal] = useState(minValue);
  const [maxVal, setMaxVal] = useState(maxValue);
  const range = useRef(null);

  const getPercent = useCallback((value) => Math.round(((value - min) / (max - min)) * 100), [min, max]);

  useEffect(() => {
    const minPercent = getPercent(minVal);
    const maxPercent = getPercent(maxVal);

    if (range.current) {
      range.current.style.left = `${minPercent}%`;
      range.current.style.width = `${maxPercent - minPercent}%`;
    }

    onChangeMin(minVal);
  }, [minVal, getPercent]);

  useEffect(() => {
    const minPercent = getPercent(minVal);
    const maxPercent = getPercent(maxVal);

    if (range.current) {
      range.current.style.width = `${maxPercent - minPercent}%`;
    }

    onChangeMax(maxVal);
  }, [maxVal, getPercent]);

  return (
    <div className="slider-container">
      <input
        type="range"
        min={min}
        max={max}
        value={minVal}
        onChange={(event) => {
          const value = Math.min(Number(event.target.value), maxVal - 1);
          setMinVal(value);
        }}
        className="thumb thumb-left z-50"
      />
      <input
        type="range"
        min={min}
        max={max}
        value={maxVal}
        onChange={(event) => {
          const value = Math.max(Number(event.target.value), minVal + 1);
          setMaxVal(value);
        }}
        className="thumb thumb-right z-50"
      />

      <div className="slider">
        <div className="slider-left-value">{minVal}</div>
        <div className="slider-track" />
        <div ref={range} className="slider-range" />
        <div className="slider-right-value">{maxVal}</div>
      </div>
    </div>
  );
};

export default DualRangeSlider;
