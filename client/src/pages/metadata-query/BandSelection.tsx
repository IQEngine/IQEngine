import React from "react";

import Band from './Band';

export const MultipleSelection = ({
  selected, 
  handleSelection, 
  bands
}) => {
  return (
    <div className="flex justify-center">
      {Object.keys(bands).map((band, i) => <Band key={i} handleSelection={handleSelection} selected={selected} band={bands[band]} />)}
    </div>
  )
}

export default MultipleSelection;