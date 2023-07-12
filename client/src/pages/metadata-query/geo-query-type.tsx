import React from "react";

export const GeoQueryType = ({
  name,
  selected,
  handleSelection
}) => {
  return (
    <label htmlFor={name} className="cursor-pointer label">
      <span className="label-text">{name}</span>
      <input id={name} onChange={() => handleSelection(name)} type="checkbox" checked={selected === name ? true : false} className="checkbox ml-2 checkbox-success" />
    </label>
  )
}

export default GeoQueryType;