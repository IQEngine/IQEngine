// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License
import React, { useEffect, useState } from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import ReactGA from 'react-ga4';
import ThemeSelector from './Components/Styles/ThemeSelector';
import { configQuery } from './api/config/queries';
import { Link } from 'react-router-dom';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import Feature from '@/Components/Feature/Feature';
import { Logo } from '@/Components/Logo/Logo';
import { FeatureFlag, useFeatureFlags } from '@/hooks/useFeatureFlags';

export const App = () => {
  const [width, setWidth] = useState(window.innerWidth);
  const breakpoint = 700;

  const location = useLocation();
  const config = configQuery();
  const { setFeatureFlags } = useFeatureFlags();

  useEffect(() => {
    const handleResizeWindow = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResizeWindow);
    return () => {
      window.removeEventListener('resize', handleResizeWindow);
    };
  }, []);

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
        <div className="container flex mb-16 sm:navbar mb-10 bg-base-100" id="topRow">
          <div className="md:hidden navbar-start">
            <div className="md:hidden dropdown">
              <label tabIndex={0} className="md:hidden btn btn-ghost btn-circle">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
                </svg>
              </label>
              <ul
                tabIndex={0}
                className="md:hidden menu menu-sm dropdown-content mt-3 p-2 shadow bg-base-100 rounded-box w-52"
              >
                <li>
                  <Link to="/" onClick={() => {}}>
                    Home
                  </Link>
                </li>
                <li>
                  <Link to="/about" onClick={() => {}}>
                    About
                  </Link>
                </li>
                <li>
                  <Link to="/sigmf" onClick={() => {}}>
                    SigMF
                  </Link>
                </li>
                <li>
                  <Link to="/plugins" onClick={() => {}}>
                    Plugins
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <Link to="/" onClick={() => {}}>
            <div id="IQEngineLogo" className="absolute mt-4 pt-2 top-0 left-1/2 transform -translate-x-1/2 flex">
              <Feature flag={FeatureFlag.displayInternalBranding}>
                <img
                  src="/internalbrandingeg.jpg"
                  alt="Internal branding logo"
                  className="md:w-32 md:h-32 mr-8 sm:w-20 sm:h-20"
                />
              </Feature>
              <Logo />
            </div>
          </Link>
          <div className="absolute right-0 py-2 mr-2 ">
            <ul className="flex-row flex mb-4 mt-0 space-x-5 text-sm font-medium">
              <li className="hidden md:block">
                <Link to="/about" onClick={() => {}}>
                  <div className="text-lg">About</div>
                </Link>
              </li>
              <li className="hidden md:block">
                <Link to="/sigmf" onClick={() => {}}>
                  <div className="text-lg">SigMF</div>
                </Link>
              </li>
              <li className="hidden md:block">
                <Link to="/plugins" onClick={() => {}}>
                  <div className="text-lg">Plugins</div>
                </Link>
              </li>
              <Feature flag={FeatureFlag.useIQEngineOutReach}>
                <li className="hidden md:block">
                  <a href="https://discord.gg/k7C8kp3b76" target="_blank" rel="noreferrer" className="text-lg">
                    <div className="flex">
                      <img src="/discord.svg" className="w-6 pr-1" alt="Discord" />
                      Discord
                    </div>
                  </a>
                </li>
                <a
                  href="https://discord.gg/k7C8kp3b76"
                  rel="noreferrer"
                  target="_blank"
                  className="md:hidden btn btn-ghost btn-circle"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    className="bi bi-discord"
                    viewBox="0 0 16 16"
                  >
                    {' '}
                    <path d="M13.545 2.907a13.227 13.227 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.19 12.19 0 0 0-3.658 0 8.258 8.258 0 0 0-.412-.833.051.051 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.041.041 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032c.001.014.01.028.021.037a13.276 13.276 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019c.308-.42.582-.863.818-1.329a.05.05 0 0 0-.01-.059.051.051 0 0 0-.018-.011 8.875 8.875 0 0 1-1.248-.595.05.05 0 0 1-.02-.066.051.051 0 0 1 .015-.019c.084-.063.168-.129.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.052.052 0 0 1 .053.007c.08.066.164.132.248.195a.051.051 0 0 1-.004.085 8.254 8.254 0 0 1-1.249.594.05.05 0 0 0-.03.03.052.052 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.235 13.235 0 0 0 4.001-2.02.049.049 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.034.034 0 0 0-.02-.019Zm-8.198 7.307c-.789 0-1.438-.724-1.438-1.612 0-.889.637-1.613 1.438-1.613.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612Zm5.316 0c-.788 0-1.438-.724-1.438-1.612 0-.889.637-1.613 1.438-1.613.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612Z" />{' '}
                  </svg>
                </a>
              </Feature>
              <Feature flag={FeatureFlag.displayIQEngineGitHub}>
                <li className="hidden md:block">
                  <a href="https://github.com/iqengine/iqengine" target="_blank" rel="noreferrer" className="text-lg ">
                    <div className="flex">
                      <img src="/github.svg" className="w-6 h-6 pr-1 pt-1" alt="GitHub" />
                      GitHub
                    </div>
                  </a>
                </li>
                <a
                  href="https://github.com/iqengine/iqengine"
                  rel="noreferrer"
                  target="_blank"
                  className="md:hidden btn btn-ghost btn-circle"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    className="bi bi-github"
                    viewBox="0 0 16 16"
                  >
                    {' '}
                    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z" />{' '}
                  </svg>
                </a>
              </Feature>
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
          <Feature flag={FeatureFlag.useIQEngineOutReach}>
            <h2 className="text-center py-2">
              Sign up for a once-a-month email update on IQEngine, such as new features, demos, and more!
            </h2>
          </Feature>
        </a>
      </div>
      <ReactQueryDevtools initialIsOpen={false} />
    </ThemeSelector>
  );
};

export default App;
