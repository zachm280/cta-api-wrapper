import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';

interface Stop {
  stop_id: number;
  stop_name: string;
  latitude: number;
  longitude: number;
  routes: string[];
  distance: number;
  related_stop_ids?: number[];
}

interface StopsMapProps {
  trainStops?: Stop[];
  busStops?: Stop[];
  center: [number, number];
  onStopSelect: (stop: Stop) => void;
}

// Create custom icons for train and bus stops
const trainIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const busIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Fix default icon
L.Marker.prototype.options.icon = new L.Icon({
  iconUrl: icon,
  iconRetinaUrl: iconRetina,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}

// Helper function to find related stops
const findRelatedStops = (stop: Stop, allStops: Stop[]): Stop[] => {
  if (!stop.routes || stop.routes.length === 0) return [stop];

  return allStops.filter(s => 
    s.stop_name === stop.stop_name && 
    s.routes.some(r => stop.routes.includes(r))
  );
};

const StopsMap: React.FC<StopsMapProps> = ({ trainStops = [], busStops = [], center, onStopSelect }) => {
  // Clean up map instance on unmount
  useEffect(() => {
    return () => {
      // Remove all map instances when component unmounts
      const containers = document.querySelectorAll('.leaflet-container');
      containers.forEach(container => {
        // @ts-ignore
        if (container._leaflet_id) {
          // @ts-ignore
          container._leaflet = null;
          // @ts-ignore
          container._leaflet_id = null;
        }
      });
    };
  }, []);

  const handleStopSelect = (stop: Stop) => {
    // Find all related stops
    const allStops = [...trainStops, ...busStops];
    const relatedStops = findRelatedStops(stop, allStops);
    
    // Add related stop IDs to the selected stop
    const selectedStop = {
      ...stop,
      related_stop_ids: relatedStops
        .filter(s => s.stop_id !== stop.stop_id)
        .map(s => s.stop_id)
    };
    
    onStopSelect(selectedStop);
  };

  return (
    <div style={{ height: '500px', width: '100%', borderRadius: '8px', position: 'relative' }}>
      <MapContainer 
        center={center} 
        zoom={15} 
        style={{ height: '100%', width: '100%' }}
      >
        <ChangeView center={center} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Render train stops */}
        {trainStops.map((stop) => (
          <Marker
            key={`train-${stop.stop_id}`}
            position={[stop.latitude, stop.longitude]}
            icon={trainIcon}
            eventHandlers={{
              click: () => handleStopSelect(stop)
            }}
          >
            <Popup>
              <div>
                <h3>{stop.stop_name}</h3>
                <p>Routes: {stop.routes.join(', ')}</p>
                <p>Distance: {stop.distance.toFixed(2)} miles</p>
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    handleStopSelect(stop);
                  }}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#1976d2',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Add to Monitoring
                </button>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Render bus stops */}
        {busStops.map((stop) => (
          <Marker
            key={`bus-${stop.stop_id}`}
            position={[stop.latitude, stop.longitude]}
            icon={busIcon}
            eventHandlers={{
              click: () => handleStopSelect(stop)
            }}
          >
            <Popup>
              <div>
                <h3>{stop.stop_name}</h3>
                <p>Routes: {stop.routes.join(', ')}</p>
                <p>Distance: {stop.distance.toFixed(2)} miles</p>
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    handleStopSelect(stop);
                  }}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#1976d2',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Add to Monitoring
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default StopsMap; 