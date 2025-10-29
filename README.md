# Stock Volatility Analysis Web App

A web application for analyzing stock volatility using GARCH models with data from Yahoo Finance. It uses a small Python service (yfinance + Flask) for reliable market data and a Node.js API for analytics.

## Features

- Fetch real-time stock data via Python yfinance service
- Calculate volatility with three models: GARCH(1,1), EWMA, Rolling
- GARCH diagnostics: coefficients (ω, α, β) with p‑values, log‑likelihood, AIC, BIC, observations
- Price‑change probabilities (t‑distribution) in brackets (e.g., −10%..−5%, …, +5%..+10%)
- Visualize stock prices and volatility over time
- Compare multiple stocks side-by-side
- Customizable date range selection
- Interactive charts with zoom and pan
- “Learn” page explaining GARCH, EWMA, Rolling with simple infographics

## Tech Stack

- **Frontend**: React, Recharts, React Router
- **Backend**: Node.js, Express
- **Data Service**: Python (Flask) + yfinance (port 5001)
- **Data Source**: Yahoo Finance

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Python 3.8+ with pip

### Installation

1. Install backend dependencies:
```bash
cd backend
npm install
```

2. Install frontend dependencies:
```bash
cd frontend
npm install
```

3. (Optional quick way) Use the helper script to start all services on Windows:
```bash
start-all.cmd
```
Otherwise follow the steps below to run each service manually.

### Running the Application

1. Start the Python data service (Terminal 1):
```bash
cd backend/python-data-service
pip install -r requirements.txt
python server.py
```
The Python service runs on http://localhost:5001 (health: /health)

2. Start the backend server (Terminal 2):
```bash
cd backend
npm start
```
The backend will run on http://localhost:5000

3. Start the frontend development server (Terminal 3):
```bash
cd frontend
npm start
```
The frontend will run on http://localhost:3000

## API Endpoints

- `GET /api/stock/:symbol?start=YYYY-MM-DD&end=YYYY-MM-DD` - Get stock historical data
- `POST /api/volatility` - Calculate volatility for stocks
- `GET /api/search/:query` - Search for stock symbols

Notes:
- Responses include `volatilityAnalysis.parameters` (GARCH params), `diagnostics`, and `probabilities` (t‑distribution brackets) when method is `garch`.

## Usage

1. Enter a stock symbol (e.g., AAPL, GOOGL, MSFT)
2. Select a date range for analysis
3. View the price chart and volatility metrics
4. Add multiple stocks to compare their volatility patterns
5. Click the “Learn” tab to read about GARCH, EWMA, and Rolling
6. In the results, review GARCH diagnostics and probability brackets

## License

ISC

