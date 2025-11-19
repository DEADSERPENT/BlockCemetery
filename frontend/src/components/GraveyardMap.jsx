import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import axios from 'axios';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const GraveyardMap = ({ graveyardId, graves, onGraveSelect }) => {
  const [geoData, setGeoData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMapData();
  }, [graveyardId]);

  const fetchMapData = async () => {
    try {
      const response = await axios.get(`/api/graveyards/${graveyardId}/map`);
      setGeoData(response.data);
    } catch (error) {
      console.error('Error fetching map data:', error);
      // Use fallback data if API fails
      setGeoData(createFallbackGeoJSON(graves));
    } finally {
      setLoading(false);
    }
  };

  const createFallbackGeoJSON = (gravesData) => {
    // Create a simple grid layout as fallback
    const features = gravesData.map((grave, index) => {
      const row = Math.floor(index / 10);
      const col = index % 10;
      const basePoint = [51.505, -0.09];

      return {
        type: 'Feature',
        properties: {
          graveId: grave.id,
          reserved: grave.reserved,
          maintained: grave.maintained,
          price: grave.price
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [basePoint[1] + col * 0.002, basePoint[0] + row * 0.002],
            [basePoint[1] + col * 0.002 + 0.0015, basePoint[0] + row * 0.002],
            [basePoint[1] + col * 0.002 + 0.0015, basePoint[0] + row * 0.002 + 0.0015],
            [basePoint[1] + col * 0.002, basePoint[0] + row * 0.002 + 0.0015],
            [basePoint[1] + col * 0.002, basePoint[0] + row * 0.002]
          ]]
        }
      };
    });

    return {
      type: 'FeatureCollection',
      features
    };
  };

  const getGraveColor = (properties) => {
    if (properties.maintained) return '#f59e0b'; // yellow/orange
    if (properties.reserved) return '#ef4444'; // red
    return '#10b981'; // green
  };

  const onEachFeature = (feature, layer) => {
    const graveId = feature.properties.graveId;
    const grave = graves.find(g => g.id === graveId.toString());

    if (grave) {
      layer.on({
        click: () => onGraveSelect(grave),
        mouseover: (e) => {
          e.target.setStyle({
            fillOpacity: 0.9,
            weight: 3
          });
        },
        mouseout: (e) => {
          e.target.setStyle({
            fillOpacity: 0.6,
            weight: 2
          });
        }
      });

      const status = grave.reserved ? 'Reserved' : 'Available';
      const maintained = grave.maintained ? ' (Maintained)' : '';
      layer.bindTooltip(
        `Grave #${grave.id}<br/>Status: ${status}${maintained}`,
        { permanent: false, direction: 'top' }
      );
    }
  };

  const geoJSONStyle = (feature) => ({
    fillColor: getGraveColor(feature.properties),
    weight: 2,
    opacity: 1,
    color: 'white',
    fillOpacity: 0.6
  });

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  if (!geoData || !geoData.features || geoData.features.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <p className="text-gray-600">No map data available</p>
      </div>
    );
  }

  // Calculate bounds from GeoJSON
  const bounds = L.geoJSON(geoData).getBounds();

  return (
    <MapContainer
      bounds={bounds}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <GeoJSON
        data={geoData}
        style={geoJSONStyle}
        onEachFeature={onEachFeature}
      />
    </MapContainer>
  );
};

export default GraveyardMap;
