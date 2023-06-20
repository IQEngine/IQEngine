import React, { useCallback, useEffect, useRef } from 'react';

const DualRangeSlider = ({ min, minValue, max, maxValue, setMin, setMax, unit }) => {
  const range = useRef(null);
  const getPercent = useCallback((value) => Math.round(((value - min) / (max - min)) * 100), [min, max]);

  useEffect(() => {
    const minPercent = getPercent(minValue);
    const maxPercent = getPercent(maxValue);
    if (range.current) {
      range.current.style.left = `${minPercent}%`;
      range.current.style.width = `${maxPercent - minPercent}%`;
    }
    setMin(minValue);
  }, [minValue, getPercent]);

  useEffect(() => {
    const minPercent = getPercent(minValue);
    const maxPercent = getPercent(maxValue);
    if (range.current) {
      range.current.style.width = `${maxPercent - minPercent}%`;
    }
    setMax(maxValue);
  }, [maxValue, getPercent]);

  return (
    <div className="slider-container">
      <input
        type="range"
        min={min}
        max={max}
        value={minValue}
        onChange={(event) => {
          const value = Math.min(Number(event.target.value), maxValue - 1);
          setMin(value);
        }}
        className="thumb thumb-left z-50"
      />
      <input
        type="range"
        min={min}
        max={max}
        value={maxValue}
        onChange={(event) => {
          const value = Math.max(Number(event.target.value), minValue + 1);
          setMax(value);
        }}
        className="thumb thumb-right z-50"
      />

      <div className="slider">
        <div className="slider-left-value">{minValue.toFixed(1) + ' ' + unit}</div>
        <div className="slider-track" />
        <div ref={range} className="slider-range" />
        <div className="slider-right-value">{maxValue.toFixed(1) + ' ' + unit}</div>
      </div>
    </div>
  );
};

export default DualRangeSlider;
