// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License
import React, { useEffect } from 'react';
import { useFeatureFlags } from './Components/FeatureFlagsContext/FeatureFlagsContext';
import { useLocation, Outlet } from 'react-router-dom';
import ReactGA from 'react-ga4';
import ThemeSelector from './Components/Styles/ThemeSelector';
import { configQuery } from './api/config/queries';
import { Link } from 'react-router-dom';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';

export const App = () => {
  const location = useLocation();
  const config = configQuery();
  const { setFeatureFlags } = useFeatureFlags();
  useEffect(() => {
    if (!config.data) return;

    const analytics_key = config.data.googleAnalyticsKey;
    if (analytics_key) {
      ReactGA.initialize(analytics_key);
    }
    // Set up google analytics (if enabled) to only share the page path (does not include names of local files)
    if (analytics_key) {
      window.gtag('event', 'page_view', {
        page_path: location.pathname + location.search + location.hash, // Note- we make sure to not include local file names in the urls, so they wont get sent to google analytics
        page_search: location.search,
        page_hash: location.hash,
      });
    }
    setFeatureFlags(config.data.featureFlags);
  }, [config]);

  return (
    <ThemeSelector>
      <Toaster />
      <div>
        <div className="container flex mb-40" id="topRow">
          <Link to="/" onClick={() => {}}>
            <div className="absolute mt-4 pt-2 top-0 left-1/2 transform -translate-x-1/2">
              <img src="/IQEngine.svg" alt="IQEngine" />
            </div>
          </Link>
          <div className="absolute right-0 py-2 mr-2">
            <ul className="flex-row flex mb-4 mt-0 space-x-5 text-sm font-medium">
              <li>
                <Link to="/about" onClick={() => {}}>
                  <div className="text-lg">About</div>
                </Link>
              </li>
              <li>
                <Link to="/sigmf" onClick={() => {}}>
                  <div className="text-lg">SigMF</div>
                </Link>
              </li>
              <li>
                <Link to="/plugins" onClick={() => {}}>
                  <div className="text-lg">Plugins</div>
                </Link>
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
      <ReactQueryDevtools initialIsOpen={false} />
    </ThemeSelector>
  );
};

export default App;
