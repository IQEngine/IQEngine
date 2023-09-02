// Licensed under the MIT License

import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CLIENT_TYPE_BLOB, CLIENT_TYPE_LOCAL } from '@/api/Models';
import { getMeta } from '@/api/metadata/queries';
import { FileAnnotationData } from './file-annotation-data';
import { ModalDialog } from '@/features/ui/modal/Modal';
import { useFeatureFlags } from '@/hooks/use-feature-flags';
import { useIntersectionObserver } from 'usehooks-ts'
import { useGetMinimapIQ } from '@/api/iqdata/Queries';
import { MINIMAP_FFT_SIZE } from '@/utils/constants';
import { calcFfts, fftToRGB } from '@/utils/selector';
import { colMaps } from '@/utils/colormap';
import { Stage, Layer, Image } from 'react-konva';

interface LocalDirThumbnailProps {
    filepath: string;
    type: string;
    account: string;
    container: string;
}

function LocalDirThumbnail({ filepath, type, account, container }: LocalDirThumbnailProps): JSX.Element {

    // Thumbnail for local dir related
    const [thumbnailImg, setThumbnailImg] = useState(null);
    const { data: minimapData } = useGetMinimapIQ(type, account, container, filepath);

    // Calc the ffts for the thumbnail
    const ffts = useMemo(() => {
        if (!minimapData) return null;
        // transform the minimap data into an one big FLOAT32ARRAY
        const iqData = new Float32Array(minimapData.length * minimapData[0].length);
        for (let i = 0; i < minimapData.length; i++) {
            iqData.set(minimapData[i], i * minimapData[i].length);
        }
        const ffts_calc = calcFfts(iqData, MINIMAP_FFT_SIZE, 'nowindow', 1000);
        const min = Math.min(...ffts_calc);
        const max = Math.max(...ffts_calc);
        return ffts_calc;
    }, [minimapData]);

    // Calc the thumbnail image from ffts to rgb
    useEffect(() => {
        if (!ffts) return;
        const min = Math.min(...ffts);
        const max = Math.max(...ffts);
        const rgbData = fftToRGB(ffts, MINIMAP_FFT_SIZE, min, max, colMaps['viridis']);
        let num_final_ffts = ffts.length / MINIMAP_FFT_SIZE;
        const newImageData = new ImageData(rgbData, MINIMAP_FFT_SIZE, num_final_ffts);
        createImageBitmap(newImageData).then((imageBitmap) => {
            setThumbnailImg(imageBitmap);
        });
    }, [ffts]);


    return (
        <div>
            <Stage width={200} height={100}>
                <Layer>
                    <Image
                        image={thumbnailImg}
                        x={0}
                        y={0}
                        width={200}
                        height={100}
                    />
                </Layer>
            </Stage>
        </div>
    );
}

export default LocalDirThumbnail