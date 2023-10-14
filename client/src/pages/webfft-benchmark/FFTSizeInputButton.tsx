import React, { Dispatch, SetStateAction } from 'react';

interface FFTSizeInputProps {
  fftSize: number;
  setFftSize: Dispatch<SetStateAction<number>>;
}

const FFTSizeInput: React.FC<FFTSizeInputProps> = ({ fftSize, setFftSize }) => {
  const maxFFTSize = 131072; // Setting max limit to a reasonable power of 2
  const minFFTSize = 4; // Setting min limit to a reasonable power of 2

  const incrementFFTSize = () => {
    if (fftSize < maxFFTSize) {
      setFftSize(fftSize * 2);
    }
  };

  const decrementFFTSize = () => {
    if (fftSize > minFFTSize) {
      setFftSize(fftSize / 2);
    }
  };

  return (
    <div>
      <button
        className="border rounded-md bg-cyber-background1 border-cyber-primary"
        onClick={decrementFFTSize}
        aria-label="Decrement FFT Size by Power of 2"
      >
        -
      </button>
      <input
        type="number"
        id="fftSize"
        value={fftSize}
        readOnly
        className="w-24 p-2 border rounded-md bg-cyber-background1 border-cyber-primary text-center text-secondary font-bold"
        aria-label="Input FFT Size - Use Plus and Minus Buttons to Change FFT Size by Power of 2"
      />
      <button
        className="border rounded-md bg-cyber-background1 border-cyber-primary"
        onClick={incrementFFTSize}
        aria-label="Increment FFT Size by Power of 2"
      >
        +
      </button>
    </div>
  );
};

export default FFTSizeInput;
