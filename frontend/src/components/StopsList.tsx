import React from 'react';
import {
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Paper,
  Typography,
  Chip,
  Box,
  Divider,
} from '@mui/material';

interface Stop {
  stop_id: number;
  stop_name: string;
  latitude: number;
  longitude: number;
  routes: string[];
  distance: number;
}

interface StopsListProps {
  trainStops: Stop[];
  busStops: Stop[];
  onStopSelect: (stop: Stop) => void;
  monitoredStops: Stop[];
}

const StopsList: React.FC<StopsListProps> = ({
  trainStops,
  busStops,
  onStopSelect,
  monitoredStops,
}) => {
  const isStopMonitored = (stop: Stop) => {
    return monitoredStops.some(s => s.stop_id === stop.stop_id);
  };

  const renderStopItem = (stop: Stop, isTrainStop: boolean) => (
    <ListItem key={stop.stop_id}>
      <Box sx={{ mr: 2, fontSize: '1.5rem' }}>
        {isTrainStop ? '🚂' : '🚌'}
      </Box>
      <ListItemText
        primary={stop.stop_name}
        secondary={
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {stop.distance.toFixed(2)} miles away
            </Typography>
            <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {stop.routes.map((route) => (
                <Chip
                  key={route}
                  label={route}
                  size="small"
                  color={isTrainStop ? "primary" : "secondary"}
                  variant="outlined"
                />
              ))}
            </Box>
          </Box>
        }
      />
      <ListItemSecondaryAction>
        <IconButton
          edge="end"
          onClick={() => onStopSelect(stop)}
          disabled={isStopMonitored(stop)}
          color={isStopMonitored(stop) ? "default" : "primary"}
          sx={{ fontSize: '1.5rem' }}
        >
          {isStopMonitored(stop) ? '✓' : '+'}
        </IconButton>
      </ListItemSecondaryAction>
    </ListItem>
  );

  return (
    <Paper sx={{ maxHeight: 500, overflow: 'auto' }}>
      <List>
        {trainStops.length > 0 && (
          <>
            <ListItem>
              <Typography variant="h6" color="primary">
                Train Stops
              </Typography>
            </ListItem>
            {trainStops.map(stop => renderStopItem(stop, true))}
          </>
        )}
        
        {busStops.length > 0 && (
          <>
            <ListItem>
              <Typography variant="h6" color="secondary">
                Bus Stops
              </Typography>
            </ListItem>
            {busStops.map(stop => renderStopItem(stop, false))}
          </>
        )}
        
        {trainStops.length === 0 && busStops.length === 0 && (
          <ListItem>
            <Typography color="text.secondary">
              No stops found in the selected area
            </Typography>
          </ListItem>
        )}
      </List>
    </Paper>
  );
};

export default StopsList; 