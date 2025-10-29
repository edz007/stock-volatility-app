# Stock Volatility Analysis Web App

A web application for analyzing stock volatility using GARCH models with data from Yahoo Finance.

## Features

- Fetch real-time stock data from Yahoo Finance
- Calculate GARCH volatility models
- Visualize stock prices and volatility over time
- Compare multiple stocks side-by-side
- Customizable date range selection
- Interactive charts with zoom and pan

## Tech Stack

- **Frontend**: React, Recharts
- **Backend**: Node.js, Express
- **Data Source**: Yahoo Finance API

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

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

### Running the Application

1. Start the backend server:
```bash
cd backend
npm start
```
The backend will run on http://localhost:5000

2. Start the frontend development server:
```bash
cd frontend
npm start
```
The frontend will run on http://localhost:3000

## API Endpoints

- `GET /api/stock/:symbol?start=YYYY-MM-DD&end=YYYY-MM-DD` - Get stock historical data
- `POST /api/volatility` - Calculate volatility for stocks
- `GET /api/search/:query` - Search for stock symbols

## Usage

1. Enter a stock symbol (e.g., AAPL, GOOGL, MSFT)
2. Select a date range for analysis
3. View the price chart and volatility metrics
4. Add multiple stocks to compare their volatility patterns

## License

ISC

