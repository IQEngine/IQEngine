import axios from 'axios';
import { useQuery } from '@tanstack/react-query';

const fetchConfig = async () => {
  const response = await axios.get<Config>('/api/config').catch((error) => {
    console.log(error);
    return {
      data: {} as Config,
    };
  });
  if (!response.data.connectionInfo) {
    response.data.connectionInfo = JSON.parse(import.meta.env.VITE_CONNECTION_INFO);
  }
  if (!response.data.detectorEndpoint) {
    response.data.detectorEndpoint = import.meta.env.VITE_DETECTOR_ENDPOINT;
  }
  if (!response.data.googleAnalyticsKey) {
    response.data.googleAnalyticsKey = import.meta.env.VITE_GOOGLE_ANALYTICS_KEY;
  }
  return response.data;
};

type Config = {
  detectorEndpoint: string;
  connectionInfo: object;
  googleAnalyticsKey: string;
};

export const configQuery = () => useQuery(['config'], fetchConfig);
