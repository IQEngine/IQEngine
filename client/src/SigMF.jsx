// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React from 'react';

export const SigMF = () => {
  return (
    <div className="mx-32">
      <h1 className="text-iqengine-primary text-center">What is SigMF?</h1>
      <div className="columns-2">
        <p className="text-justify text-lg">
          The Signal Metadata Format (SigMF) specifies a way to describe sets of recorded digital signals with metadata
          written in JSON. It was designed for RF recordings, which consist of IQ samples. SigMF can be used to describe
          general information about the RF recording, the characteristics of the system that generated the samples, and
          features of the signal itself.
          <br></br>
          <br></br>
          By using SigMF instead of a bespoke solution, IQEngine and other tooling maintain interoperability with the
          same files, promoting sharing of recordings. The IQEngine{' '}
          <a href="https://discord.gg/k7C8kp3b76" target="_blank">
            Discord
          </a>{' '}
          contains a channel for discussion of any SigMF-related topics!
          <br></br>
          <br></br>
          <center>
            <a href="https://github.com/sigmf/SigMF" target="_blank">
              SigMF's GitHub
            </a>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            <a href="https://github.com/sigmf/SigMF/blob/sigmf-v1.x/sigmf-spec.md" target="_blank">
              SigMF Specification
            </a>
            <br></br>
            <br></br>
            <img src="./sigmf_logo_cropped.gif" className="w-128 rounded-3xl" alt="SigMF animated logo" />
          </center>
        </p>

        <a href="./sigmf-diagram.svg">
          <img src="./sigmf-diagram.svg" className="m-3" alt="What is SigMF?" />
        </a>
        <br></br>
        <br></br>
      </div>
    </div>
  );
};
