import React, { ReactNode } from 'react';
import { useFeatureFlags } from '../FeatureFlagsContext/FeatureFlagsContext';

interface FeatureProps {
  flag: string;
  children: ReactNode;
}

const Feature = ({ flag, children }: FeatureProps) => {
  const { featureFlags } = useFeatureFlags();

  if (!featureFlags) {
    return null;
  }

  return featureFlags[flag] ? <>{children}</> : null;
};

export default Feature;
