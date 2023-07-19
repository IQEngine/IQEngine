import React from 'react';
import GeoQueryType from './geo-query-type';

export const GeoQueryTypes = ({ types, selected, handleSelection }) => {
  return (
    <div className="flex justify-center">
      {types.map((type, i) => (
        <GeoQueryType key={i} handleSelection={handleSelection} selected={selected} name={type} />
      ))}
    </div>
  );
};

export default GeoQueryTypes;
