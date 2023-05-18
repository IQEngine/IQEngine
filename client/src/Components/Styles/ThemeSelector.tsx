import * as React from 'react';

const BootstrapTheme = React.lazy(() => import('./BootstrapStyle'));
const TailwindTheme = React.lazy(() => import('./TailwindStyle'));

// @ts-ignore
const ThemeSelector = ({ children }): any => {
  const newVersion = import.meta.env.VITE_IQENGINE_APP_VERSION === 'v2';
  return (
    <>
      <React.Suspense fallback={<></>}>{newVersion ? <TailwindTheme /> : <BootstrapTheme />}</React.Suspense>
      {children}
    </>
  );
};

export default ThemeSelector;
