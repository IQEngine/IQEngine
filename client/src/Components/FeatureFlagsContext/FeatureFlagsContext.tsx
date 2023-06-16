import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Flags {
  [key: string]: boolean;
}

interface ContextProps {
  featureFlags: Flags;
  getFeatureFlag: (flag: string) => boolean;
  setFeatureFlags: React.Dispatch<React.SetStateAction<Flags>>;
}

const FeatureFlagsContext = createContext<ContextProps | undefined>(undefined);

interface Props {
  children: ReactNode;
  flags: Flags;
}

export const FeatureFlagsProvider = ({ children, flags }: Props) => {
  const [featureFlags, setFeatureFlags] = useState<Flags>(flags);
  const getFeatureFlag = (flag: string) => {
    if (!featureFlags || !(flag in featureFlags)) {
      return true;
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
