// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFeatureFlags } from '@/hooks/use-feature-flags';

export const LandingPage = () => {
  const navigate = useNavigate();
  const { getFeatureFlag } = useFeatureFlags();

  const handleOnClick = async () => {
    navigate('/browser');
  };

  if (getFeatureFlag('bypassLandingPage')) {
    return (
      <div className="flex pt-4 pb-6">
        <div className="w-96"></div>
        <div className="w-full grid justify-items-center text-center">
          <h1>A web-based SDR toolkit for analyzing, processing, and sharing RF recordings</h1>

          <div className="py-6">
            <button
              id="browse-button"
              className="text-3xl py-2 px-4 bg-accent hover:bg-primary"
              onClick={handleOnClick}
            >
              &#128270; Start Browsing
            </button>
          </div>

          <div className="flex justify-center items-center h-fit py-4">
            <div className="pr-4">
              <h2 className="mb-6">
                Browse RF recordings shared by the community, or view your own local files, all in the browser!
              </h2>
              <h2 className="mb-6">
                The spectrogram-based viewer has a VSCode-style minimap showing you a summary of the entire recording
              </h2>
              <h2>The main spectrogram view shows SigMF annotations and other useful information</h2>
            </div>
            <img className="h-96" alt="browsing iqengine animated gif" src="./browsing-animated.gif"></img>
          </div>

          <div className="flex justify-center items-center h-fit py-4">
            <img
              className="h-96"
              alt="iqengine plugin fm detector example screenshot"
              src="./fm_detector_example.png"
            ></img>

            <div className="pl-4">
              <h2 className="mb-6">The IQEngine's Plugins system lets you run RF DSP on recordings</h2>

              <h2 className="mb-6">
                Plugins written in Python and GNU Radio are supported out-of-the box but other languages are possible by
                implementing the{' '}
                <a className="underline" href="./docs/plugins">
                  Plugins API
                </a>
              </h2>

              <h2>Plugins run on the backend (not client-side like the spectrogram FFTs)</h2>
            </div>
          </div>

          <div className="flex justify-center items-center h-fit py-4">
            <div className="pr-4">
              <h2 className="mb-6">
                Run your own instance of IQEngine to share recordings privately within your company or organization
              </h2>
              <h2 className="mb-6">
                IQEngine's Admin Page lets you manage users, access to recordings/plugins, and deployment configuration
              </h2>
              <h2>
                RF recordings are stored in the cloud using blob storage, allowing for easy security and data redundancy
              </h2>
            </div>
            <img
              className="h-96"
              alt="iqengine admin page animated gif screenshot"
              src="./admin-page-animated.gif"
            ></img>
          </div>

          <div className="flex justify-center items-center h-fit py-4">
            <img className="h-96" alt="iqengine siggen signal generator screenshot" src="./siggen_screenshot.png"></img>

            <div className="pl-4">
              <h2 className="mb-6">
                IQEngine is education-oriented, with several "playgrounds" perfect for learning RF DSP
              </h2>

              <h2 className="mb-6">
                The Signal Generator (Siggen) page lets you play around with Python-based DSP, all in the browser
              </h2>

              <h2>Try out the example transmitters, and download SigMF recordings of the signals you generate</h2>
            </div>
          </div>
        </div>

        <div className="w-96"></div>
      </div>
    );
  } else {
    navigate('/browser');
  }
};

export default LandingPage;
