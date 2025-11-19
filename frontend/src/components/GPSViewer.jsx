import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FaMapMarkerAlt, FaExpand } from 'react-icons/fa';

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const GPSViewer = ({
  latitude,
  longitude,
  accuracy = 10,
  label = '',
  height = '300px',
  showControls = true
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);

  useEffect(() => {
    // Don't initialize if coordinates are invalid
    if (!latitude || !longitude) return;

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) return;

    // Initialize map if it doesn't exist
    if (!mapInstanceRef.current && mapRef.current) {
      mapInstanceRef.current = L.map(mapRef.current, {
        zoomControl: showControls,
        attributionControl: true,
      }).setView([lat, lng], 15);

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(mapInstanceRef.current);
    }

    // Update marker position
    if (mapInstanceRef.current) {
      // Remove existing marker and circle
      if (markerRef.current) {
        mapInstanceRef.current.removeLayer(markerRef.current);
      }
      if (circleRef.current) {
        mapInstanceRef.current.removeLayer(circleRef.current);
      }

      // Add new marker
      markerRef.current = L.marker([lat, lng])
        .addTo(mapInstanceRef.current)
        .bindPopup(
          label ||
          `<div class="text-center">
            <strong>GPS Location</strong><br/>
            Lat: ${lat.toFixed(6)}<br/>
            Lng: ${lng.toFixed(6)}<br/>
            Accuracy: ${accuracy}m
          </div>`
        );

      // Add accuracy circle
      if (accuracy && accuracy > 0) {
        circleRef.current = L.circle([lat, lng], {
          color: '#8b5cf6',
          fillColor: '#8b5cf6',
          fillOpacity: 0.1,
          radius: parseFloat(accuracy),
        }).addTo(mapInstanceRef.current);
      }

      // Center map on marker
      mapInstanceRef.current.setView([lat, lng], 15);
    }

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        // Don't destroy the map on coordinate updates, only on unmount
      }
    };
  }, [latitude, longitude, accuracy, label, showControls]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const handleFullscreen = () => {
    if (mapRef.current) {
      if (mapRef.current.requestFullscreen) {
        mapRef.current.requestFullscreen();
      } else if (mapRef.current.webkitRequestFullscreen) {
        mapRef.current.webkitRequestFullscreen();
      } else if (mapRef.current.msRequestFullscreen) {
        mapRef.current.msRequestFullscreen();
      }
    }
  };

  const openInGoogleMaps = () => {
    const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
    window.open(url, '_blank');
  };

  if (!latitude || !longitude) {
    return (
      <div
        className="bg-gray-100 rounded-lg flex items-center justify-center text-gray-500"
        style={{ height }}
      >
        <div className="text-center">
          <FaMapMarkerAlt className="text-4xl mx-auto mb-2 opacity-50" />
          <div>No GPS coordinates available</div>
        </div>
      </div>
    );
  }

  return (
    <div className="gps-viewer-container relative">
      <div
        ref={mapRef}
        className="rounded-lg shadow-lg overflow-hidden border border-gray-200"
        style={{ height, width: '100%' }}
      />

      {showControls && (
        <div className="absolute top-2 right-2 z-[1000] flex gap-2">
          <button
            onClick={handleFullscreen}
            className="bg-white p-2 rounded-lg shadow-lg hover:bg-gray-100 transition-colors"
            title="Fullscreen"
          >
            <FaExpand className="text-gray-700" />
          </button>
          <button
            onClick={openInGoogleMaps}
            className="bg-white px-3 py-2 rounded-lg shadow-lg hover:bg-gray-100 transition-colors text-sm font-medium text-gray-700"
            title="Open in Google Maps"
          >
            Google Maps
          </button>
        </div>
      )}

      <div className="mt-2 text-sm text-gray-600 flex items-center justify-between">
        <div>
          <strong>Coordinates:</strong> {parseFloat(latitude).toFixed(6)}, {parseFloat(longitude).toFixed(6)}
        </div>
        {accuracy && (
          <div className="text-xs">
            Accuracy: ±{accuracy}m
          </div>
        )}
      </div>
    </div>
  );
};

export default GPSViewer;
