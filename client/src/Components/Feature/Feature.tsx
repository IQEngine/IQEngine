import React, { ReactNode } from 'react';
import { useFeatureFlags } from '@/Components/FeatureFlagsContext/FeatureFlagsContext';

interface FeatureProps {
  flag: string;
  invert: boolean | string;
  children: ReactNode;
}

const Feature = ({ flag, invert, children }: FeatureProps) => {
  const { getFeatureFlag } = useFeatureFlags();
  if (!invert) {
    invert = false;
  }
  const shouldInvert = typeof invert === 'string' ? invert === 'true' : invert;

  if(shouldInvert) {
    return getFeatureFlag(flag) ? null : children ;
  }


  return getFeatureFlag(flag) ? children : null;
};

export default Feature;
