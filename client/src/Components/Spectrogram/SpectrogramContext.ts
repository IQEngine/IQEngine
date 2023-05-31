import { createContext } from 'react';

export type SpectrogramReference = {
  type: string;
  account: string;
  container: string;
  filePath: string;
  sasToken?: string;
};

export const SpectrogramContext = createContext<SpectrogramReference>({
  type: '',
  account: '',
  container: '',
  filePath: '',
  sasToken: '',
});
