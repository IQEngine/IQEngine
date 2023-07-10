import React, { ReactNode } from 'react';
import { useFeatureFlags, FeatureFlag } from '@/hooks/useFeatureFlags';


interface FeatureProps {
  flag: FeatureFlag;
  children: ReactNode;
}

const Feature = ({ flag, children }: FeatureProps) => {
  const { getFeatureFlag } = useFeatureFlags();

  return getFeatureFlag(flag) ? <>{children}</> : null;
};

export default Feature;
