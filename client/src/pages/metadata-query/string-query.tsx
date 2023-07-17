//react functional component

import React, { useState } from 'react';

export const StringQuery = ({
  queryName,
  description,
  validator,
  handleQueryValid,
  handleQueryInvalid
}) => {
  const [show, setShow] = useState(true);
  const [string, setString] = useState("");

  const handleStringChange = (e) => {
    const value = e.target.value;
    setString(value);
    const valid = validator(value);
    if (valid){
      return handleQueryValid(queryName, valid);
    }
    handleQueryInvalid(queryName);
  }

  return (
    <div className="mb-10">
      <div className="divider mb-8">
        <div className="tooltip" data-tip={description}>
          <button
            onClick={() => setShow(!show)}
            disabled={!validator(string)}
            className={string ? "btn btn-success w-80" : "btn w-80"}
          >
            {queryName}
          </button>
        </div>
      </div>
      {show && <div className="card bg-neutral text-neutral-content">
        <div className="card-body">
          <input data-testid="string-input" onChange={handleStringChange} value={string} type="text" placeholder={description} className="input input-bordered w-full" />
        </div>
      </div>}
    </div>
  )
}

export default StringQuery;
