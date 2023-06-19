// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React from 'react';
import { useNavigate } from 'react-router-dom';

const ValidatorTile = (props) => {
  const navigate = useNavigate();

  const handleOnClick = () => {
    navigate('/validator');
  };


  return (
    <div className="card w-96 bg-neutral text-neutral-content shadow-xl mb-3">
      <figure><img onClick={handleOnClick} className="object-cover h-48 w-96" src="/validator.png" alt="Shoes" /></figure>
        <div className="card-body">
        <h2 className="card-title text-2xl">SigMF Meta Validator</h2>
          <p>Validate your .sigmf-meta file using an interactive JSON schema validator</p>
          <div className="card-actions mt-2 justify-end">
            <button className="btn btn-primary w-full" onClick={handleOnClick}>browse</button>
          </div>
        </div>
    </div>
  );
};

export default ValidatorTile;
