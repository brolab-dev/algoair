import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon issue with webpack
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const getValue = (s, key) => {
  if (s[key] != null) return s[key];
  if (s.data && s.data[key] != null) return s.data[key];
  return undefined;
};

const getLatLng = (s) => {
  // Direct fields
  if (s.latitude != null && s.longitude != null) {
    return [Number(s.latitude), Number(s.longitude)];
  }
  // Nested location object
  if (typeof s.location === 'object' && s.location) {
    const lat = s.location.lat ?? s.location.latitude;
    const lng = s.location.lng ?? s.location.longitude;
    if (lat != null && lng != null) return [Number(lat), Number(lng)];
  }
  // Location as string "lat,lng"
  if (typeof s.location === 'string' && s.location.includes(',')) {
    const [latStr, lngStr] = s.location.split(',').map(t => t.trim());
    const lat = Number(latStr);
    const lng = Number(lngStr);
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) return [lat, lng];
  }
  // Nested under data
  if (s.data) return getLatLng(s.data);
  return null;
};

const DataMap = ({ submissions }) => {
  const defaultCenter = [16.0544, 108.2022]; // Default to Da Nang, Vietnam

  return (
    <MapContainer center={defaultCenter} zoom={5} style={{ height: '400px', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {submissions.map((s, index) => {
        const latlng = getLatLng(s);
        if (latlng) {
          const aqi = getValue(s, 'aqi');
          const temp = getValue(s, 'temperature');
          return (
            <Marker key={index} position={latlng}>
              <Popup>
                <b>AQI:</b> {aqi ?? '—'}<br />
                <b>Temp:</b> {temp ?? '—'}°C<br />
                <b>Location:</b> {latlng[0].toFixed(4)}, {latlng[1].toFixed(4)}
              </Popup>
            </Marker>
          );
        }
        return null;
      })}
    </MapContainer>
  );
};

export default DataMap;
