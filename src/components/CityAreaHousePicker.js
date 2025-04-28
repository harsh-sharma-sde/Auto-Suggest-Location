import React, { useState, useRef, useEffect } from 'react';
import { GoogleMap, LoadScript, Autocomplete, Marker } from '@react-google-maps/api';

const libraries = ['places'];

const CityAreaHousePicker = ({ apiKey }) => {
  // State management
  const [cityQuery, setCityQuery] = useState('');
  const [areaQuery, setAreaQuery] = useState('');
  const [position, setPosition] = useState(null);
  const [address, setAddress] = useState('');
  const [zoom, setZoom] = useState(12);
  const [mapCenter, setMapCenter] = useState({ lat: 23.2599, lng: 77.4126 }); // Default: Bhopal

  // Refs
  const cityAutocompleteRef = useRef(null);
  const areaAutocompleteRef = useRef(null);
  const mapRef = useRef(null);
  const geocoder = useRef(null);

  // Initialize geocoder
  useEffect(() => {
    if (window.google) {
      geocoder.current = new window.google.maps.Geocoder();
    }
  }, []);

  // Handle city search selection
  const onCityPlaceChanged = () => {
    if (cityAutocompleteRef.current) {
      const place = cityAutocompleteRef.current.getPlace();
      if (place.geometry) {
        setMapCenter(place.geometry.location);
        setPosition(place.geometry.location);
        setZoom(12);
        setAddress(place.formatted_address);
        setAreaQuery(''); // Reset area search
      }
    }
  };

  // Handle area search selection
  const onAreaPlaceChanged = () => {
    if (areaAutocompleteRef.current && cityQuery) {
      const place = areaAutocompleteRef.current.getPlace();
      if (place.geometry) {
        setMapCenter(place.geometry.location);
        setPosition(place.geometry.location);
        setZoom(16);
        setAddress(place.formatted_address);
      }
    }
  };

  // Handle map click for precise location
  const handleMapClick = async (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    const newPosition = { lat, lng };
    
    setPosition(newPosition);
    
    // Reverse geocode to get address
    if (geocoder.current) {
      geocoder.current.geocode({ location: newPosition }, (results, status) => {
        if (status === 'OK' && results[0]) {
          setAddress(results[0].formatted_address);
        }
      });
    }
  };

  return (
    <LoadScript googleMapsApiKey={apiKey} libraries={libraries}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        {/* City Search */}
        <div style={{ marginBottom: '15px' }}>
          <Autocomplete
            onLoad={(autocomplete) => {
              cityAutocompleteRef.current = autocomplete;
              autocomplete.setFields(['address_components', 'geometry', 'formatted_address']);
            }}
            onPlaceChanged={onCityPlaceChanged}
            options={{
              types: ['(cities)'],
            }}
          >
            <input
              type="text"
              placeholder="Search city (e.g., Bhopal)"
              style={{
                padding: '10px',
                width: '100%',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
              value={cityQuery}
              onChange={(e) => setCityQuery(e.target.value)}
            />
          </Autocomplete>
        </div>

        {/* Area Search (only shown after city search) */}
        {cityQuery && (
          <div style={{ marginBottom: '15px' }}>
            <Autocomplete
              onLoad={(autocomplete) => {
                areaAutocompleteRef.current = autocomplete;
                autocomplete.setFields(['address_components', 'geometry', 'formatted_address']);
              }}
              onPlaceChanged={onAreaPlaceChanged}
              options={{
                types: ['establishment', 'neighborhood'],
                bounds: new window.google.maps.LatLngBounds(
                  new window.google.maps.LatLng(mapCenter.lat - 0.1, mapCenter.lng - 0.1),
                  new window.google.maps.LatLng(mapCenter.lat + 0.1, mapCenter.lng + 0.1)
                ),
              }}
            >
              <input
                type="text"
                placeholder={`Search area in ${cityQuery} (e.g., Arera Colony)`}
                style={{
                  padding: '10px',
                  width: '100%',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
                value={areaQuery}
                onChange={(e) => setAreaQuery(e.target.value)}
              />
            </Autocomplete>
          </div>
        )}

        {/* Map Container */}
        <div style={{ height: '500px', width: '100%', position: 'relative', marginBottom: '20px' }}>
          <GoogleMap
            mapContainerStyle={{ height: '100%', width: '100%', borderRadius: '8px' }}
            center={mapCenter}
            zoom={zoom}
            onClick={handleMapClick}
            onLoad={(map) => {
              mapRef.current = map;
            }}
            options={{
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
            }}
          >
            {position && (
              <Marker
                position={position}
                draggable={true}
                onDragEnd={(e) => {
                  const lat = e.latLng.lat();
                  const lng = e.latLng.lng();
                  setPosition({ lat, lng });
                  
                  // Update address when marker is dragged
                  if (geocoder.current) {
                    geocoder.current.geocode({ location: { lat, lng } }, (results, status) => {
                      if (status === 'OK' && results[0]) {
                        setAddress(results[0].formatted_address);
                      }
                    });
                  }
                }}
              />
            )}
          </GoogleMap>
        </div>

        {/* Location Details */}
        {position && (
          <div style={{
            padding: '15px',
            background: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #eee'
          }}>
            <h3 style={{ marginTop: 0 }}>Selected Location</h3>
            <p><strong>Coordinates:</strong> {position.lat.toFixed(6)}, {position.lng.toFixed(6)}</p>
            <p><strong>Full Address:</strong> {address || "Not available"}</p>
          </div>
        )}
      </div>
    </LoadScript>
  );
};

export default CityAreaHousePicker;