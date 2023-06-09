import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Flags {
  [key: string]: boolean;
}

interface ContextProps {
  featureFlags: Flags;
  setFeatureFlags: React.Dispatch<React.SetStateAction<Flags>>;
}

const FeatureFlagsContext = createContext<ContextProps | undefined>(undefined);

interface Props {
  children: ReactNode;
  flags: Flags;
}

export const FeatureFlagsProvider: React.FC<Props> = ({ children, flags }) => {
  const [featureFlags, setFeatureFlags] = useState<Flags>(flags);

  return (
    <FeatureFlagsContext.Provider value={{ featureFlags, setFeatureFlags }}>{children}</FeatureFlagsContext.Provider>
  );
};

export const useFeatureFlags = (): ContextProps => {
  const context = useContext(FeatureFlagsContext);

  if (context === undefined) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagsProvider');
  }

  return context;
};
