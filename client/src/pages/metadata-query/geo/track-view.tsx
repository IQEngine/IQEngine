import React from 'react';
import { useMap } from 'react-leaflet';

export const TrackView = ({ center, zoom }) => {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

export default TrackView;
