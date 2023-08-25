import React, { useState } from 'react';

import BandSelection from './band-selection';

export const FreqQuery = ({ description, validator, queryName, handleQueryValid, handleQueryInvalid }) => {
  const bands = {
    MF: ['MF', 300000, 3000000],
    HF: ['HF', 3000000, 30000000],
    VHF: ['VHF', 30000000, 300000000],
    UHF: ['UHF', 300000000, 3000000000], //300 MHz -3 GHz
    L: ['L', 1000000000, 2000000000],
    S: ['S', 2000000000, 4000000000],
    C: ['C', 4000000000, 8000000000],
    X: ['X', 8000000000, 12000000000],
    Ku: ['Ku', 12000000000, 18000000000],
    K: ['K', 18000000000, 26000000000],
    Ka: ['Ka', 26000000000, 40000000000]

  };
  const [show, setShow] = useState(true);
  const [freqRange, setFreqRange] = useState({
    from: bands.VHF[1],
    to: bands.VHF[2],
  });
  const [band, setBand] = useState(bands.VHF);

  const handleFreqChange = (e) => {
    const name = e.target.name;
    const value = e.target.value;
    const newfreqRange = { ...freqRange };
    newfreqRange[name] = value;
    setFreqRange(newfreqRange);
    let valid =
      name === 'from' ? validator({ from: value, to: freqRange.to }) : validator({ from: freqRange.from, to: value });
    if (valid) {
      return handleQueryValid(queryName, valid);
    }
    return handleQueryInvalid(queryName);
  };

  const renderDividerButtonClass = () => {
    if (validator({ from: freqRange.from, to: freqRange.to })) {
      return 'btn btn-success w-80';
    }
    return 'btn w-80';
  };

  const handleSelection = (to) => {
    setBand(to);
    setFreqRange({
      from: to[1],
      to: to[2],
    });
    const valid = validator({ from: to[1], to: to[2] });
    return handleQueryValid(queryName, valid);
  };

  return (
    <div className="mb-10">
      <div className="divider mb-8">
        <div className="tooltip" data-tip={description}>
          <button
            disabled={!validator({ from: freqRange.from, to: freqRange.to })}
            onClick={() => setShow(!show)}
            className={renderDividerButtonClass()}
          >
            {queryName}
          </button>
        </div>
      </div>
      {show && (
        <div className="card bg-neutral text-neutral-content">
          <div className="card-body">
            <BandSelection selected={band[0]} handleSelection={handleSelection} bands={bands} />
            <h3 className="text-lg">
              From:
              <span className="ml-2 badge badge-md badge-success">{`${freqRange.from} Hz`}</span>
            </h3>
            <input
              data-testid="freq-lower"
              name="from"
              onChange={handleFreqChange}
              type="range"
              step={100}
              min={0}
              max={3000000000}
              value={freqRange.from}
              className="range range-secondary w-full"
            />
            <h3 className="text-lg">
              To:
              <span className="ml-2 badge badge-md badge-success">{`${freqRange.to} Hz`}</span>
            </h3>
            <input
              data-testid="freq-upper"
              name="to"
              onChange={handleFreqChange}
              type="range"
              min={0}
              step={100}
              max={10000000000}
              value={freqRange.to}
              className="range range-secondary w-full"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default FreqQuery;
