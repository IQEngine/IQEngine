import * as React from 'react';

const TailwindTheme = React.lazy(() => import('./TailwindStyle'));

// @ts-ignore
const ThemeSelector = ({ children }): any => {
  return (
    <>
      <React.Suspense fallback={<></>}>
        <TailwindTheme />
      </React.Suspense>
      {children}
    </>
  );
};

export default ThemeSelector;
