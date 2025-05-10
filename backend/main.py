# backend/main.py
from fastapi import FastAPI, Query
from dotenv import load_dotenv
import os
import requests # Example import

load_dotenv() # Load environment variables from .env file

app = FastAPI()

MARKETSTACK_API_KEY = os.getenv("MARKETSTACK_API_KEY_FREE")

@app.get("/")
async def read_root():
    return {"message": "Stock Comparison Backend"}

#testing
@app.get("/api/test-marketstack")
async def test_api():
    if not MARKETSTACK_API_KEY:
        return {"error": "API key not configured"}
    # Example: Fetch end-of-day for AAPL (adjust endpoint/params as needed)
    # NOTE: Free plan only has 1 year history!
    url = f"https://api.marketstack.com/v2/eod?access_key={MARKETSTACK_API_KEY}"

    queryString = {
        "symbols":"AAPL",
        "date_from":"2024-05-10",
        "date_to":"2025-04-25",
        "limit": 365,
        }
    try:
        response = requests.get(url, params=queryString)
        response.raise_for_status() # Raise an exception for bad status codes
        return response.json()
    except requests.exceptions.RequestException as e:
        return {"error": f"API request failed: {e}"}
    
@app.get("/api/market-stack")
async def fetch_data(symbols : str = Query(...)):
    if not MARKETSTACK_API_KEY:
        return {"error": "API key not configured"}
    
    url = f"https://api.marketstack.com/v2/eod?access_key={MARKETSTACK_API_KEY}"

    queryString = {
        "symbols" : symbols.upper(),
        "date_from":"2024-05-10",
        "date_to":"2025-04-25",
        "limit": 365,
    }
    try:
        response = requests.get(url, params=queryString)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        return {"error": f"API request failed: {e}"}

