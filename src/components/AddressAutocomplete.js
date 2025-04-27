import React, { useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const CityAreaHousePicker = () => {
  // State management
  const [cityQuery, setCityQuery] = useState('');
  const [areaQuery, setAreaQuery] = useState('');
  const [position, setPosition] = useState(null);
  const [address, setAddress] = useState('');
  const [mapCenter, setMapCenter] = useState([23.2599, 77.4126]); // Default: Bhopal
  const [zoomLevel, setZoomLevel] = useState(12);
  
  // Refs
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  // Search city (first step)
  const searchCity = async () => {
    if (!cityQuery.trim()) return;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityQuery)}&limit=1`
      );
      const data = await response.json();
      
      if (data.length > 0) {
        const { lat, lon } = data[0];
        const newCenter = [parseFloat(lat), parseFloat(lon)];
        setMapCenter(newCenter);
        setPosition(newCenter);
        setZoomLevel(12); // Zoom out to show city
        mapRef.current.flyTo(newCenter, 12);
        
        const reverseResponse = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
        );
        const reverseData = await reverseResponse.json();
        setAddress(reverseData.display_name);
      }
    } catch (error) {
      console.error("City search error:", error);
    }
  };

  // Search area within city (second step)
  const searchArea = async () => {
    if (!areaQuery.trim() || !cityQuery.trim()) return;

    try {
      const fullQuery = `${areaQuery}, ${cityQuery}`;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullQuery)}&limit=1`
      );
      const data = await response.json();
      
      if (data.length > 0) {
        const { lat, lon } = data[0];
        const newCenter = [parseFloat(lat), parseFloat(lon)];
        setMapCenter(newCenter);
        setPosition(newCenter);
        setZoomLevel(16); // Zoom in for area-level
        mapRef.current.flyTo(newCenter, 16);
        
        const reverseResponse = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18`
        );
        const reverseData = await reverseResponse.json();
        setAddress(reverseData.display_name);
      }
    } catch (error) {
      console.error("Area search error:", error);
    }
  };

  // Handle precise house selection
  const handleMapClick = async (e) => {
    const { lat, lng } = e.latlng;
    setPosition([lat, lng]);
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18`
      );
      const data = await response.json();
      setAddress(data.display_name || "Exact location");
    } catch (error) {
      console.error("Geocoding error:", error);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      {/* City Search */}
      <div style={{ marginBottom: '15px', display: 'flex' }}>
        <input
          type="text"
          value={cityQuery}
          onChange={(e) => setCityQuery(e.target.value)}
          placeholder="Search city (e.g., Bhopal)"
          style={{
            padding: '10px',
            flex: '1',
            marginRight: '10px',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}
          onKeyPress={(e) => e.key === 'Enter' && searchCity()}
        />
        <button
          onClick={searchCity}
          style={{
            padding: '10px 20px',
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Search City
        </button>
      </div>

      {/* Area Search (only shown after city search) */}
      {cityQuery && (
        <div style={{ marginBottom: '15px', display: 'flex' }}>
          <input
            type="text"
            value={areaQuery}
            onChange={(e) => setAreaQuery(e.target.value)}
            placeholder={`Search area in ${cityQuery} (e.g., Arera Colony)`}
            style={{
              padding: '10px',
              flex: '1',
              marginRight: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
            onKeyPress={(e) => e.key === 'Enter' && searchArea()}
          />
          <button
            onClick={searchArea}
            style={{
              padding: '10px 20px',
              background: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Search Area
          </button>
        </div>
      )}

      {/* Map Container */}
      <div style={{ height: '500px', width: '100%', position: 'relative', marginBottom: '20px' }}>
        <MapContainer
          center={mapCenter}
          zoom={zoomLevel}
          style={{ height: '100%', width: '100%', borderRadius: '8px' }}
          ref={mapRef}
          onClick={handleMapClick}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          
          {position && (
            <Marker
              position={position}
              ref={markerRef}
              icon={DefaultIcon}
              draggable={true}
              eventHandlers={{
                dragend: () => {
                  const marker = markerRef.current;
                  if (marker) {
                    const newPos = marker.getLatLng();
                    setPosition([newPos.lat, newPos.lng]);
                  }
                }
              }}
            >
              <Popup>
                {address || "Selected location"}
                <br />
                Lat: {position[0].toFixed(6)}, Lng: {position[1].toFixed(6)}
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {/* Location Details */}
      {position && (
        <div style={{
          padding: '15px',
          background: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #eee'
        }}>
          <h3 style={{ marginTop: 0, color: 'black' }}>Selected Location</h3>
          <p style={{ color: 'black' }}><strong>Coordinates:</strong> {position[0].toFixed(6)}, {position[1].toFixed(6)}</p>
          <p style={{ color: 'black' }}><strong>Full Address:</strong> {address || "Not available"}</p>
        </div>
      )}
    </div>
  );
};

export default CityAreaHousePicker;