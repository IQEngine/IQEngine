// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License
import React, { useEffect } from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import ReactGA from 'react-ga4';
import ThemeSelector from './Components/Styles/ThemeSelector';

// If env var is set, initialize google analytics
if (import.meta.env.VITE_GOOGLE_ANALYTICS_KEY) {
  ReactGA.initialize(import.meta.env.VITE_GOOGLE_ANALYTICS_KEY);
}

export const App = () => {
  // Set up google analytics (if enabled) to only share the page path (does not include names of local files)
  const location = useLocation();
  useEffect(() => {
    if (process.env.VITE_GOOGLE_ANALYTICS_KEY) {
      window.gtag('event', 'page_view', {
        page_path: location.pathname + location.search + location.hash, // Note- we make sure to not include local file names in the urls, so they wont get sent to google analytics
        page_search: location.search,
        page_hash: location.hash,
      });
    }
  }, [location]);

  return (
    <ThemeSelector>
      <div>
        <div className="container flex mb-40" id="topRow">
          <a href="/" className="absolute mt-4 pt-2 top-0 left-1/2 transform -translate-x-1/2">
            <img src="/IQEngine.svg" alt="IQEngine" />
          </a>

          <div className="absolute right-0 py-2 mr-2">
            <ul className="flex-row flex mb-4 mt-0 space-x-5 text-sm font-medium">
              <li>
                <a href="/about" className="text-lg ">
                  About
                </a>
              </li>
              <li>
                <a href="/sigmf" className="text-lg">
                  SigMF
                </a>
              </li>
              <li>
                <a href="/plugins" className="text-lg ">
                  Plugins
                </a>
              </li>
              <li>
                <a href="https://discord.gg/k7C8kp3b76" target="_blank" rel="noreferrer" className="text-lg">
                  <div className="flex">
                    <img src="/discord.svg" className="w-6 pr-1" alt="Discord" />
                    Discord
                  </div>
                </a>
              </li>
              <li>
                <a href="https://github.com/iqengine/iqengine" target="_blank" rel="noreferrer" className="text-lg ">
                  <div className="flex">
                    <img src="/github.svg" className="w-6 h-6 pr-1 pt-1" alt="GitHub" />
                    GitHub
                  </div>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <Outlet />

        {/* TODO Figure out how to use mailerlites embedded form*/}
        <a
          target="_blank"
          rel="noreferrer"
          href="https://dashboard.mailerlite.com/forms/299501/77960409531811734/share"
        >
          <h2 className="text-center py-2">
            Sign up for a once-a-month email update on IQEngine, such as new features, demos, and more!
          </h2>
        </a>
      </div>
    </ThemeSelector>
  );
};

export default App;
