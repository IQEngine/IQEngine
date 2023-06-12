import React, { ReactNode } from 'react';
import { useFeatureFlags } from '../FeatureFlagsContext/FeatureFlagsContext';

interface FeatureProps {
  flag: string;
  children: ReactNode;
}

const Feature = ({ flag, children }: FeatureProps) => {
  const { getFeatureFlag } = useFeatureFlags();

  return getFeatureFlag(flag) ? <>{children}</> : null;
};

export default Feature;
