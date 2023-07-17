import Feature from '@/features/feature/Feature';
import React, { createContext, useContext, useState, ReactNode } from 'react';

export type FeatureFlagName = keyof typeof FeatureFlag;

type Flags = {
  [key in FeatureFlagName]: boolean;
};

export const FeatureFlag = {
  useIQEngineOutReach: {
    name: 'useIQEngineOutReach',
    description: 'Use IQEngine Outreach',
    default: true,
  },
  displayIQEngineGitHub: {
    name: 'displayIQEngineGitHub',
    description: 'Display IQEngine GitHub',
    default: true,
  },
  displayInternalBranding: {
    name: 'displayInternalBranding',
    description: 'Display Internal Branding',
    default: false,
  },
  useAPIDatasources: {
    name: 'useAPIDatasources',
    description: 'Use API Datasources',
    default: true,
  },
};

interface ContextProps {
  featureFlags: Flags;
  getFeatureFlag: (flag: FeatureFlagName) => boolean;
  setFeatureFlags: React.Dispatch<React.SetStateAction<Flags>>;
}

const FeatureFlagsContext = createContext<ContextProps | undefined>(undefined);

interface Props {
  children: ReactNode;
  flags: Flags;
}

export const FeatureFlagsProvider = ({ children, flags }: Props) => {
  const [featureFlags, setFeatureFlags] = useState<Flags>(flags);
  const getFeatureFlag = (flag: FeatureFlagName) => {
    if (!featureFlags || !(flag in featureFlags)) {
      return FeatureFlag[flag]?.default ?? true;
    }
    return featureFlags[flag];
  };
  return (
    <FeatureFlagsContext.Provider value={{ featureFlags, setFeatureFlags, getFeatureFlag }}>
      {children}
    </FeatureFlagsContext.Provider>
  );
};

export const useFeatureFlags = (): ContextProps => {
  const context = useContext(FeatureFlagsContext);

  if (context === undefined) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagsProvider');
  }

  return context;
};
