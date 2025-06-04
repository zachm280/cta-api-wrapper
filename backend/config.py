from pydantic_settings import BaseSettings
from dotenv import load_dotenv
import os
from pathlib import Path

load_dotenv()

# Create cache directory if it doesn't exist
CACHE_DIR = Path("cache")
CACHE_DIR.mkdir(exist_ok=True)

class Settings(BaseSettings):
    TRAIN_API_KEY: str = os.getenv("TRAIN_API_KEY", "")  # Get from environment variable
    BUS_API_KEY: str = os.getenv("BUS_API_KEY", "")      # Get from environment variable
    UPDATE_INTERVAL: int = int(os.getenv("UPDATE_INTERVAL", "30"))  # seconds
    
    # Cache settings
    CACHE_ENABLED: bool = os.getenv("CACHE_ENABLED", "true").lower() == "true"
    CACHE_DURATION: int = int(os.getenv("CACHE_DURATION", "3600"))  # 1 hour in seconds
    STOPS_CACHE_FILE: str = str(CACHE_DIR / "stops_cache.json")
    
    # Performance settings for Raspberry Pi
    MAX_CONCURRENT_STOPS: int = int(os.getenv("MAX_CONCURRENT_STOPS", "10"))
    RATE_LIMIT_CALLS: int = int(os.getenv("RATE_LIMIT_CALLS", "10"))  # API calls per minute
    
    class Config:
        env_file = ".env"

settings = Settings() 