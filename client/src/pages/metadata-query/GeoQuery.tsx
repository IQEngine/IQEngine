import React, { useState, useMemo, useRef, useCallback } from 'react';
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Circle, LayerGroup } from 'react-leaflet';
import { Icon } from 'leaflet';



function DraggableMarker({updatePosition, defaultPosition, radius}) {
  const customIcon = new Icon({
    iconUrl: 'pin.png',
    iconSize: [25, 25],
  });
  const [draggable, setDraggable] = useState(false)
  const [position, setPosition] = useState(defaultPosition)
  const markerRef = useRef(null)
  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current
        if (marker != null) {
          setPosition(marker.getLatLng());
          updatePosition(marker.getLatLng());
        }
      },
    }),
    [radius],
  )
  const toggleDraggable = useCallback(() => {
    setDraggable((d) => !d)
  }, [])

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={position}
      icon={customIcon}
      ref={markerRef}>
    </Marker>
  )
}

export const GeoQuery = ({
  queryName,
  description,
  validator,
  handleQueryValid
}) => {
  const defaultCenter = {
    lat: 51.505,
    lng: -0.09,
  }
  const defaultRadius = 20000;
  const fillBlueOptions = { fillColor: 'blue' }
  const minRadius = 100;
  const maxRadius = 1000000;
  const [position, setPosition] = useState(defaultCenter);
  const [radius, setRadius] = useState(defaultRadius);
  const [show, setShow] = useState(true);

  const handleRadiusChange = (e) => {
    const value = parseInt(e.target.value);
    setRadius(value);
    const valid = validator({lat: position.lat, lon: position.lng, radius: value});
    handleQueryValid(queryName, valid);
  }

  const getRadius = () => {
    return radius;
  }

  const handlePositionChange = (updatedPosition) => {
    const valid = validator({lat: updatedPosition.lat, lon: updatedPosition.lng, radius: getRadius()});
    setPosition(updatedPosition);
    handleQueryValid(queryName, valid);
  }

  return (
    <div className="mb-10">
      <div className="divider mb-8">
        <div className="tooltip" data-tip={description}>
          <button onClick={() => setShow(!show)} className="btn btn-success w-80">{queryName}</button>
        </div>
      </div>
      {show && <div>
        <input onChange={handleRadiusChange} type="range" min={minRadius} max={maxRadius} value={radius} step={100} className="range range-success" />
        <div className="badge badge-lg mb-5">Radius: {radius}m</div>
        <MapContainer center={position} zoom={8} scrollWheelZoom={true}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LayerGroup>
            <Circle
              center={position}
              pathOptions={fillBlueOptions}
              radius={radius}
            />
          </LayerGroup>
          <DraggableMarker
            radius={radius}
            updatePosition={handlePositionChange}
            defaultPosition={position}
          />
        </MapContainer>
      </div>}
    </div>

  )
}

export default GeoQuery;
