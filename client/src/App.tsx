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
import Feature from '@/Components/Feature/Feature';
import { colMaps } from '@/Utils/colormap';

export const App = () => {
  const [width, setWidth] = React.useState(window.innerWidth);
  const breakpoint = 700;
  const cMap = colMaps['viridis'];

  const location = useLocation();
  const config = configQuery();
  const { setFeatureFlags } = useFeatureFlags();

  React.useEffect(() => {
    const handleResizeWindow = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResizeWindow);
    return () => {
      window.removeEventListener('resize', handleResizeWindow);
    };
  }, []);

  function updateLogoCurve() {
    // starting point of curve wrt SVG canvas
    const x0 = 29.5;
    const y0 = 92.5;
    let sinCurve = document.getElementById('logo-sin-curve');
    let cosCurve = document.getElementById('logo-cos-curve');
    let sinString = 'M ' + x0 + ',' + y0;
    let cosString = 'M ' + x0 + ',' + y0;
    const t = new Date().getTime();
    if (Math.random() > 0.95) {
      for (let i = 0; i < 100; i++) {
        sinString += ' L ' + (x0 + i) + ',' + (y0 + Math.random() * 3 - 1.5);
        cosString += ' L ' + (x0 + i) + ',' + (y0 + Math.random() * 3 - 1.5);
      }
    } else {
      for (let i = 0; i < 100; i++) {
        sinString += ' L ' + (x0 + i) + ',' + (y0 + Math.random() * 0.3 - 0.15);
        cosString += ' L ' + (x0 + i) + ',' + (y0 + Math.random() * 0.3 - 0.15);
      }
    }
    sinCurve.setAttribute('d', sinString);
    cosCurve.setAttribute('d', cosString);
  }

  useEffect(() => {
    const timerId = setInterval(updateLogoCurve, 100); // in ms
    return function cleanup() {
      clearInterval(timerId);
    };
  }, []);

  function Gradient() {
    const stops = [];
    for (let i = 0; i < 256; i++) {
      const rgbString = 'rgb(' + cMap[i][0] + ',' + cMap[i][1] + ',' + cMap[i][2] + ')';
      const offset = String(((i / 255) * 100).toFixed(0)) + '%';
      stops.push({ offset: offset, stopColor: rgbString });
    }

    return (
      <linearGradient id="solids">
        {stops.map((v, index) => (
          <stop offset={v.offset} stopColor={v.stopColor} stopOpacity="1" key={index} />
        ))}
      </linearGradient>
    );
  }
  function Logo() {
    return (
      <svg width="400" height="100" viewBox="70 68 20 27">
        <defs>
          <Gradient />
        </defs>
        <g>
          <path id="logo-sin-curve" stroke="url(#solids)" strokeWidth="0.5" fill="none" />
          <path id="logo-cos-curve" stroke="url(#solids)" strokeWidth="0.5" fill="none" />
        </g>
        <g aria-label="IQEngine" fill="#AFAFAF">
          <path d="M 33.526375,72.431076 V 89.360275 H 29.570028 V 72.431076 Z" />
          <path d="m 50.108309,92.696506 q -0.719336,0.16123 -1.413867,0.16123 -2.269629,0 -3.038574,-0.979785 -0.768946,-0.967383 -0.892969,-2.443262 -0.95498,0.111621 -1.599902,0.111621 -3.212207,0 -5.134571,-2.505273 -1.909961,-2.517676 -1.909961,-6.151562 0,-3.547071 1.84795,-6.126758 1.847949,-2.59209 5.444629,-2.59209 3.54707,0 5.407421,2.579688 1.860352,2.567285 1.860352,6.176367 0,2.902148 -1.066602,4.836914 -1.054199,1.922363 -2.492871,2.75332 0,1.302246 1.488281,1.302246 0.434082,0 1.500684,-0.124023 z M 43.398641,75.407639 q -3.12539,0 -3.12539,5.481836 0,5.50664 3.112988,5.50664 3.150195,0 3.150195,-5.432226 0,-5.55625 -3.137793,-5.55625 z" />
          <path d="m 65.363191,75.655686 h -8.073926 v 3.472656 h 6.35 v 3.187402 h -6.35 v 3.695899 h 8.073926 v 3.348632 H 53.258504 V 72.431076 h 12.104687 z" />
          <path d="m 78.460065,89.360275 h -3.695899 v -7.032129 q 0,-1.277441 -0.09922,-1.74873 -0.09922,-0.471289 -0.483691,-0.79375 -0.384473,-0.334863 -0.967383,-0.334863 -1.947168,0 -1.947168,2.877343 v 7.032129 H 67.570807 V 76.833908 h 3.435449 v 2.120801 q 0.855762,-1.513086 1.686719,-1.947168 0.830957,-0.434082 1.79834,-0.434082 1.785937,0 2.877343,0.967383 1.091407,0.95498 1.091407,3.770312 z" />
          <path d="m 94.025007,77.119162 q -0.582911,-0.124023 -0.979785,-0.124023 -1.227833,0 -1.438672,1.091406 1.004589,1.054199 1.004589,2.38125 0,1.773535 -1.488281,2.827734 -1.475879,1.054199 -4.266406,1.054199 -0.992187,0 -1.934766,-0.186035 -0.632519,0.372071 -0.632519,0.954981 0,0.644922 0.533301,0.855761 0.5333,0.21084 2.567285,0.310059 2.889746,0.148828 3.981152,0.359668 1.091406,0.21084 1.835547,1.016992 0.744141,0.806153 0.744141,2.00918 0,1.723926 -1.599903,2.914551 -1.5875,1.190625 -5.643066,1.190625 -3.80752,0 -5.13457,-0.830957 -1.327051,-0.818555 -1.327051,-2.083594 0,-1.674317 2.145605,-2.257227 -1.5875,-0.79375 -1.5875,-2.232422 0,-1.798339 2.505274,-2.802929 -2.22002,-0.917774 -2.22002,-3.063379 0,-1.74873 1.525489,-2.840137 1.53789,-1.091406 4.241601,-1.091406 1.711523,0 3.311426,0.545703 0.111621,-1.066601 0.620117,-1.74873 0.520898,-0.694532 2.195215,-0.694532 0.545703,0 1.041797,0.09922 z m -7.19336,1.451074 q -0.95498,0 -1.500683,0.520899 -0.533301,0.508496 -0.533301,1.351855 0,1.909961 2.046387,1.909961 0.992187,0 1.550293,-0.558105 0.570507,-0.558106 0.570507,-1.351856 0,-0.74414 -0.5333,-1.302246 -0.533301,-0.570508 -1.599903,-0.570508 z m -2.468066,10.703223 q -0.223242,0 -0.570508,0.297656 -0.334863,0.297656 -0.334863,0.719336 0,0.843359 1.079004,1.054199 1.079004,0.21084 2.530078,0.21084 1.897558,0 2.654101,-0.285254 0.768946,-0.285254 0.768946,-0.917773 0,-0.483692 -0.644922,-0.744141 -0.63252,-0.260449 -3.398242,-0.260449 l -0.744141,0.0124 q -0.682129,0 -0.917773,-0.03721 -0.26045,-0.04961 -0.42168,-0.04961 z" />
          <path d="M 99.258797,76.833908 V 89.360275 H 95.562899 V 76.833908 Z" />
          <path d="m 113.18663,89.360275 h -3.6959 v -7.032129 q 0,-1.277441 -0.0992,-1.74873 -0.0992,-0.471289 -0.48369,-0.79375 -0.38447,-0.334863 -0.96738,-0.334863 -1.94717,0 -1.94717,2.877343 v 7.032129 h -3.6959 V 76.833908 h 3.43545 v 2.120801 q 0.85576,-1.513086 1.68672,-1.947168 0.83096,-0.434082 1.79834,-0.434082 1.78594,0 2.87734,0.967383 1.09141,0.95498 1.09141,3.770312 z" />
          <path d="m 127.48653,83.717209 h -8.06152 c -0.008,0.223242 -0.0124,0.417545 -0.0124,0.58291 0,0.892969 0.23565,1.566829 0.70694,2.021582 0.47955,0.454753 1.05006,0.682129 1.71152,0.682129 1.23197,0 1.97197,-0.657324 2.22002,-1.971973 l 3.43262,0.0026 -0.084,0.245439 c -0.93431,2.89388 -2.83186,4.34082 -5.69267,4.34082 -1.24851,0 -2.31097,-0.248047 -3.1874,-0.74414 -0.86817,-0.504362 -1.5875,-1.2361 -2.15801,-2.195215 -0.56224,-0.959115 -0.84336,-2.108398 -0.84336,-3.447851 0,-1.992643 0.56637,-3.600814 1.69912,-4.824512 1.14101,-1.223698 2.60449,-1.835547 4.39043,-1.835547 1.61231,0 2.9931,0.570508 4.14238,1.711523 1.15755,1.132748 1.73633,2.94349 1.73633,5.432227 z m -8.07393,-2.145605 h 4.45245 c -0.11576,-1.719792 -0.82269,-2.579688 -2.1208,-2.579688 -1.38907,0 -2.16628,0.859896 -2.33165,2.579688 z" />
          <path d="m 97.42186,72.009139 c -0.01757,5.5e-5 -0.03498,5.72e-4 -0.05271,10e-4 -0.56732,0.01473 -1.051743,0.22634 -1.453142,0.634586 -0.401398,0.408246 -0.598344,0.899251 -0.590145,1.473295 0.0082,0.574007 0.21656,1.061598 0.624769,1.46296 0.386911,0.380422 0.853953,0.575577 1.400948,0.584977 l 0.553454,-0.05788 c 0.365688,-0.08724 0.688211,-0.272621 0.967383,-0.556556 0.408011,-0.414971 0.607647,-0.909696 0.599447,-1.48363 -0.0082,-0.574081 -0.22142,-1.066629 -0.639755,-1.477946 -0.395487,-0.388855 -0.865441,-0.582553 -1.410249,-0.580843 z m -0.02274,0.976168 a 1.1025438,1.1025438 0 0 1 1.102258,1.102258 1.1025438,1.1025438 0 0 1 -1.102258,1.102775 1.1025438,1.1025438 0 0 1 -1.102775,-1.102775 1.1025438,1.1025438 0 0 1 1.102775,-1.102258 z" />
          <path d="m 96.852221,69.418145 c 1.312647,-0.375528 2.879149,0.01978 4.027479,1.148848 1.14459,1.125392 1.56729,2.678565 1.22025,3.994618 l 1.1737,-0.02493 c 0.31138,-1.627338 -0.2313,-3.453548 -1.58895,-4.788421 -1.3674,-1.344462 -3.219253,-1.853891 -4.849676,-1.500241 z" />
          <path d="M 100.27282,71.170102 C 99.272639,70.1867 97.942617,69.809031 96.855164,70.090279 l 0.01714,1.167352 c 0.752068,-0.308611 1.799914,-0.03738 2.588682,0.738155 0.796644,0.78329 1.083334,1.839496 0.772724,2.598396 l 1.17655,-0.025 c 0.26288,-1.092129 -0.13719,-2.41561 -1.13744,-3.399085 z" />
        </g>
      </svg>
    );
  }

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
        <div className="container flex mb-24 sm:navbar mb-10 bg-base-100" id="topRow">
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
            <div className="absolute mt-4 pt-2 top-0 left-1/2 transform -translate-x-1/2">
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
              <Feature flag="useIQEngineOutReach">
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
              <Feature flag="displayIQEngineGitHub">
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
          <Feature flag="useIQEngineOutReach">
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
