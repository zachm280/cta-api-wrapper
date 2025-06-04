# CTA Transit Tracker

A real-time Chicago Transit Authority (CTA) train and bus tracker application that provides a modern, user-friendly interface for monitoring transit arrivals.

## Features

- 🗺️ Interactive map interface with color-coded markers for train and bus stops
- 🚍 Real-time arrival predictions for both trains and buses
- 🔄 Auto-refresh of arrival times every 30 seconds
- 📍 Location-based stop search with customizable radius
- 🔎 Intelligent stop grouping (shows both directions for bus stops)
- 💾 Persistent storage of monitored stops
- 📱 Responsive design that works on both desktop and mobile
- 🎨 Modern UI with Material Design components

## Prerequisites

- Python 3.8 or higher
- Node.js 14 or higher
- npm or yarn
- Git
- CTA API Keys (see [API Keys](#api-keys) section)

## Project Structure

```
cta-api-wrapper/
├── backend/
│   ├── main.py              # FastAPI backend server
│   ├── config.py            # API keys and settings
│   ├── data_loader.py       # CTA data handling
│   └── config_handler.py    # Stop monitoring persistence
├── frontend/
│   ├── src/
│   │   ├── App.tsx         # Main React application
│   │   └── components/     # React components
│   └── package.json        # Frontend dependencies
├── requirements.txt         # Python dependencies
└── README.md               # Documentation
```

## API Keys (Required)

Before setting up the project, you need to obtain API keys from the CTA:

1. Get your Train Tracker API key:
   - Visit https://www.transitchicago.com/developers/traintracker/
   - Fill out the request form
   - Save the key for configuration

2. Get your Bus Tracker API key:
   - Visit https://www.transitchicago.com/developers/bustracker/
   - Fill out the request form
   - Save the key for configuration

3. Create a `.env` file in the backend directory:
   ```env
   TRAIN_API_KEY=your_train_api_key
   BUS_API_KEY=your_bus_api_key
   ```

**Note:** The application will not work without valid API keys.

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/cta-api-wrapper.git
cd cta-api-wrapper
```

### 2. Backend Setup

```bash
# Create and activate a virtual environment
python -m venv venv

# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Configure your API keys in .env file (see API Keys section)

# Start the backend server
cd backend
uvicorn main:app --reload
```

The backend server will run at http://localhost:8000

### 3. Frontend Setup

In a new terminal:

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm start
```

The frontend application will run at http://localhost:3000

## Usage Guide

1. **Finding Stops**
   - Allow location access or manually enter coordinates
   - Adjust search radius (0.1 to 2 miles)
   - Click "Search Area" to find nearby stops

2. **Monitoring Stops**
   - Click on map markers or use the list view to select stops
   - For bus stops, both directions are automatically monitored
   - Selected stops appear in the "Arrival Times" tab

3. **Viewing Arrivals**
   - Switch to the "Arrival Times" tab to see predictions
   - Arrivals update automatically every 30 seconds
   - For bus stops, see arrivals in both directions
   - Color-coded indicators show route and delay status

4. **Managing Monitored Stops**
   - Click "Remove" to stop monitoring a stop
   - Your monitored stops persist between sessions
   - Switch between map and arrival views using tabs

## Development Notes

- The backend caches stop data to reduce API calls
- Stop monitoring data is stored in `config/monitored_stops.json`
- The frontend uses React with TypeScript for type safety
- Map functionality is provided by React Leaflet
- UI components use Material-UI (MUI)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests (if available)
5. Create a Pull Request

## Troubleshooting

- If the map doesn't load, check your internet connection
- If stops don't appear, verify your location settings
- If arrivals don't update, ensure the backend server is running
- For API errors, verify your API keys are correctly set in the .env file
- If you get authentication errors, make sure your API keys are valid

## License

This project is licensed under the MIT License - see the LICENSE file for details.
