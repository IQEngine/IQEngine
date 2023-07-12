//react functional component

import React, { useState } from 'react';

export const DateQuery = ({
  description,
  validator,
  queryName,
  handleQueryValid,
  handleQueryInvalid
}) => {
  const [show, setShow] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: "",
    to: ""
  });

  const handleDateChange = (e) => {
    const name = e.target.name;
    const value = e.target.value;
    const newDateRange = {...dateRange};
    newDateRange[name] = value;
    setDateRange(newDateRange);
    let valid = name === 'from' ? validator({from: value, to: dateRange.to}) : validator({from: dateRange.from, to: value});
    if (valid){
      return handleQueryValid(queryName, valid);
    }
    return handleQueryInvalid(queryName);
  }

  const renderDividerButtonClass = () => {
    const valid: string = validator({from: dateRange.from, to: dateRange.to});
    if (valid){
      return "btn btn-success w-80";
    }
    return "btn w-80";
  }

  return (
    <div className="mb-10">
      <div className="divider mb-8">
        <div className="tooltip" data-tip={description}>
          <button disabled={!validator({from: dateRange.from, to: dateRange.to})} onClick={() => setShow(!show)} className={renderDividerButtonClass()}>{queryName}</button>
        </div>
      </div>
      {show && <div className="card bg-neutral text-neutral-content">
        <div className="card-body">
          <div className="flex justify-around">
              <label className="label">
                <span className="label-text">FROM:</span>
              </label>
              <input data-testid="date-from" onChange={handleDateChange} value={dateRange.from} name="from" type="date" placeholder="start" className="basis-5/12 input input-bordered w-full" />
              <label className="label">
                <span className="label-text">TO:</span>
              </label>
              <input data-testid="date-to" onChange={handleDateChange} value={dateRange.to} name="to" type="date" placeholder="end" className="basis-5/12 input input-bordered w-full" />
            </div>
        </div>
      </div>}
    </div>
  )
}

export default DateQuery;
