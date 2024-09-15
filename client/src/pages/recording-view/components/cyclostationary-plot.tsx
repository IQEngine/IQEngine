import React, { useEffect, useState } from 'react';
import { useSpectrogramContext } from '../hooks/use-spectrogram-context';
import { calc_SCF_time_smoothing } from '@/utils/cyclostationary';
import { colMaps } from '@/utils/colormap';
import { Layer, Stage, Image, Rect, Text } from 'react-konva';
import { unitPrefixHz } from '@/utils/rf-functions';

interface CyclostationaryPlotProps {
  displayedIQ: Float32Array;
  fftStepSize: Number;
}

export const CyclostationaryPlot = ({ displayedIQ, fftStepSize }: CyclostationaryPlotProps) => {
  const { spectrogramWidth, spectrogramHeight, meta, includeRfFreq } = useSpectrogramContext();
  const sampleRate = meta.getSampleRate();
  const centerFrequency = meta.getCenterFrequency();
  const [alphaStart, setAlphaStart] = useState(0.0);
  const [alphaStop, setAlphaStop] = useState(0.3);
  const [alphaStep, setAlphaStep] = useState(0.001);
  const [alphas, setAlphas] = useState([]);
  const [numAlphas, setNumAlphas] = useState(0);
  const [numFreqs, setNumFreqs] = useState(0);
  const [SCF_mag, setSCF_mag] = useState([]);
  const [image, setImage] = useState<ImageBitmap>(null);
  const Nw = 256; // window length
  const graphicsScalingFactor = 2;
  const [alphaTicks, setAlphaTicks] = useState([]);
  const [alphaLabels, setAlphaLabels] = useState([]);
  const [freqTicks, setFreqTicks] = useState([]);
  const [freqLabels, setFreqLabels] = useState([]);

  // When the user clicks the calculate button, recalc alphas, and if the alphas change at all then it will auto recalc SCF
  const onSubmitCalc = () => {
    let alphas = [];
    for (let alpha = alphaStart; alpha <= alphaStop; alpha += alphaStep) {
      alphas.push(alpha);
    }
    if (alphas[0] == 0) {
      alphas[0] = alphas[1]; // avoid calc at alpha=0 or it throws off color scale
    }
    setAlphas(alphas);
    setNumAlphas(alphas.length);

    // Alpha ticks and labels
    const temp_alpha_ticks = [];
    const temp_alpha_labels = [];
    const alpha_interval = Math.floor(alphas.length / 10);
    for (let i = 1; i < alphas.length; i++) {
      if (i % alpha_interval === 0) {
        temp_alpha_ticks.push({ x: 0, y: i * graphicsScalingFactor, width: 20, height: 0 });
        temp_alpha_labels.push({ text: alphas[i].toFixed(2), x: 0, y: i * graphicsScalingFactor });
      }
    }
    temp_alpha_labels.push({ text: 'alpha [normalized Hz]', x: 0, y: alphas.length * graphicsScalingFactor });
    temp_alpha_labels.push({
      text: '(i.e., samples-per-symbol inverted)',
      x: 0,
      y: alphas.length * graphicsScalingFactor + 20,
    });
    setAlphaTicks(temp_alpha_ticks);
    setAlphaLabels(temp_alpha_labels);
  };

  useEffect(() => {
    if (!SCF_mag.length) {
      return;
    }
    const num_alphas = SCF_mag.length; // cyclic domain
    if (num_alphas !== alphas.length) {
      console.error('num_alphas !== alphas.length for some reason');
    }
    const num_freqs = SCF_mag[0].length; // RF freq domain
    setNumFreqs(num_freqs);

    // Freq ticks and labels
    const temp_freq_ticks = [];
    const temp_freq_labels = [];
    if (!includeRfFreq) {
      // Center line
      temp_freq_labels.push({ text: '0', x: (num_freqs * graphicsScalingFactor) / 2, y: 0 });
      // 0 line
      temp_freq_labels.push({ text: (sampleRate * -0.5) / 1e3, x: 0, y: 0 });
      // 1/4 line
      temp_freq_labels.push({ text: (sampleRate * -0.25) / 1e3, x: (num_freqs * graphicsScalingFactor) / 4, y: 0 });
      // 3/4 line
      temp_freq_labels.push({ text: (sampleRate * 0.25) / 1e3, x: num_freqs * graphicsScalingFactor * 0.75, y: 0 });
      // 1 line
      temp_freq_labels.push({ text: (sampleRate * 0.5) / 1e3, x: num_freqs * graphicsScalingFactor, y: 0 });
      // kHz label
      temp_freq_labels.push({ text: 'kHz', x: num_freqs * graphicsScalingFactor, y: 20 });
    } else {
      const formatted = unitPrefixHz(centerFrequency);
      temp_freq_labels.push({
        text: formatted.freq + ' ' + formatted.unit,
        x: (num_freqs * graphicsScalingFactor) / 2,
        y: 0,
      });
    }
    temp_freq_ticks.push({ x: (num_freqs * graphicsScalingFactor) / 2, y: 0, width: 0, height: 20 });
    temp_freq_ticks.push({ x: 1, y: 0, width: 0, height: 20 });
    temp_freq_ticks.push({ x: num_freqs * graphicsScalingFactor * 0.25, y: 0, width: 0, height: 20 });
    temp_freq_ticks.push({ x: num_freqs * graphicsScalingFactor * 0.75, y: 0, width: 0, height: 20 });
    temp_freq_ticks.push({ x: num_freqs * graphicsScalingFactor * 1, y: 0, width: 0, height: 20 });
    setFreqTicks(temp_freq_ticks);
    setFreqLabels(temp_freq_labels);

    // Create an image out of SCF_mag (converts it from 2d to 1d). FIXME I could probably just have it 1D from the start
    let img = new Array(num_alphas * num_freqs).fill(0);
    let max_val = 0;
    for (let i = 0; i < num_alphas; i++) {
      for (let j = 0; j < num_freqs; j++) {
        img[i * num_freqs + j] = SCF_mag[i][j];
        max_val = Math.max(max_val, SCF_mag[i][j]);
      }
    }

    console.log('Max SCF_mag: ' + max_val);

    // Normalize/scale so that half the max is 255
    for (let i = 0; i < img.length; i++) {
      img[i] = Math.round((img[i] / max_val) * 2 * 255);
    }
    img = img.map((val) => Math.min(255, Math.max(0, val))); // Truncate to 0 to 255

    const imgData = new Uint8ClampedArray(num_freqs * num_alphas * 4);
    for (let i = 0; i < img.length; i++) {
      imgData[i * 4] = colMaps.viridis[img[i]][0]; // R
      imgData[i * 4 + 1] = colMaps.viridis[img[i]][1]; // G
      imgData[i * 4 + 2] = colMaps.viridis[img[i]][2]; // B
      imgData[i * 4 + 3] = 255; // alpha
    }
    const newImageData = new ImageData(imgData, num_freqs, num_alphas);
    createImageBitmap(newImageData).then((imageBitmap) => {
      setImage(imageBitmap);
    });
  }, [SCF_mag]);

  useEffect(() => {
    if (displayedIQ && displayedIQ.length > 0) {
      setSCF_mag(calc_SCF_time_smoothing(displayedIQ.slice(0, 100000), alphas, Nw));
    }
  }, [displayedIQ, alphas]);

  return (
    <div className="px-3">
      <p className="text-primary text-center">
        This will process the first 100k IQ samples displayed on the spectrogram tab
      </p>
      <p className="text-primary text-center">
        For an intro to cyclostationary signals see{' '}
        <a className="underline" target="_blank" href="https://pysdr.org/content/cyclostationary.html">
          PySDR
        </a>
      </p>
      {fftStepSize === 0 ? (
        <div>
          <br></br>
          <div className="form-control">
            <label className="mb-3" id="formZoom">
              <span className="text-base">Alpha Start [0-1]</span>
              <input
                type="text"
                className="h-8 w-54 rounded-l text-base-100 ml-1 pl-2"
                defaultValue={alphaStart}
                onChange={(e) => {
                  setAlphaStart(parseFloat(e.target.value));
                }}
              />
            </label>

            <label className="mb-3" id="formZoom">
              <span className="text-base ">Alpha Stop [0-1]</span>
              <input
                type="text"
                className="h-8 w-54 rounded-l text-base-100 ml-1 pl-2"
                defaultValue={alphaStop}
                onChange={(e) => {
                  setAlphaStop(parseFloat(e.target.value));
                }}
              />
            </label>

            <label className="mb-3" id="formZoom">
              <span className="text-base ">Alpha Step</span>
              <input
                type="text"
                className="h-8 w-54 rounded-l text-base-100 ml-1 pl-2"
                defaultValue={alphaStep}
                onChange={(e) => {
                  setAlphaStep(parseFloat(e.target.value));
                }}
              />
            </label>

            <button className="rounded w-32" onClick={onSubmitCalc}>
              Calculate
            </button>
          </div>

          <br></br>

          <div className="flex flex-row" id="spectrogram">
            <Stage width={numFreqs * graphicsScalingFactor + 50} height={numAlphas * graphicsScalingFactor + 40}>
              <Layer imageSmoothingEnabled={false}>
                <Image
                  image={image}
                  x={0}
                  y={0}
                  width={numFreqs * graphicsScalingFactor}
                  height={numAlphas * graphicsScalingFactor}
                />
              </Layer>
              <Layer>
                {alphaTicks.map((tick, index) => (
                  // couldnt get Line to work, kept getting NaN errors, so just using Rect instead
                  <Rect
                    x={tick.x}
                    y={tick.y}
                    width={tick.width}
                    height={tick.height}
                    fillEnabled={false}
                    stroke="white"
                    strokeWidth={1}
                    key={index}
                  />
                ))}
                {alphaLabels.map((label, index) => (
                  // for Text params see https://konvajs.org/api/Konva.Text.html
                  <Text
                    text={label.text}
                    fontFamily="serif"
                    fontSize={16}
                    x={label.x}
                    y={label.y}
                    fill="white"
                    key={index}
                    wrap={'none'}
                  />
                ))}
              </Layer>
              <Layer>
                {freqTicks.map((tick, index) => (
                  // couldnt get Line to work, kept getting NaN errors, so just using Rect instead
                  <Rect
                    x={tick.x}
                    y={tick.y}
                    width={tick.width}
                    height={tick.height}
                    fillEnabled={false}
                    stroke="white"
                    strokeWidth={1}
                    key={index}
                  />
                ))}
                {freqLabels.map((label, index) => (
                  // for Text params see https://konvajs.org/api/Konva.Text.html
                  <Text
                    text={label.text}
                    fontFamily="serif"
                    fontSize={16}
                    x={label.x}
                    y={label.y}
                    fill="white"
                    key={index}
                    wrap={'none'}
                  />
                ))}
              </Layer>
            </Stage>
          </div>
          <br></br>
        </div>
      ) : (
        <>
          <h1 className="text-center">Plot only visible when Zoom Out Level is minimum (0)</h1>
          <p className="text-primary text-center mb-6">(Otherwise the IQ samples are not contiguous)</p>
        </>
      )}
    </div>
  );
};
