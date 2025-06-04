import React, { useState } from 'react';
import {
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Box,
  CircularProgress,
  InputAdornment,
} from '@mui/material';

interface LocationSettingsProps {
  onLocationUpdate: (lat: number, lon: number, radius: number) => void;
  loading: boolean;
  onUseCurrentLocation: () => void;
}

const LocationSettings: React.FC<LocationSettingsProps> = ({
  onLocationUpdate,
  loading,
  onUseCurrentLocation,
}) => {
  const [latitude, setLatitude] = useState('41.8781');
  const [longitude, setLongitude] = useState('-87.6298');
  const [radius, setRadius] = useState('0.5');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const rad = parseFloat(radius);

    if (isNaN(lat) || isNaN(lon) || isNaN(rad)) {
      setError('Please enter valid numbers');
      return;
    }

    if (lat < -90 || lat > 90) {
      setError('Latitude must be between -90 and 90');
      return;
    }

    if (lon < -180 || lon > 180) {
      setError('Longitude must be between -180 and 180');
      return;
    }

    if (rad <= 0 || rad > 2) {
      setError('Radius must be between 0 and 2 miles');
      return;
    }

    setError(null);
    onLocationUpdate(lat, lon, rad);
  };

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        Location Settings
      </Typography>
      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Latitude"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              fullWidth
              type="number"
              inputProps={{ step: 'any' }}
              error={!!error && error.includes('Latitude')}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Longitude"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              fullWidth
              type="number"
              inputProps={{ step: 'any' }}
              error={!!error && error.includes('Longitude')}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Search Radius"
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
              fullWidth
              type="number"
              inputProps={{ step: '0.1', min: '0.1', max: '2' }}
              InputProps={{
                endAdornment: <InputAdornment position="end">miles</InputAdornment>,
              }}
              error={!!error && error.includes('Radius')}
            />
          </Grid>
          <Grid item xs={12}>
            {error && (
              <Typography color="error" variant="body2" sx={{ mb: 2 }}>
                {error}
              </Typography>
            )}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                type="submit"
                disabled={loading}
              >
                Search Area
              </Button>
              <Button
                variant="outlined"
                onClick={onUseCurrentLocation}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Use Current Location'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};

export default LocationSettings; 