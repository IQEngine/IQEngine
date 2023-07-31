// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React from 'react';
import SettingsPane from './settings-pane';
import { PluginsPane } from './plugins-pane';
const Sidebar = () => {
  return (
    <div className="flex flex-col w-64 ml-3">
      <details open>
        <summary className="pl-2 bg-primary outline outline-1 outline-primary text-lg text-base-100 hover:bg-green-800">
          Settings
        </summary>
        <div className="outline outline-1 outline-primary p-2">
          <SettingsPane />
        </div>
      </details>

      <details>
        <summary className="pl-2 mt-2 bg-primary outline outline-1 outline-primary text-lg text-base-100 hover:bg-green-800">
          Plugins
        </summary>
        <div className="outline outline-1 outline-primary p-2">
          <PluginsPane />
        </div>
      </details>
    </div>
  );
};

export { Sidebar };
