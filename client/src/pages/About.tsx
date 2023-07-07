// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React from 'react';

export const About = () => {
  return (
    <div>
      <div className="bg-accent bg-opacity-10">
        <h1 className="text-center p-4">Great For...</h1>
        <div className="columns-2 pl-48 pr-24 pb-4">
          <ul className="text-lg">
            <li className="list-group-item">- RFML</li>
            <li className="list-group-item">- Wireless CTFs</li>
            <li className="list-group-item">- SIGINT</li>
          </ul>
          <ul className="text-lg">
            <li className="list-group-item">- Spectrum Awareness</li>
            <li className="list-group-item">- Debugging</li>
            <li className="list-group-item">- SDR/DSP/Wireless Students</li>
          </ul>
        </div>
      </div>

      <h1 className="text-center">Example Use-Cases</h1>
      <div className="columns-2 pl-32 pr-24 pb-4">
        <ul className="text-lg">
          <li className="list-group-item">- Analyze one RF recording</li>
          <li className="list-group-item">- Organize and query millions of RF recordings</li>
          <li className="list-group-item">- Evaluate signal detection/classification algorithms on a variety of recordings</li>
        </ul>
        <ul className="text-lg">
          <li className="list-group-item">- Share your RF recordings or non-realtime RF functions with the world</li>
          <li className="list-group-item">- Learn DSP basics (e.g., FFTs, filtering, wavelets)</li>
          <li className="list-group-item">- Share RF recordings/datasets within your team or organization using a local instance of IQEngine</li>
        </ul>
      </div>

      <div className="bg-accent bg-opacity-10 pt-1" style={{ width: 'auto', paddingBottom: '15px' }}>
        <h1 className="text-center">Leadership Teams</h1>
        <div className="grid grid-cols-3 gap-4 justify-items-center px-32 py-3 text-lg">
          <div>
            <div className="leadership-card-header">Core Leadership</div>
            <div className="leadership-card-body">
              Manages the overall direction of IQEngine<br></br>
              <br></br>
              Team Lead: Marc Lichtman
            </div>
          </div>

          <div>
            <div className="leadership-card-header">Frontend – Functionality</div>
            <div className="leadership-card-body">
              The IQEngine frontend <br></br>
              <br></br>
              Team Lead: Maheen
            </div>
          </div>

          <div>
            <div className="leadership-card-header">Frontend - User Experience</div>
            <div className="leadership-card-body">
              UX design and surveying <br></br>
              <br></br>
              Team Lead: Luke/Robotastic
            </div>
          </div>

          <div>
            <div className="leadership-card-header">Backend/Plugins</div>
            <div className="leadership-card-body">
              Backend design including plugin API and implementation <br></br>
              <br></br>
              Team Lead: Eric
            </div>
          </div>

          <div>
            <div className="leadership-card-header">Education-Oriented Features</div>
            <div className="leadership-card-body">
              Making IQEngine the perfect place for students <br></br>
              <br></br>
              Team Lead: Seeking Volunteer!
            </div>
          </div>

          <div>
            <div className="leadership-card-header">RFML</div>
            <div className="leadership-card-body">
              RF Machine Learning oriented functionality <br></br>
              <br></br>
              Team Lead: Clay
            </div>
          </div>

          <div>
            <div className="leadership-card-header">Community</div>
            <div className="leadership-card-body">
              Manages the Discord and other community engagements <br></br>
              <br></br>
              Team Lead: Jumbotron
            </div>
          </div>

          <div>
            <div className="leadership-card-header">SigMF Integration</div>
            <div className="leadership-card-body">
              Expanding and verifying IQEngine's use of SigMF <br></br>
              <br></br>
              Team Lead: Marc Lichtman
            </div>
          </div>

          <div>
            <div className="leadership-card-header">Maps Interface</div>
            <div className="leadership-card-body">
              The IQEngine Maps interface (coming soon!) <br></br>
              <br></br>
              Team Lead: TBD
            </div>
          </div>
        </div>

        <p className="text-center text-lg m-4">
          IQEngine is a community effort, lead by the above individuals (and seeking more!)
        </p>

        <p className="text-center text-lg">Ways to get Involved:</p>

        <ul className="list-disc text-lg m-4 pl-32">
          <li>
            Join the{' '}
            <a href="https://discord.gg/k7C8kp3b76" target="_blank">
              IQEngine Discord
            </a>
          </li>
          <li>Post GitHub Issues/PRs</li>
          <li>Email questions/comments about IQEngine to iqengine@vt.edu</li>
        </ul>
      </div>

      <h1 className="text-center">Origin</h1>
      <p className="text-lg px-24 pb-4">
        The idea for a web-based spectrogram tool started while Marc was teaching an SDR course at UMD, with students
        who had varying OS's; some ran into trouble installing existing SDR desktop apps. By removing the software
        installation barrier, SDR/DSP tooling, and education, could be made more accessible. Next came several ideas for
        SigMF-centric features beyond what existing software provided, such as the ability to organize hundreds of
        recordings or visually edit annotations.
        <br></br>
        <br></br>
        Implementation of IQEngine began during a 1-week internal hackathon at Microsoft, where Marc and SDR coworkers 
        Luke, Craig, Johanna, Ani, Marko, and Tensae built a proof-of-concept prototype.
        It was open sourced and <a href="https://youtu.be/hZy0lIsBlkg">shown off at GNU Radio Conference '22</a>.
        The first full version was completed in January '23 with help from a group of undergraduate "sprinterns" at
        Microsoft, consisting of students from UMD and GMU that were part of the{' '}
        <a href="https://www.breakthroughtech.org/" target="_blank">
          Break Through Tech
        </a>{' '}
        program. In February '23 it was transitioned from an open source Microsoft project to a community-led FOSS
        project with representation from several organizations and individuals.
      </p>

      <center>
        <img className="w-1/2" alt="sprintern" src="./sprinterns.jpeg"></img>
        <p className="text-lg pt-1">Winter '23 Sprinterns from UMD and GMU</p>
      </center>
    </div>
  );
};
