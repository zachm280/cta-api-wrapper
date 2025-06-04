import pandas as pd
import urllib.request
from io import StringIO
import os
from datetime import datetime, timedelta
import json
from typing import Dict, List, Optional
from pathlib import Path

# Create cache directory if it doesn't exist
CACHE_DIR = Path("cache")
CACHE_DIR.mkdir(exist_ok=True)

DATA_DIR = Path("data")
DATA_DIR.mkdir(exist_ok=True)

STOPS_CACHE_FILE = CACHE_DIR / "stops.json"
STOPS_DATA_FILE = DATA_DIR / "CTA_STOP_XFERS.csv"
CACHE_DURATION = timedelta(days=1)  # Update stops data daily

def load_stops_data() -> pd.DataFrame:
    """Load stops data from cache or download from CTA website"""
    try:
        # Check if we have recent cached data
        if STOPS_CACHE_FILE.exists():
            with open(STOPS_CACHE_FILE, 'r') as f:
                cache_data = json.load(f)
                cache_timestamp = datetime.fromisoformat(cache_data['timestamp'])
                if datetime.now() - cache_timestamp < CACHE_DURATION:
                    df = pd.DataFrame(cache_data['stops'])
                    # Classify stop types and add parent stop ID for trains
                    df = classify_stops(df)
                    return df
        
        # If no cache or expired, download fresh data
        url = "https://www.transitchicago.com/downloads/sch_data/CTA_STOP_XFERS.txt"
        headers = [
            'route_id',
            'route_code',
            'stop_name',
            'stop_id',
            'stop_lat',
            'stop_lon',
            'heading_degrees',
            'transfer_to_route_id'  # We'll ignore this column
        ]
        
        # Define dtypes for pandas read_csv
        dtypes = {
            'route_id': str,
            'route_code': str,
            'stop_name': str,
            'stop_id': int,
            'stop_lat': float,
            'stop_lon': float,
            'heading_degrees': float,
            'transfer_to_route_id': str  # Keep as string but won't use it
        }
        
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            data = response.read().decode('utf-8')
        
        # Parse the data with specified dtypes
        df = pd.read_csv(StringIO(data), header=None, dtype=dtypes)
        df.columns = headers
        
        # Classify stops and add parent stop ID for trains
        df = classify_stops(df)
        
        # Save to CSV for backup
        df.to_csv(STOPS_DATA_FILE, index=False)
        
        # Cache the data
        cache_data = {
            'timestamp': datetime.now().isoformat(),
            'stops': df.to_dict('records')
        }
        with open(STOPS_CACHE_FILE, 'w') as f:
            json.dump(cache_data, f)
        
        return df
    except Exception as e:
        print(f"Error loading stops data: {str(e)}")
        # If download fails and we have the CSV, use it as fallback
        if STOPS_DATA_FILE.exists():
            df = pd.read_csv(STOPS_DATA_FILE)
            df = classify_stops(df)
            return df
        raise e

def classify_stops(df: pd.DataFrame) -> pd.DataFrame:
    """Classify stops and add parent stop ID for trains"""
    # Classify basic stop types
    df['stop_type'] = df['stop_id'].apply(
        lambda x: 'bus' if x < 30000 
        else 'train' if x < 40000 
        else 'parent_train' if x < 50000 
        else 'unknown'
    )
    
    # For train stops, calculate parent stop ID (40000 + child stop ID - 30000)
    df['parent_stop_id'] = df.apply(
        lambda row: (40000 + (row['stop_id'] - 30000)) if row['stop_type'] == 'train'
        else row['stop_id'],
        axis=1
    )
    
    # Add route information based on route_id and route_code
    df['route'] = df['route_id']
    
    return df

def get_nearby_stops(lat: float, lon: float, radius: float = 0.5) -> Dict[str, List[Dict]]:
    """Get stops within radius miles of the given coordinates, grouped by transit type"""
    from main import calculate_distance  # Import here to avoid circular import
    
    df = load_stops_data()
    
    # Calculate distances and filter
    df['distance'] = df.apply(
        lambda row: calculate_distance(lat, lon, row['stop_lat'], row['stop_lon']),
        axis=1
    )
    
    nearby_stops = df[df['distance'] <= radius].copy()
    
    # Convert to dictionary format
    def prepare_stop_data(stop, related_stop_ids=None):
        return {
            'stop_id': int(stop['parent_stop_id'] if pd.notna(stop['parent_stop_id']) else stop['stop_id']),
            'stop_name': stop['stop_name'],
            'latitude': float(stop['stop_lat']),
            'longitude': float(stop['stop_lon']),
            'routes': [stop['route']],
            'distance': float(stop['distance']),
            'related_stop_ids': related_stop_ids or []  # Include IDs of related stops (opposite direction)
        }
    
    # Get train stops (use only parent train stops)
    train_stops = [
        prepare_stop_data(stop) 
        for _, stop in nearby_stops[nearby_stops['stop_type'] == 'parent_train'].iterrows()
    ]
    
    # Consolidate bus stops with the same name and route
    bus_stops_df = nearby_stops[nearby_stops['stop_type'] == 'bus'].copy()
    consolidated_bus_stops = []
    
    # Group by stop name and route to find pairs of stops (opposite directions)
    for (name, route), group in bus_stops_df.groupby(['stop_name', 'route']):
        if len(group) > 0:
            # Use the stop with minimum distance as the primary stop
            primary_stop = group.loc[group['distance'].idxmin()]
            # Get all stop IDs for this name/route combination
            related_ids = group['stop_id'].tolist()
            # Remove the primary stop ID from related IDs
            related_ids.remove(primary_stop['stop_id'])
            
            consolidated_stop = primary_stop.copy()
            consolidated_stop['related_stop_ids'] = related_ids
            consolidated_bus_stops.append(prepare_stop_data(
                consolidated_stop,
                related_stop_ids=related_ids
            ))
    
    # Sort each list by distance
    train_stops.sort(key=lambda x: x['distance'])
    consolidated_bus_stops.sort(key=lambda x: x['distance'])
    
    return {
        'train_stops': train_stops,
        'bus_stops': consolidated_bus_stops
    } 