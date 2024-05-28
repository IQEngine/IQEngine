// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import { useState, useEffect, Dispatch, SetStateAction, ChangeEvent } from 'react';
import FFTSizeInput from './FFTSizeInputButton';
import webfft, { BrowserCapabilities, ProfileResult } from 'webfft';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineController,
  PointElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
} from 'chart.js';
import { BallTriangle } from 'react-loader-spinner';

// Registering the components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

export const WebfftBenchmark = () => {
  const [duration, setDuration] = useState(1);
  const [fftSize, setFftSize] = useState(1024);

  const [browserCapabilities, setBrowserInfo] = useState<BrowserCapabilities>({
    browserName: 'Unknown',
    browserVersion: 'Unknown',
    osName: 'Unknown',
    osVersion: 'Unknown',
    wasm: false,
    relaxedSimd: false,
    simd: false,
  });
  const [simdSupport, setSimdSupport] = useState<boolean>(false);
  const [relaxedSimdSupport, setRelaxedSimdSupport] = useState<boolean>(false);
  const [wasmSupport, setWasmSupport] = useState<boolean>(false);
  const [benchmarkData, setBenchmarkData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const webfftInstance = new webfft(128);
    webfftInstance
      .checkBrowserCapabilities()
      .then((browserResult) => {
        setBrowserInfo(browserResult);
      })
      .catch((error) => {
        console.error('Failed to check browser capabilities:', error);
      });
    webfftInstance.dispose();
  }, []);

  useEffect(() => {
    if (browserCapabilities) {
      setSimdSupport(browserCapabilities.simd);
      setRelaxedSimdSupport(browserCapabilities.relaxedSimd);
      setWasmSupport(browserCapabilities.wasm);
    }
  }, [browserCapabilities]);

  const handleDurationChange = (event: ChangeEvent<HTMLInputElement>) => {
    var val = parseInt(event.target.value);
    if (val > 1) {
      setDuration(val);
    } else {
      setDuration(1);
    }
  };

  const handleClearState = () => {
    setBenchmarkData(null);
    setFftSize(1024);
    setDuration(1);
  };

  // This will run when you click the run benchmark button
  useEffect(() => {
    if (loading) {
      // allow UI to update before starting long running task
      const fftWorker = new Worker(new URL('./webworker.tsx', import.meta.url), { type: 'module' });

      fftWorker.postMessage([fftSize, duration]);

      fftWorker.onmessage = (e: MessageEvent<ProfileResult>) => {
        const profileObj = e.data;

        const wasmColor = 'hsl(200, 100%, 50%, 0.75)';
        const jsColor = 'hsla(320, 80%, 50%, 0.8)';

        const dataWithLabels = profileObj.subLibraries.map((label, index) => ({
          label: label,
          value: profileObj.fftsPerSecond[index],
        }));

        // Sort the pairs in descending order based on the data values
        dataWithLabels.sort((a, b) => b.value - a.value);

        // Create arrays of labels and data, preserving the new order
        const sortedLabels = dataWithLabels.map((item) => item.label);
        const sortedData = dataWithLabels.map((item) => item.value);

        // Define the label subsets for each category
        const wasmLabels = sortedLabels.filter((label) => label.includes('Wasm'));
        const jsLabels = sortedLabels.filter((label) => label.includes('Javascript'));

        // Create arrays of the WASM and JS data, maintaining the new order, and only including a data point if the label matches the category
        const wasmData = sortedLabels.map((label, index) => (wasmLabels.includes(label) ? sortedData[index] : null));

        const jsData = sortedLabels.map((label, index) => (jsLabels.includes(label) ? sortedData[index] : null));

        // Create datasets for the bar chart
        const datasets = [
          {
            label: 'WASM',
            data: wasmData,
            backgroundColor: wasmColor,
            borderColor: 'hsla(0, 0%, 80%, 0.9)',
            borderWidth: 1,
          },
          {
            label: 'Javascript',
            data: jsData,
            backgroundColor: jsColor,
            borderColor: 'hsla(0, 0%, 80%, 0.9)',
            borderWidth: 1,
          },
        ];

        setBenchmarkData({
          labels: sortedLabels,
          datasets: datasets,
        });

        setLoading(false);
      };

      return () => {
        fftWorker.terminate();
      };
    }
  }, [loading, fftSize, duration]);

  if (benchmarkData) {
    benchmarkData.labels = benchmarkData.labels.map((label: string) => label.replace(/(javascript|wasm)/gi, ''));
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    elements: {
      bar: {
        borderWidth: 5,
      },
    },
    plugins: {
      legend: {
        position: 'top' as const,
        display: true,
      },
      title: {
        display: false,
        text: 'Test Results',
      },
    },
    scales: {
      y: {
        grid: {
          display: true,
          color: `hsla(0, 0%, 80%, 0.9)`,
        },
        title: {
          display: true,
          font: {
            size: 16,
          },
          color: `hsla(0, 0%, 80%, 0.9)`,
          text: 'FFTs per Second',
        },
      },
      x: {
        stacked: true,
        grid: {
          display: true,
          offset: true,
          color: `hsla(0, 0%, 80%, 0.9)`,
        },
        title: {
          display: true,
          font: {
            size: 16,
          },
          color: `hsla(0, 0%, 80%, 0.9)`,
          text: 'FFT Algorithms',
        },
        ticks: {
          display: true,
          font: {
            size: 10,
          },
          color: `hsla(0, 0%, 80%, 0.9)`,
        },
      },
    },
  };

  return (
    <div className="App flex flex-col items-center text-cyber-text min-h-screen min-w-screen">
      <h1 className="text-2xl" aria-describedby="Test FFTs per Second in this Benchmark Section">
        Benchmark your browser
      </h1>

      <div className="flex justify-center space-x-4 mt-4">
        <button
          onClick={() => {
            setBenchmarkData(null);
            setLoading(true);
          }}
          className="bg-cyber-secondary text-cyber-text px-4 py-2 rounded-md"
          aria-label="Run Benchmark Test Button"
        >
          Run Benchmark
        </button>

        <button
          onClick={handleClearState}
          className="bg-cyber-background1 border border-cyber-primary text-cyber-text px-4 py-2 space-x-4 rounded-md"
          aria-label="Clear Benchmark Results Button"
        >
          ❌ Clear
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mt-4">
        <div className="col-span-1 flex flex-col items-center mb-4">
          <span className="block text-base mb-1">FFT Size</span>
          <FFTSizeInput fftSize={fftSize} setFftSize={setFftSize} />
        </div>

        <div className="col-span-1 flex flex-col items-center mb-4">
          <label className="mb-3" id="formZoom">
            <span className="label-text text-base mb-1">
              Duration to Run Benchmark:{' '}
              <span className="label-text text-base text-cyber-accent"> {duration} seconds</span>
            </span>
            <input
              type="range"
              className="range range-xs range-primary"
              value={duration}
              min={0.1}
              max={10}
              step={0.1}
              onChange={handleDurationChange}
            />
          </label>
        </div>

        <div className="col-span-2 flex flex-col items-center mb-4 space-y-2">
          <span className="text-center text-base label-text">
            Browser Information: <br />
            {browserCapabilities ? (
              <div className="text-cyber-accent">
                <div>
                  <strong>Browser: </strong>
                  {browserCapabilities.browserName ?? 'Unknown'}{' '}
                  {<span>{browserCapabilities.browserVersion}</span> ?? ''}
                </div>
                <div>
                  <strong>OS: </strong>
                  {browserCapabilities.osName ?? 'Unknown'} {<span>{browserCapabilities.osVersion}</span> ?? ''}
                </div>
              </div>
            ) : (
              <div>
                <span className="text-cyber-accent">Browser not recognized or detected.</span>
              </div>
            )}
          </span>
          <span className="text-center text-base label-text">
            SIMD Support: <br />
            <span className="text-cyber-accent">{simdSupport ? 'Supported' : 'Not supported'}</span>
          </span>
          <span className="text-center text-base label-text">
            Relaxed SIMD: <br />
            <span className="text-cyber-accent">{relaxedSimdSupport ? 'Enabled' : 'Disabled'}</span>
          </span>
          <span className="text-center text-base label-text">
            WASM Support: <br />
            <span className="text-cyber-accent">{wasmSupport ? 'Supported' : 'Not supported'}</span>
          </span>
        </div>
      </div>

      <div className="w-1/2 max-h-screen mx-auto p-0">
        {(loading || benchmarkData) && (
          <h1 className="text-center text-2xl" aria-describedby="Your FFT Benchmark Results Appear Below">
            Results
          </h1>
        )}

        {loading && (
          <BallTriangle
            height={200}
            width={200}
            radius={5}
            color="#4fa94d"
            ariaLabel="ball-triangle-loading"
            wrapperStyle={{ justifyContent: 'center' }}
            visible={true}
          />
        )}

        {benchmarkData && (
          <div className="min-h-full mx-auto p-0">
            <Bar
              data={benchmarkData}
              options={options}
              height={425}
              aria-label="Benchmark Histogram Results for FFT per Second by Algorithm"
              role="img"
            />
          </div>
        )}

        {/* Display table of all of the results here */}
        {/* Assuming you will populate the table with data fetched after the benchmarking */}
      </div>
    </div>
  );
};

export default WebfftBenchmark;
