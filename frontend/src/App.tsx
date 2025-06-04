import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  TextField,
  Button,
  Slider,
  Divider,
  Tabs,
  Tab,
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import StopsMap from './components/StopsMap';
import StopsList from './components/StopsList';
import ArrivalsList from './components/ArrivalsList';
import LocationSettings from './components/LocationSettings';

// Constants
const DEFAULT_LOCATION: [number, number] = [41.8781, -87.6298]; // Chicago coordinates

interface Stop {
  stop_id: number;
  stop_name: string;
  latitude: number;
  longitude: number;
  routes: string[];
  distance: number;
  related_stop_ids?: number[];
}

interface Arrival {
  route: string;
  destination: string;
  arrival_time: string;
  minutes: number;
  is_delayed: boolean;
  route_color?: string;
}

interface StopsResponse {
  train_stops: Stop[];
  bus_stops: Stop[];
}

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function App() {
  const [location, setLocation] = useState<[number, number]>(DEFAULT_LOCATION);
  const [loading, setLoading] = useState(false);
  const [stops, setStops] = useState<StopsResponse>({ train_stops: [], bus_stops: [] });
  const [monitoredStops, setMonitoredStops] = useState<Stop[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);  // Default to arrivals view
  const [searchRadius, setSearchRadius] = useState(0.5);

  // Load monitored stops from backend on mount
  useEffect(() => {
    const loadMonitoredStops = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/monitored-stops');
        if (response.ok) {
          const data = await response.json();
          setMonitoredStops(data);
          // Set tab value based on whether we have monitored stops
          setTabValue(data.length > 0 ? 0 : 1);
        }
      } catch (err) {
        console.error('Error loading monitored stops:', err);
      }
    };
    loadMonitoredStops();
  }, []);

  const handleLocationUpdate = (lat: number, lon: number, radius: number) => {
    setLocation([lat, lon]);
    setSearchRadius(radius);
    fetchNearbyStops(lat, lon, radius);
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation: [number, number] = [
          position.coords.latitude,
          position.coords.longitude
        ];
        setLocation(newLocation);
        fetchNearbyStops(newLocation[0], newLocation[1], searchRadius);
      },
      (error) => {
        setError('Error getting location: ' + error.message);
        setLoading(false);
      }
    );
  };

  const fetchNearbyStops = async (lat: number, lon: number, radius: number) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/api/stops?lat=${lat}&lon=${lon}&radius=${radius}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setStops(data);
      setError(null);
    } catch (err) {
      setError('Error fetching stops: ' + (err as Error).message);
      setStops({ train_stops: [], bus_stops: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleStopSelect = (stop: Stop) => {
    setMonitoredStops(prev => {
      // Check if the stop or any of its related stops are already monitored
      const isStopMonitored = prev.some(s => 
        s.stop_id === stop.stop_id || 
        stop.related_stop_ids?.includes(s.stop_id) ||
        s.related_stop_ids?.includes(stop.stop_id)
      );

      if (!isStopMonitored) {
        const newStops = [...prev, stop];
        // Save to backend
        fetch('http://localhost:8000/api/monitored-stops', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newStops),
        }).catch(err => console.error('Error saving monitored stops:', err));
        return newStops;
      }
      return prev;
    });
  };

  const handleStopRemove = (stopId: number) => {
    setMonitoredStops(prev => {
      const newStops = prev.filter(s => s.stop_id !== stopId);
      // Save to backend
      fetch('http://localhost:8000/api/monitored-stops', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newStops),
      }).catch(err => console.error('Error saving monitored stops:', err));
      return newStops;
    });
  };

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          CTA Transit Tracker
        </Typography>

        {error && (
          <Paper sx={{ p: 2, mb: 2, bgcolor: '#ffebee' }}>
            <Typography color="error">{error}</Typography>
          </Paper>
        )}

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab label="Arrival Times" />
            <Tab label="Find Stops" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {monitoredStops.length > 0 ? (
            <Grid container spacing={2}>
              {monitoredStops.map((stop) => (
                <Grid item xs={12} key={stop.stop_id}>
                  <Box sx={{ position: 'relative' }}>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => handleStopRemove(stop.stop_id)}
                      sx={{ position: 'absolute', right: 8, top: 8, zIndex: 1 }}
                    >
                      Remove
                    </Button>
                    <ArrivalsList stop={stop} />
                  </Box>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Typography variant="h6" gutterBottom>
                No stops monitored
              </Typography>
              <Button
                variant="contained"
                onClick={() => setTabValue(1)}
                sx={{ mt: 2 }}
              >
                Find Stops
              </Button>
            </Box>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <LocationSettings
            onLocationUpdate={handleLocationUpdate}
            loading={loading}
            onUseCurrentLocation={getLocation}
          />
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 2, mb: 2 }}>
                <StopsMap
                  trainStops={stops.train_stops}
                  busStops={stops.bus_stops}
                  center={location}
                  onStopSelect={handleStopSelect}
                />
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <StopsList
                trainStops={stops.train_stops}
                busStops={stops.bus_stops}
                onStopSelect={handleStopSelect}
                monitoredStops={monitoredStops}
              />
            </Grid>
          </Grid>
        </TabPanel>
      </Container>
    </ThemeProvider>
  );
}

export default App; 