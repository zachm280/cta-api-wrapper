import React, { useEffect, useState } from 'react';
import {
  Paper,
  Typography,
  List,
  ListItem,
  Box,
  Chip,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';

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
  stop_id: number;
}

interface ArrivalsListProps {
  stop: Stop;
}

const ArrivalsList: React.FC<ArrivalsListProps> = ({ stop }) => {
  const [arrivals, setArrivals] = useState<Arrival[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchArrivals = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Include related stop IDs in the query if they exist
      const relatedStopsParam = stop.related_stop_ids?.length 
        ? `&related_stop_ids=${JSON.stringify(stop.related_stop_ids)}`
        : '';
      
      const response = await fetch(
        `http://localhost:8000/api/arrivals/${stop.stop_id}${relatedStopsParam}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setArrivals(data);
    } catch (err) {
      setError(`Error fetching arrivals: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArrivals();
    const interval = setInterval(fetchArrivals, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [stop.stop_id, JSON.stringify(stop.related_stop_ids)]);

  if (loading && arrivals.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  // Group arrivals by destination
  const arrivalsByDestination = arrivals.reduce((acc, arrival) => {
    const key = arrival.destination;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(arrival);
    return acc;
  }, {} as Record<string, Arrival[]>);

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        {stop.stop_name}
      </Typography>
      <List>
        {Object.entries(arrivalsByDestination).length > 0 ? (
          Object.entries(arrivalsByDestination).map(([destination, destinationArrivals]) => (
            <React.Fragment key={destination}>
              <ListItem>
                <Box sx={{ width: '100%' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                    To {destination}
                  </Typography>
                  {destinationArrivals.map((arrival, index) => (
                    <Box 
                      key={`${arrival.route}-${arrival.arrival_time}-${index}`}
                      sx={{ mb: index < destinationArrivals.length - 1 ? 2 : 0 }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Chip
                          label={arrival.route}
                          size="small"
                          sx={{
                            mr: 1,
                            bgcolor: arrival.route_color || '#666',
                            color: 'white',
                          }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          Arriving in {arrival.minutes} minutes
                        </Typography>
                        {arrival.is_delayed && (
                          <Chip
                            label="Delayed"
                            size="small"
                            color="error"
                            variant="outlined"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Box>
                    </Box>
                  ))}
                </Box>
              </ListItem>
              {Object.keys(arrivalsByDestination).length > 1 && (
                <Divider sx={{ my: 1 }} />
              )}
            </React.Fragment>
          ))
        ) : (
          <ListItem>
            <Typography color="text.secondary">
              No upcoming arrivals
            </Typography>
          </ListItem>
        )}
      </List>
    </Paper>
  );
};

export default ArrivalsList; 