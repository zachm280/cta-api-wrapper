from fastapi import FastAPI, WebSocket, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import json
from typing import List, Optional, Dict
from pydantic import BaseModel
import requests
import xml.etree.ElementTree as ET
from datetime import datetime
from config import settings
import math
from data_loader import get_nearby_stops
from config_handler import save_monitored_stops, load_monitored_stops

app = FastAPI()

# Enable CORS for development
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",  # Vite default port
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

class Stop(BaseModel):
    stop_id: int
    stop_name: str
    latitude: float
    longitude: float
    routes: List[str]
    distance: Optional[float]

class Arrival(BaseModel):
    route: str
    destination: str
    arrival_time: str
    minutes: int
    is_delayed: bool
    route_color: Optional[str] = None

class StopsResponse(BaseModel):
    train_stops: List[Stop]
    bus_stops: List[Stop]

def get_train_arrivals(stop_id: int) -> List[Dict]:
    url = f"http://lapi.transitchicago.com/api/1.0/ttarrivals.aspx"
    params = {
        "key": settings.TRAIN_API_KEY,
        "mapid": stop_id,
        "outputType": "JSON"
    }
    
    try:
        response = requests.get(url, params=params)
        data = response.json()
        
        arrivals = []
        if "ctatt" in data and "eta" in data["ctatt"]:
            for eta in data["ctatt"]["eta"]:
                arrival_time = datetime.strptime(eta["arrT"], "%Y-%m-%dT%H:%M:%S")
                minutes = int((arrival_time - datetime.now()).total_seconds() / 60)
                
                # Map route colors
                route_colors = {
                    "Red": "#c60c30",
                    "Blue": "#00a1de",
                    "Brown": "#62361b",
                    "Green": "#009b3a",
                    "Orange": "#f9461c",
                    "Pink": "#e27ea6",
                    "Purple": "#522398",
                    "Yellow": "#f9e300"
                }
                
                arrivals.append({
                    "route": eta["rt"],
                    "destination": eta["destNm"],
                    "arrival_time": eta["arrT"],
                    "minutes": minutes,
                    "is_delayed": eta["isDly"] == "1",
                    "route_color": route_colors.get(eta["rt"])
                })
        return arrivals
    except Exception as e:
        print(f"Error getting train arrivals: {str(e)}")
        return []

def get_bus_arrivals(stop_id: int, related_stop_ids: List[int] = None) -> List[Dict]:
    """Get bus arrivals for a stop and its related stops (opposite direction)"""
    url = "http://www.ctabustracker.com/bustime/api/v2/getpredictions"
    
    # Combine the main stop ID with related stop IDs
    all_stop_ids = [stop_id]
    if related_stop_ids:
        all_stop_ids.extend(related_stop_ids)
    
    # Convert stop IDs to comma-separated string
    stop_ids_str = ','.join(map(str, all_stop_ids))
    
    params = {
        "key": settings.BUS_API_KEY,
        "stpid": stop_ids_str,
        "format": "json"
    }
    
    try:
        response = requests.get(url, params=params)
        data = response.json()
        
        arrivals = []
        if "bustime-response" in data and "prd" in data["bustime-response"]:
            for prediction in data["bustime-response"]["prd"]:
                arrival_time = datetime.strptime(prediction["prdtm"], "%Y%m%d %H:%M")
                minutes = int((arrival_time - datetime.now()).total_seconds() / 60)
                
                arrivals.append({
                    "route": prediction["rt"],
                    "destination": prediction["des"],
                    "arrival_time": prediction["prdtm"],
                    "minutes": minutes,
                    "is_delayed": False,  # Bus API doesn't provide delay information
                    "stop_id": int(prediction["stpid"])  # Include the specific stop ID
                })
        
        # Sort arrivals by time
        arrivals.sort(key=lambda x: x["minutes"])
        return arrivals
    except Exception as e:
        print(f"Error getting bus arrivals: {str(e)}")
        return []

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two points in miles using Haversine formula"""
    R = 3959.87433  # Earth's radius in miles

    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1

    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    return R * c

@app.get("/api/stops", response_model=StopsResponse)
async def get_stops(lat: float, lon: float, radius: float = 0.5) -> Dict[str, List[Stop]]:
    """Get stops within radius miles of the given coordinates"""
    try:
        stops_data = get_nearby_stops(lat, lon, radius)
        return {
            'train_stops': [Stop(**stop) for stop in stops_data['train_stops']],
            'bus_stops': [Stop(**stop) for stop in stops_data['bus_stops']]
        }
    except Exception as e:
        print(f"Error in get_stops: {str(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/monitored-stops")
async def save_stops(stops: List[Stop]):
    """Save the list of monitored stops"""
    try:
        save_monitored_stops([stop.dict() for stop in stops])
        return {"message": "Stops saved successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/monitored-stops")
async def get_monitored_stops():
    """Get the list of monitored stops"""
    try:
        stops = load_monitored_stops()
        return stops
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/arrivals/{stop_id}")
async def get_arrivals(stop_id: int, related_stop_ids: str = None):
    """Get arrivals for a specific stop and its related stops"""
    try:
        # Convert related_stop_ids from string to list if provided
        related_ids = json.loads(related_stop_ids) if related_stop_ids else None
        
        # Try train arrivals first
        if stop_id >= 40000:  # Train stop IDs are 40000+
            arrivals = get_train_arrivals(stop_id)
        else:  # Bus stop
            arrivals = get_bus_arrivals(stop_id, related_ids)
        return arrivals
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            # Receive stop IDs to monitor
            stops = await websocket.receive_json()
            
            # Get arrivals for all stops
            all_arrivals = {}
            for stop_id in stops:
                arrivals = await get_arrivals(stop_id)
                all_arrivals[stop_id] = arrivals
                
            # Send updates
            await websocket.send_json(all_arrivals)
            
            # Wait for the update interval
            await asyncio.sleep(settings.UPDATE_INTERVAL)
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        await websocket.close() 