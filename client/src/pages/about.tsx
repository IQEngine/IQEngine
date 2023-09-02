// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React from 'react';

export const About = () => {
  return (
    <div>

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

      </div>
    </div>
  );
};
