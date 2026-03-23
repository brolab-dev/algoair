import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { getAqiColor } from '../utils/aqiUtils';

const getValue = (s, key) => {
  if (s[key] != null) return s[key];
  if (s.data && s.data[key] != null) return s.data[key];
  return undefined;
};

const getLatLng = (s) => {
  if (s.latitude != null && s.longitude != null) {
    return [Number(s.latitude), Number(s.longitude)];
  }
  if (typeof s.location === 'object' && s.location) {
    const lat = s.location.lat ?? s.location.latitude;
    const lng = s.location.lng ?? s.location.longitude;
    if (lat != null && lng != null) return [Number(lat), Number(lng)];
  }
  if (typeof s.location === 'string' && s.location.includes(',')) {
    const [latStr, lngStr] = s.location.split(',').map((t) => t.trim());
    const lat = Number(latStr);
    const lng = Number(lngStr);
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) return [lat, lng];
  }
  if (s.data) return getLatLng(s.data);
  return null;
};

const DataMap = ({ submissions }) => {
  const defaultCenter = [16.0544, 108.2022];

  return (
    <MapContainer
      center={defaultCenter}
      zoom={5}
      style={{ height: '100%', minHeight: 280, width: '100%', borderRadius: 12 }}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
      />
      {submissions.map((s, index) => {
        const latlng = getLatLng(s);
        if (!latlng) return null;
        const aqi = getValue(s, 'aqi');
        const temp = getValue(s, 'temperature');
        const color = getAqiColor(aqi);
        return (
          <CircleMarker
            key={index}
            center={latlng}
            radius={10}
            pathOptions={{
              color: color,
              fillColor: color,
              fillOpacity: 0.7,
              weight: 2,
              opacity: 0.9,
            }}
          >
            <Popup>
              <div style={{ fontFamily: 'Inter, Roboto, sans-serif', fontSize: 13 }}>
                <div style={{ fontWeight: 700, fontSize: 16, color, marginBottom: 4 }}>
                  AQI: {aqi ?? '--'}
                </div>
                <div>Temp: {temp ?? '--'}°C</div>
                <div style={{ color: '#888', fontSize: 11, marginTop: 2 }}>
                  {latlng[0].toFixed(4)}, {latlng[1].toFixed(4)}
                </div>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
};

export default DataMap;
