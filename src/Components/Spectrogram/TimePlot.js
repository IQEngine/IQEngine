// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import Plot from 'react-plotly.js';
import React, { useEffect, useState } from 'react';
import { Modal, ModalHeader, ModalBody } from 'reactstrap';
import Button from 'react-bootstrap/Button';
import { fftshift } from 'fftshift';

const FFT = require('fft.js');

export const TimePlot = (props) => {
  let { currentSamples, toggleModal, openModal } = props;
  const [selectedOption, setSelectedOption] = useState('time');
  const [I, setI] = useState();
  const [Q, setQ] = useState();
  const [magnitudes, setMagnitudes] = useState();

  const onChangeSelectedOption = (e) => {
    setSelectedOption(e.target.value);
  };

  useEffect(() => {
    if (currentSamples && currentSamples.length > 0) {
      setI(
        currentSamples.filter((element, index) => {
          return index % 2 === 0;
        })
      );

      setQ(
        currentSamples.filter((element, index) => {
          return index % 2 === 1;
        })
      );

      // Calc PSD
      const fft_size = Math.pow(2, Math.floor(Math.log2(currentSamples.length / 2)));
      const f = new FFT(fft_size);
      const out = f.createComplexArray(); // creates an empty array the length of fft.size*2
      f.transform(out, currentSamples.slice(0, fft_size * 2)); // assumes input (2nd arg) is in form IQIQIQIQ and twice the length of fft.size
      let mags = new Array(out.length / 2);
      for (let j = 0; j < out.length / 2; j++) {
        mags[j] = Math.sqrt(Math.pow(out[j * 2], 2) + Math.pow(out[j * 2 + 1], 2)); // take magnitude
      }
      fftshift(mags); // in-place
      mags = mags.map((x) => 10.0 * Math.log10(x));
      setMagnitudes(mags);
    }
  }, [currentSamples]); // TODO make sure this isnt going to be sluggish when currentSamples is huge

  return (
    <div>
      <Button type="button" variant="secondary" onClick={toggleModal} style={{ marginRight: '15px' }}>
        Time/Freq Plot
      </Button>

      <Modal isOpen={openModal} toggle={toggleModal} size="lg">
        <ModalHeader toggle={toggleModal}>Plot</ModalHeader>
        <ModalBody>
          <div style={{ marginBottom: '15px' }}>
            <input
              type="radio"
              value="time"
              onChange={onChangeSelectedOption}
              checked={selectedOption === 'time'}
              style={{ marginRight: '5px' }}
            />
            Time
            <input
              type="radio"
              value="frequency"
              onChange={onChangeSelectedOption}
              checked={selectedOption === 'frequency'}
              style={{ marginLeft: '15px', marginRight: '5px' }}
            />
            Frequency
          </div>

          {selectedOption === 'time' && (
            <Plot
              data={[
                {
                  y: I,
                  type: 'scatter',
                  name: 'I',
                  marker: { color: 'red' },
                },
                {
                  y: Q,
                  type: 'scatter',
                  name: 'Q',
                  marker: { color: 'blue' },
                },
              ]}
              layout={{
                title: 'Time Domain Plot',
                autosize: true,
                dragmode: 'pan',
                showlegend: true,
                xaxis: {
                  title: 'Time',
                  rangeslider: { range: [0, 1000] },
                },
                yaxis: {
                  title: 'Samples',
                  fixedrange: true,
                },
              }}
              config={{
                displayModeBar: true,
                scrollZoom: true,
              }}
            />
          )}

          {selectedOption === 'frequency' && (
            <Plot
              data={[
                {
                  y: magnitudes,
                  type: 'scatter',
                  marker: { color: 'green' },
                },
              ]}
              layout={{
                title: 'Frequency Domain Plot',
                autosize: true,
                dragmode: 'pan',
                xaxis: {
                  title: 'Frequency',
                  //range: [0, 100],
                  rangeslider: { range: [0, 100] },
                },
                yaxis: {
                  title: 'Magnitude',
                  fixedrange: false,
                },
              }}
              config={{
                displayModeBar: true,
                scrollZoom: true,
              }}
            />
          )}
        </ModalBody>
      </Modal>
    </div>
  );
};
