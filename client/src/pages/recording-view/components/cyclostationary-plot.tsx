import React, { useEffect, useState } from 'react';
import { useSpectrogramContext } from '../hooks/use-spectrogram-context';
import { calc_SCF_time_smoothing } from '@/utils/cyclostationary';
import { colMaps } from '@/utils/colormap';
import { Layer, Stage, Image } from 'react-konva';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { IconProp } from '@fortawesome/fontawesome-svg-core';

interface CyclostationaryPlotProps {
  displayedIQ: Float32Array;
  fftStepSize: Number;
}

export const CyclostationaryPlot = ({ displayedIQ, fftStepSize }: CyclostationaryPlotProps) => {
  const { spectrogramWidth, spectrogramHeight } = useSpectrogramContext();
  const [alphaStart, setAlphaStart] = useState(0.0);
  const [alphaStop, setAlphaStop] = useState(0.3);
  const [alphaStep, setAlphaStep] = useState(0.001);
  const [alphas, setAlphas] = useState([]);
  const [numAlphas, setNumAlphas] = useState(0);
  const [numFreqs, setNumFreqs] = useState(0);
  const [SCF_mag, setSCF_mag] = useState([]);
  const [image, setImage] = useState<ImageBitmap>(null);
  const Nw = 256; // window length

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
  };

  useEffect(() => {
    if (SCF_mag.length) {
      const num_alphas = SCF_mag.length; // cyclic domain
      if (num_alphas !== alphas.length) {
        console.error('num_alphas !== alphas.length for some reason');
      }
      const num_freqs = SCF_mag[0].length; // RF freq domain
      setNumFreqs(num_freqs);

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
    }
  }, [SCF_mag]);

  useEffect(() => {
    if (displayedIQ && displayedIQ.length > 0) {
      console.log('displayedIQ.length: ', displayedIQ.length);
      setSCF_mag(calc_SCF_time_smoothing(displayedIQ, alphas, Nw));
      //console.log('SCF_mag: ', SCF_mag);
    }
  }, [displayedIQ, alphas]);

  return (
    <div className="px-3">
      <p className="text-primary text-center">Below shows the IQ samples displayed on the spectrogram tab</p>
      <p className="text-primary text-center">
        (tip: set FFT size lower, eg 128, to speed up the cyclostationary calculation)
      </p>
      {fftStepSize === 0 ? (
        <div>
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

            <button className="rounded-none rounded-r" onClick={onSubmitCalc}>
              Calculate
              <FontAwesomeIcon icon={faArrowRight as IconProp} />
            </button>
          </div>

          <div className="flex flex-row" id="spectrogram">
            <Stage width={spectrogramWidth} height={spectrogramHeight}>
              <Layer imageSmoothingEnabled={false}>
                <Image image={image} x={0} y={0} width={numFreqs} height={numAlphas} />
              </Layer>
            </Stage>
          </div>
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
