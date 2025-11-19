import { useState } from 'react';
import { FaMapMarkerAlt, FaCompass, FaCrosshairs } from 'react-icons/fa';

const GPSInput = ({ value, onChange, label = "GPS Coordinates", showAccuracy = true }) => {
  const [gpsData, setGpsData] = useState(
    value || {
      latitude: '',
      longitude: '',
      accuracy: 10,
    }
  );

  const [gettingLocation, setGettingLocation] = useState(false);

  const handleChange = (field, val) => {
    const updated = { ...gpsData, [field]: val };
    setGpsData(updated);
    onChange(updated);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const updated = {
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
          accuracy: Math.round(position.coords.accuracy),
        };
        setGpsData(updated);
        onChange(updated);
        setGettingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Unable to get current location. Please enter coordinates manually.');
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const isValidCoordinate = () => {
    const lat = parseFloat(gpsData.latitude);
    const lng = parseFloat(gpsData.longitude);
    return (
      !isNaN(lat) &&
      !isNaN(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    );
  };

  return (
    <div className="gps-input-container">
      <div className="flex items-center justify-between mb-4">
        <label className="form-label-modern flex items-center gap-2">
          <FaMapMarkerAlt className="text-purple-600" />
          {label}
        </label>
        <button
          type="button"
          onClick={getCurrentLocation}
          disabled={gettingLocation}
          className="btn-modern btn-outline-modern text-sm px-3 py-1 flex items-center gap-2"
        >
          <FaCrosshairs className={gettingLocation ? 'animate-spin' : ''} />
          {gettingLocation ? 'Getting Location...' : 'Use Current Location'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Latitude Input */}
        <div>
          <label className="text-sm text-gray-600 mb-1 block">
            Latitude <span className="text-gray-400">(-90 to 90)</span>
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.000001"
              min="-90"
              max="90"
              value={gpsData.latitude}
              onChange={(e) => handleChange('latitude', e.target.value)}
              placeholder="37.7749"
              className="input-modern w-full"
            />
            <FaCompass className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {/* Longitude Input */}
        <div>
          <label className="text-sm text-gray-600 mb-1 block">
            Longitude <span className="text-gray-400">(-180 to 180)</span>
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.000001"
              min="-180"
              max="180"
              value={gpsData.longitude}
              onChange={(e) => handleChange('longitude', e.target.value)}
              placeholder="-122.4194"
              className="input-modern w-full"
            />
            <FaCompass className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {/* Accuracy Input */}
        {showAccuracy && (
          <div className="md:col-span-2">
            <label className="text-sm text-gray-600 mb-1 block">
              GPS Accuracy <span className="text-gray-400">(meters)</span>
            </label>
            <input
              type="number"
              min="1"
              max="1000"
              value={gpsData.accuracy}
              onChange={(e) => handleChange('accuracy', parseInt(e.target.value) || 10)}
              placeholder="10"
              className="input-modern w-full"
            />
            <div className="text-xs text-gray-500 mt-1">
              Current accuracy: {gpsData.accuracy} meters
            </div>
          </div>
        )}
      </div>

      {/* Validation Indicator */}
      <div className="mt-3">
        {gpsData.latitude && gpsData.longitude && (
          <div
            className={`text-sm p-2 rounded-lg ${
              isValidCoordinate()
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {isValidCoordinate() ? (
              <>
                ✓ Valid coordinates: {gpsData.latitude}, {gpsData.longitude}
              </>
            ) : (
              <>⚠ Invalid coordinates. Please check the values.</>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GPSInput;
