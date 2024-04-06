// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFeatureFlags } from '@/hooks/use-feature-flags';
import Transition from './transition';
import Browser from '../browser/browser';
import ReactWordcloud from 'react-wordcloud';

const wordcloud = [
  {
    text: 'DSP',
    value: 10,
  },
  {
    text: 'Filtering',
    value: 5,
  },
  {
    text: 'FFTs',
    value: 5,
  },
  {
    text: 'RX',
    value: 5,
  },
  {
    text: 'TX',
    value: 5,
  },
  {
    text: 'RF',
    value: 10,
  },
  {
    text: 'Wireless',
    value: 10,
  },
  {
    text: 'SDR',
    value: 9,
  },
  {
    text: '5G',
    value: 5,
  },
  {
    text: 'RFML',
    value: 10,
  },
  {
    text: 'Comms',
    value: 10,
  },
  {
    text: 'Radar',
    value: 6,
  },
  {
    text: 'Detection',
    value: 8,
  },
  {
    text: 'Satellites',
    value: 7,
  },
  {
    text: 'Education',
    value: 7,
  },
];

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
                  Bringing the{' '}
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-200">
                    RF signal processing
                  </span>{' '}
                  community together
                </h1>
                {/*<hr className="border-secondary border-2 rounded w-16 mx-auto mt-6 mb-0" />*/}
                <div className="mx-auto w-128 h-24">
                  <ReactWordcloud
                    words={wordcloud}
                    options={{
                      colors: ['#4CE091', '#136f63', '#84cae7', '#a9a9aa', '#2a8583'],
                      enableTooltip: true,
                      deterministic: true,
                      fontFamily: 'impact',
                      fontSizes: [15, 25],
                      fontStyle: 'normal',
                      fontWeight: 'normal',
                      padding: 2,
                      rotations: 20,
                      rotationAngles: [-45, 45], // min to max
                      scale: 'sqrt',
                      spiral: 'archimedean',
                      transitionDuration: 1000,
                    }}
                  />
                </div>
                <h2 className="font-bold text-xl text-primary">
                  The IQEngine community is working on the following projects:
                </h2>
                <div className="grid gap-2 text-xl text-primary pb-4">
                  <ul className="list-decimal text-left">
                    <li>
                      <a className="underline font-bold" href="https://github.com/iqengine/iqengine" target="_blank">
                        IQEngine
                      </a>{' '}
                      - A web-based tool for analyzing, processing, and sharing RF recordings{' '}
                      <button
                        id="browse-button"
                        className="text-regular mx-2 py-0 px-2 bg-accent hover:bg-primary"
                        onClick={handleOnClick}
                      >
                        &#128270; Start Browsing
                      </button>
                    </li>
                    <li>
                      <a className="underline font-bold" href="https://www.iqengine.org/" target="_blank">
                        IQEngine.org
                      </a>{' '}
                      - The public instance of IQEngine, with public recordings
                    </li>
                    <li>
                      <a className="underline font-bold" href="http://localhost:3000/docs/plugins" target="_blank">
                        Plugins API
                      </a>{' '}
                      - A REST-based API for RF signal processing, used within IQEngine and by others
                    </li>
                    <li>
                      Index of open source software, free online learning resources, and University programs (expand
                      sections below)
                    </li>
                  </ul>
                </div>

                {/* Online learning */}
                <details>
                  <summary className="pl-2 mx-16 my-2 bg-primary outline outline-1 outline-primary text-lg text-base-100 hover:bg-green-800">
                    Online learning resources for RF signal processing
                  </summary>
                  <div className="outline outline-1 outline-primary p-6 mx-16">
                    <ul className="list-decimal text-left">
                      <li>
                        <a href="https://pysdr.org/" target="_blank">
                          PySDR
                        </a>{' '}
                        - An intro to RF DSP and SDR using many diagrams, animations, and Python examples, light on
                        math.
                      </li>
                      <li>
                        <a href="https://www.dspguide.com/" target="_blank">
                          dspguide.com
                        </a>{' '}
                        aka The Scientist and Engineer's Guide to Digital Signal Processing By Steven W. Smith - Not
                        specific to RF but an excellent primer into DSP techniques.
                      </li>
                      <li>
                        <a href="https://wiki.gnuradio.org/index.php/Tutorials" target="_blank">
                          GNU Radio Tutorials
                        </a>{' '}
                        - A lot of the GNU Radio tutorials are really just introductions to DSP concepts, using GNU
                        Radio examples to play with the concepts (e.g., FFTs, filtering, resampling, frequency shifts).
                      </li>
                      <li>
                        <a href="https://dsprelated.com/tutorials.php" target="_blank">
                          DSP Related tutorials and blog posts
                        </a>{' '}
                        - Big mix of stuff, likely also found through Google searches on a specific topic.
                      </li>
                      <li>
                        <a href="https://www.youtube.com/watch?v=spUNpyF58BY" target="_blank">
                          3Blue1Brown's YouTube Videos
                        </a>{' '}
                        - Mostly not RF related but some of the best graphical intros to FFTs, convolution, channel
                        coding.
                      </li>
                      <li>
                        <a href="https://dspillustrations.com/pages/index.html" target="_blank">
                          DSP Illustrated
                        </a>{' '}
                        - A series of blog style posts on RF signal processing topics, full of diagrams, animations, and
                        Python examples.
                      </li>
                      <li>
                        <a href="https://www.wavewalkerdsp.com/" target="_blank">
                          Wave Walker DSP
                        </a>{' '}
                        - Blog style posts on DSP algorithms for RF systems.
                      </li>
                    </ul>
                  </div>
                </details>

                {/* FOSS Software */}
                <details>
                  <summary className="pl-2 mx-16 my-2 bg-primary outline outline-1 outline-primary text-lg text-base-100 hover:bg-green-800">
                    Open-source software for RF signal processing
                  </summary>
                  <div className="outline outline-1 outline-primary p-6 mx-16">
                    This list includes software representing applications or frameworks for either realtime (using an
                    SDR) or offline RF signal processing/visualization/generation. General purpose receivers (e.g.,
                    GQRX, SDR#, SDR++, SigDigger, ShinySDR), pure libraries (e.g., liquid-dsp, SoapySDR), and
                    RF/SDR-focused operating systems (e.g., Dragon OS) are not included in order to limit scope.
                    <ul className="list-decimal text-left">
                      <li>
                        <a href="https://www.gnuradio.org/" target="_blank">
                          GNU Radio
                        </a>{' '}
                        - A software development toolkit that provides signal processing blocks to implement software
                        radios. It can be used with readily-available low-cost external RF hardware to create
                        software-defined radios, or without hardware in a simulation-like environment. GNU Radio is an
                        entire ecosystem as there exist many 3rd party modules and corresponding applications to go with
                        them.
                      </li>
                      <li>
                        <a href="https://github.com/SatDump/SatDump" target="_blank">
                          SatDump
                        </a>{' '}
                        - Satellite signal and data processing software (both PHY layer and up), can also be used to
                        operate a DIY satellite ground station. Supports dozens of different satellite signals.
                      </li>
                      <li>
                        <a href="https://github.com/srsran/srsRAN_Project" target="_blank">
                          srsRAN
                        </a>{' '}
                        - Software stack for 5G and LTE, both the base station and user equipment (UE), can be used with
                        a variety of SDRs.
                      </li>
                      <li>
                        <a href="https://github.com/miek/inspectrum" target="_blank">
                          Inspectrum
                        </a>{' '}
                        - A tool for analysing captured signals.
                      </li>
                      <li>
                        <a href="https://github.com/MalcolmRobb/dump1090" target="_blank">
                          Dump1090
                        </a>{' '}
                        - Mode S aircraft ADS-B decoder specifically designed for RTLSDR devices.
                      </li>
                      <li>
                        <a href="https://github.com/robotastic/trunk-recorder" target="_blank">
                          Trunk Recorder
                        </a>{' '}
                        - Trunk Recorder is able to record the calls on trunked and conventional radio systems (e.g.,
                        P25).
                      </li>
                    </ul>
                  </div>
                </details>

                {/* Universities */}
                <details>
                  <summary className="pl-2 mx-16 my-2 bg-primary outline outline-1 outline-primary text-lg text-base-100 hover:bg-green-800">
                    Universities with emphasis on RF signal processing
                  </summary>
                  <div className="outline outline-1 outline-primary p-6 mx-16">
                    The following lists universities with strong graduate programs in RF signal processing, along with
                    related courses that are taught at least once per year. To add to this list, post in the{' '}
                    <a href="https://discord.gg/k7C8kp3b76" target="_blank">
                      IQEngine Discord
                    </a>{' '}
                    or put in a PR .
                    <ul className="list-decimal text-left">
                      <li>
                        Virginia Tech
                        <ul className="text-left">
                          <li>ECE-3614 Intro Comm Systems</li>
                          <li>ECE-4624 DSP & Filter Design</li>
                          <li>ECE-4634 Digital Communications (+ Lab)</li>
                          <li>ECE-4644 Satellite Communications</li>
                          <li>ECE-5620 Advanced DSP and Filter Design</li>
                          <li>ECE-5654 Dig Comm Adv Theory & Analy</li>
                          <li>ECE-5660 Spread Spectrum Communications</li>
                          <li>ECE-5664 Cellular Communication Systems</li>
                          <li>ECE-5674 Software Radios</li>
                          <li>ECE-6634 Multi-Channel Communications (MIMO + OFDM)</li>
                        </ul>
                      </li>
                      <li>
                        Northeastern
                        <ul className="text-left">
                          <li>EECE 5576 Wireless Communication Systems</li>
                          <li>EECE 5666 Digital Signal Processing</li>
                          <li>EECE 5155 Wireless Sensor Networks and the Internet of Things</li>
                          <li>EECE 7364 Mobile and Wireless Networking</li>
                          <li>EECE 7374 Fundamentals of Computer Networks</li>
                          <li>EECE 7336 Digital Communications</li>
                        </ul>
                      </li>
                      <li>
                        NYU
                        <ul className="text-left">
                          <li>ECE-GY 6023 Wireless Communications</li>
                          <li>ECE-GY 6113 Digital Signal Processing I (+ Lab)</li>
                          <li>ECE-UY 3404 Fundamentals of Communication Theory</li>
                          <li>ECE-UY 4283 Wireless Information Systems Laboratory II</li>
                        </ul>
                      </li>
                      <li>
                        Colorado Boulder
                        <ul className="text-left">
                          <li>ECEN 4532 Digital Signal Processing Laboratory</li>
                          <li>ECEN 5692 Principles of Digital Communication</li>
                          <li>ECEN 4632 Introduction to Digital Filtering</li>
                          <li>ECEN 4634 Microwave and RF Laboratory</li>
                          <li>ECEN 5632 Theory and Application of Digital Filtering</li>
                        </ul>
                      </li>
                      <li>Georgia Tech</li>
                      <li>Arizona State</li>
                      <li>
                        Johns Hopkins
                        <ul className="text-left">
                          <li>EN.520.612 Machine Learning for Signal Processing</li>
                          <li>EN.520.635 Digital Signal Processing</li>
                          <li>EN.520.646 Wavelets & Filter Banks</li>
                        </ul>
                      </li>
                      <li>UCLA</li>
                      <li>The University of Utah</li>
                    </ul>
                  </div>
                </details>

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
