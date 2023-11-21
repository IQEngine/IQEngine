import React from 'react';
import { useNavigate } from 'react-router-dom';

const ConverterTile = () => {
  const navigate = useNavigate();

  const handleOnClick = () => {
    navigate('/convert');
  };

  return (
    <div className="repocard">
      <figure>
        <img onClick={handleOnClick} className="repoimage" src="/converter.png" alt="Converter tile" />
      </figure>
      <div className="repocardbody">
        <h2>SigMF Converter</h2>
       Convert your signal recordings to SigMF
      </div>
      <button onClick={handleOnClick} className="repocardbutton" id="convert">
        Convert
      </button>
    </div>
  );
};

export default ConverterTile;
