// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFeatureFlags } from '@/hooks/use-feature-flags';
import Transition from './transition';
import Browser from '../browser/browser';

export const LandingPage = () => {
  const navigate = useNavigate();
  const { getFeatureFlag } = useFeatureFlags();
  const [tab, setTab] = useState(1);

  const tabs = useRef(null);

  const heightFix = () => {
    if (tabs.current)
      if (tabs.current.children[tab]) {
        tabs.current.style.height = tabs.current.children[tab - 1].offsetHeight + 'px';
      }
  };

  useEffect(() => {
    heightFix();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const handleOnClick = async () => {
    navigate('/browser');
  };

  return getFeatureFlag('bypassLandingPage') ? (
    <Browser />
  ) : (
    <>
      <main className="flex-grow">
        <section className="relative">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            {/* Hero content */}
            <div className="pt-4 pb-12">
              {/* Section header */}
              <div className="text-center pb-4">
                <h1 className="text-4xl font-extrabold leading-tighter tracking-tighter mb-4" data-aos="zoom-y-out">
                  A{' '}
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-200">
                    web-based
                  </span>{' '}
                  SDR toolkit for analyzing,<br></br> processing, and sharing RF recordings
                </h1>

                <div
                  className="pt-4 pb-6 max-w-xs mx-auto sm:max-w-none sm:flex sm:justify-center"
                  data-aos="zoom-y-out"
                  data-aos-delay="300"
                >
                  <button
                    id="browse-button"
                    className="text-3xl py-2 px-4 bg-accent hover:bg-primary"
                    onClick={handleOnClick}
                  >
                    &#128270; Start Browsing
                  </button>
                </div>
                <div className="grid gap-2 font-bold text-lg text-primary pb-4 justify-items-center">
                  <p>Browse RF recordings shared by the community or your own local files</p>
                  <hr className="border-secondary border-2 rounded w-16 " />
                  <p>View/edit SigMF annotations and other useful metadata</p>
                  <hr className="border-secondary border-2 rounded w-16" />
                  <p>Expand your knowledge of wireless signals and how to analyze/process them</p>
                  <hr className="border-secondary border-2 rounded w-16" />
                  <p>Bringing the open-source RF community together</p>
                </div>
                {/* Animation
                <div>
                  <div className="relative flex justify-center mb-8" data-aos="zoom-y-out" data-aos-delay="450">
                    <div className="flex flex-col justify-center">
                      <img className="mx-auto" src="./browsing-animated.gif" width="768" height="432" alt="Hero" />
                    </div>
                  </div>
                </div>
                */}
              </div>
            </div>
          </div>
        </section>

        <section className="relative">
          {/* Section background (needs .relative class on parent and next sibling elements) */}
          <div className="absolute inset-0 bg-secondary pointer-events-none" aria-hidden="true"></div>
          <div className="absolute left-0 right-0 m-auto w-px p-px h-20 bg-gray-200 transform -translate-y-1/2"></div>

          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pb-10">
            <div className="pt-12">
              {/* Section header */}
              <div className="max-w-3xl mx-auto text-center pb-4">
                <h1 className="h2 mb-4 text-base-100">Learn more about IQEngine</h1>
              </div>

              {/* Section content */}
              <div className="md:grid md:grid-cols-12 md:gap-6">
                {/* Content */}
                <div
                  className="max-w-xl md:max-w-none md:w-full mx-auto md:col-span-7 lg:col-span-6"
                  data-aos="fade-right"
                >
                  {/* Tabs buttons */}
                  <div className="mb-8 md:mb-0">
                    <a
                      className={`flex items-center text-lg p-5 rounded transition duration-300 ease-in-out mb-3 ${
                        tab !== 1 ? 'bg-gray-400  ' : 'bg-gray-200'
                      }`}
                      href="#0"
                      onClick={(e) => {
                        e.preventDefault();
                        setTab(1);
                      }}
                    >
                      <div>
                        <div className="text-secondary font-bold leading-snug tracking-tight mb-1">
                          IQEngine's Plugins let you run RF DSP on recordings
                        </div>
                        <div className="text-black">
                          Plugins written in Python and GNU Radio are supported out-of-the box but other languages are
                          possible by implementing the Plugins API Plugins run on the backend (not client-side like the
                          spectrogram FFTs)
                        </div>
                      </div>
                    </a>
                    <a
                      className={`flex items-center text-lg p-5 rounded transition duration-300 ease-in-out mb-3 ${
                        tab !== 2 ? 'bg-gray-400  ' : 'bg-gray-200'
                      }`}
                      href="#0"
                      onClick={(e) => {
                        e.preventDefault();
                        setTab(2);
                      }}
                    >
                      <div>
                        <div className="text-secondary font-bold leading-snug tracking-tight mb-1">
                          Run your own instance of IQEngine to share recordings privately within your company or
                          organization
                        </div>
                        <div className="text-black">
                          IQEngine's Admin Page lets you manage users, access to recordings/plugins, and deployment
                          configuration
                          <div className="pb-2"></div>
                          RF recordings are stored in the cloud using blob storage, allowing for easy security and data
                          redundancy
                        </div>
                      </div>
                    </a>
                    <a
                      className={`flex items-center text-lg p-5 rounded transition duration-300 ease-in-out mb-3 ${
                        tab !== 3 ? 'bg-gray-400  ' : 'bg-gray-200'
                      }`}
                      href="#0"
                      onClick={(e) => {
                        e.preventDefault();
                        setTab(3);
                      }}
                    >
                      <div>
                        <div className="text-secondary font-bold leading-snug tracking-tight mb-1">
                          An education-oriented, RF DSP playground
                        </div>
                        <div className="text-black">
                          The Signal Generator (Siggen) page lets you play around with Python-based DSP, all in the
                          browser
                          <div className="pb-2"></div>
                          Try out the example transmitters, and download SigMF recordings of the signals you generate
                        </div>
                      </div>
                    </a>
                  </div>
                </div>

                {/* Tabs items */}
                <div
                  className="max-w-xl md:max-w-none md:w-full mx-auto md:col-span-5 lg:col-span-6 mb-8 md:mb-0 md:order-1"
                  data-aos="zoom-y-out"
                  ref={tabs}
                >
                  <div className="relative flex flex-col text-center lg:text-right">
                    {/* Item 1 */}
                    <Transition
                      show={tab === 1}
                      appear={true}
                      className="w-full"
                      enter="transition ease-in-out duration-700 transform order-first"
                      enterStart="opacity-0 translate-y-16"
                      enterEnd="opacity-100 translate-y-0"
                      leave="transition ease-in-out duration-300 transform absolute"
                      leaveStart="opacity-100 translate-y-0"
                      leaveEnd="opacity-0 -translate-y-16"
                    >
                      <div className="relative inline-flex flex-col">
                        <img
                          className="md:max-w-none mx-auto rounded"
                          src="./fm_detector_example.png"
                          width="600"
                          alt="Features bg"
                        />
                      </div>
                    </Transition>
                    {/* Item 2 */}
                    <Transition
                      show={tab === 2}
                      appear={true}
                      className="w-full"
                      enter="transition ease-in-out duration-700 transform order-first"
                      enterStart="opacity-0 translate-y-16"
                      enterEnd="opacity-100 translate-y-0"
                      leave="transition ease-in-out duration-300 transform absolute"
                      leaveStart="opacity-100 translate-y-0"
                      leaveEnd="opacity-0 -translate-y-16"
                    >
                      <div className="relative inline-flex flex-col">
                        <img
                          className="md:max-w-none mx-auto rounded"
                          src="./admin-page-animated.gif"
                          width="700"
                          alt="Features bg"
                        />
                      </div>
                    </Transition>
                    {/* Item 3 */}
                    <Transition
                      show={tab === 3}
                      appear={true}
                      className="w-full"
                      enter="transition ease-in-out duration-700 transform order-first"
                      enterStart="opacity-0 translate-y-16"
                      enterEnd="opacity-100 translate-y-0"
                      leave="transition ease-in-out duration-300 transform absolute"
                      leaveStart="opacity-100 translate-y-0"
                      leaveEnd="opacity-0 -translate-y-16"
                    >
                      <div className="relative inline-flex flex-col">
                        <img
                          className="md:max-w-none mx-auto rounded"
                          src="./siggen_screenshot.png"
                          width="700"
                          alt="Features bg"
                        />
                      </div>
                    </Transition>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute left-0 right-0 bottom-0 m-auto w-px p-px h-20 bg-gray-200 transform translate-y-1/2"></div>
        </section>

        <section className="relative">
          {/* Section background (needs .relative class on parent and next sibling elements) */}
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-10">
            <div className="">
              <h1 className="text-center p-4">Great For...</h1>
              <div className="columns-2 pl-64 pr-48 pb-4">
                <ul className="text-lg mt-0">
                  <li className="list-group-item">RFML</li>
                  <li className="list-group-item">Wireless CTFs</li>
                  <li className="list-group-item">SIGINT</li>
                </ul>
                <ul className="text-lg mt-0">
                  <li className="list-group-item">Spectrum Awareness</li>
                  <li className="list-group-item">Debugging</li>
                  <li className="list-group-item">SDR/DSP/Wireless Students</li>
                </ul>
              </div>
            </div>

            <h1 className="text-center">Example Use-Cases</h1>
            <div className="columns-2 pl-32 pr-24 pb-4">
              <ul className="text-lg mt-0">
                <li className="list-group-item">Analyze one RF recording</li>
                <li className="list-group-item">Organize and query millions of RF recordings</li>
                <li className="list-group-item">
                  Evaluate signal detection/classification algorithms on a variety of recordings
                </li>
              </ul>
              <ul className="text-lg mt-0">
                <li className="list-group-item">
                  Share your RF recordings or non-realtime RF functions with the world
                </li>
                <li className="list-group-item">Learn DSP basics (e.g., FFTs, filtering, wavelets)</li>
                <li className="list-group-item">
                  Share RF recordings/datasets within your team or organization using a local instance of IQEngine
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="relative">
          <div className="absolute inset-0 bg-secondary pointer-events-none" aria-hidden="true"></div>
          <div className="absolute left-0 right-0 m-auto w-px p-px h-20 bg-gray-200 transform -translate-y-1/2"></div>
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-14">
            <h1 className="text-center mx-4 mb-0 text-base-100 font-bold">
              IQEngine is a community effort, always seeking volunteers!
            </h1>
            <h1 className="text-center mx-4 my-0 text-base-100 font-bold">Ways to get Involved:</h1>

            <ul className="list-disc text-lg m-4 pl-64">
              <li>
                Join the{' '}
                <a href="https://discord.gg/k7C8kp3b76" target="_blank">
                  IQEngine Discord
                </a>
              </li>
              <li>Contribute recordings</li>
              <li>Contribute plugins</li>
              <li>Post GitHub Issues/PRs</li>
              <li>Email questions/comments about IQEngine to iqengine@vt.edu</li>
            </ul>

            <h1 className="text-center text-base-100">Origin</h1>
            <p className="text-lg px-24 pb-4">
              The idea for a web-based spectrogram tool started while Marc was teaching an SDR course at UMD, with
              students who had varying OS's; some ran into trouble installing existing SDR desktop apps. By removing the
              software installation barrier, SDR/DSP tooling, and education, could be made more accessible. Next came
              several ideas for SigMF-centric features beyond what existing software provided, such as the ability to
              organize hundreds of recordings or visually edit annotations.
              <br></br>
              <br></br>
              Implementation of IQEngine began during a 1-week internal hackathon at Microsoft, where Marc and SDR
              coworkers Luke, Craig, Johanna, Ani, Marko, and Tensae built a proof-of-concept prototype. It was open
              sourced and <a href="https://youtu.be/hZy0lIsBlkg">shown off at GNU Radio Conference '22</a>. The first
              full version was completed in January '23 with help from a group of undergraduate "sprinterns" at
              Microsoft, consisting of students from UMD and GMU that were part of the{' '}
              <a href="https://www.breakthroughtech.org/" target="_blank">
                Break Through Tech
              </a>{' '}
              program. In February '23 it was transitioned from an open source Microsoft project to a community-led FOSS
              project, entirely separate from Microsoft, with representation from several organizations and individuals.
            </p>

            <center>
              <img className="w-1/4" alt="sprintern" src="./sprinterns.jpeg"></img>
              <p className="text-lg pt-1">Winter '23 Sprinterns from UMD and GMU</p>
            </center>
          </div>
        </section>

        <div className="absolute left-0 right-0 m-auto w-px p-px h-20 bg-gray-200 transform -translate-y-1/2"></div>

        {/* Browse button repeated at bottom */}
        <div
          className="pt-20 pb-6 max-w-xs mx-auto sm:max-w-none sm:flex sm:justify-center"
          data-aos="zoom-y-out"
          data-aos-delay="300"
        >
          <button id="browse-button" className="text-3xl py-2 px-4 bg-accent hover:bg-primary" onClick={handleOnClick}>
            &#128270; Start Browsing
          </button>
        </div>
      </main>
    </>
  );
};

export default LandingPage;
