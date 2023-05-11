import * as React from 'react';

const BootstrapTheme = React.lazy(() => import('./BootstrapStyle'));
const TailwindTheme = React.lazy(() => import('./TailwindStyle'));

// @ts-ignore
const ThemeSelector = ({ children }): any => {
  const newVerison = import.meta.env.VITE_IQENGINE_APP_VERSION === 'v2';
  return (
    <>
      <React.Suspense fallback={<></>}>{newVerison ? <TailwindTheme /> : <BootstrapTheme />}</React.Suspense>
      {children}
    </>
  );
};

export default ThemeSelector;
