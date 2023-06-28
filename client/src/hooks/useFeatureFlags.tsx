import React, { createContext, useContext, useState, ReactNode } from 'react';

type Flags = {
    [key in FeatureFlag]: boolean;
};


export enum FeatureFlag {
    useIQEngineOutReach = "useIQEngineOutReach",
    displayIQEngineGitHub = "displayIQEngineGitHub",
    displayInternalBranding = "displayInternalBranding",
    useAPIDatasources = "useAPIDatasources",
}

interface ContextProps {
  featureFlags: Flags;
  getFeatureFlag: (flag: FeatureFlag) => boolean;
  setFeatureFlags: React.Dispatch<React.SetStateAction<Flags>>;
}

const FeatureFlagsContext = createContext<ContextProps | undefined>(undefined);

interface Props {
  children: ReactNode;
  flags: Flags;
}

function getFeatureFlagDefault(featureFlag: FeatureFlag): boolean {
    switch (featureFlag) {
        case FeatureFlag.useIQEngineOutReach:
        case FeatureFlag.displayIQEngineGitHub:
        case FeatureFlag.useAPIDatasources:
            return true
        case FeatureFlag.displayInternalBranding:
            return false
        default:
            return true
    }
}

export const FeatureFlagsProvider = ({ children, flags }: Props) => {
  const [featureFlags, setFeatureFlags] = useState<Flags>(flags);
  const getFeatureFlag = (flag: FeatureFlag) => {
    if (!featureFlags || !(flag in featureFlags)) {
      return getFeatureFlagDefault(flag);
    }
    const result = featureFlags[flag]
    console.log("In getFeatureFlag " + flag + ": " + featureFlags[flag])
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
