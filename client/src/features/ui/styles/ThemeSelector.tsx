import * as React from 'react';
import TailwindStyle from './TailwindStyle';

// @ts-ignore
const ThemeSelector = ({ children }): any => {
  return (
    <>
      <React.Suspense fallback={<></>}>
        <TailwindStyle />
      </React.Suspense>
      {children}
    </>
  );
};

export default ThemeSelector;
