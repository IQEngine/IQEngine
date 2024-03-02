import React from 'react';
import { Link, useRouteError, isRouteErrorResponse } from 'react-router-dom';

export const ErrorPage = () => {
  const error = useRouteError();
  console.log(error);

  let errorMessage: string;
  if (isRouteErrorResponse(error)) {
    errorMessage = error.error?.message || error.statusText; // error is type `ErrorResponse`
  } else if (error instanceof Error) {
    errorMessage = error.stack;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else {
    console.error(error);
    errorMessage = 'Unknown error';
  }

  return (
    <>
      <div className="w-full h-screen flex flex-col items-center mt-28">
        <h1>Error</h1>
        <div>
          {errorMessage.split('\n').map((i, key) => {
            return <div key={key}>{i}</div>;
          })}
        </div>
        <br></br>
        <Link to={'/browser'}>Back Home</Link>
        <br></br>
        <div>
          Note - If you see Error "Failed to fetch dynamically imported module", try refreshing your cache with
          control-shift-R
        </div>
      </div>
    </>
  );
};
