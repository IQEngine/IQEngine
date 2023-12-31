import React from 'react';
import { useNavigate } from 'react-router-dom';

const WebfftBenchmarkTile = (props) => {
  const navigate = useNavigate();

  const handleOnClick = () => {
    navigate('/webfftbenchmark');
  };

  return (
    <div className="repocard">
      <figure>
        <img onClick={handleOnClick} className="repoimage" src="/webfft_logo.png" alt="WebFFT Benchmark tile" />
      </figure>
      <div className="repocardbody">
        <h2>Browser FFT Benchmark</h2>
        Test your browser(s) to see how fast it can perform FFTs!
      </div>
      <button className="repocardbutton" onClick={handleOnClick} id="WebFFTBenchmark">
        Benchmark
      </button>
    </div>
  );
};

export default WebfftBenchmarkTile;
