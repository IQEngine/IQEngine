import React from 'react';

export const Band = ({ handleSelection, selected, band }) => {
  return (
    <label className="cursor-pointer label">
      <span className="label-text">{band[0]}</span>
      <input onChange={() => handleSelection(band)} type="checkbox" checked={selected === band[0] ? true : false} className="checkbox ml-2 checkbox-success" />
    </label>
  )
}

export default Band;