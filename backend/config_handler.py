import json
from pathlib import Path
from typing import List, Dict

CONFIG_DIR = Path("config")
CONFIG_DIR.mkdir(exist_ok=True)
MONITORED_STOPS_FILE = CONFIG_DIR / "monitored_stops.json"

def save_monitored_stops(stops: List[Dict]) -> None:
    """Save the list of monitored stops to a config file"""
    with open(MONITORED_STOPS_FILE, 'w') as f:
        json.dump(stops, f, indent=2)

def load_monitored_stops() -> List[Dict]:
    """Load the list of monitored stops from the config file"""
    if not MONITORED_STOPS_FILE.exists():
        return []
    
    try:
        with open(MONITORED_STOPS_FILE, 'r') as f:
            return json.load(f)
    except:
        return [] 