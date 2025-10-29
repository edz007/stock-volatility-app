# Python yfinance Data Service

Flask API service providing stock data via yfinance library.

## Deployment on Railway

1. In Railway dashboard, set **Root Directory** to: `backend/python-data-service`
2. Railway will auto-detect:
   - Python runtime (from `runtime.txt`)
   - Dependencies (from `requirements.txt`)
   - Start command (from `Procfile`)
3. Environment variables (optional):
   - `PORT` - Railway will set this automatically

## Deployment on Render

1. Create new **Web Service** from GitHub
2. Set **Root Directory** to: `backend/python-data-service`
3. Build Command: `pip install -r requirements.txt`
4. Start Command: `gunicorn --bind 0.0.0.0:$PORT server:app`
5. Environment: `PORT` will be set automatically

## Endpoints

- `GET /health` - Health check
- `GET /historical/<symbol>?start=YYYY-MM-DD&end=YYYY-MM-DD` - Get historical stock data
- `GET /search/<query>` - Search for stock symbols
- `GET /quote/<symbol>` - Get current quote

## Local Development

```bash
cd backend/python-data-service
pip install -r requirements.txt
python server.py
```

Service will run on `http://localhost:5001`

