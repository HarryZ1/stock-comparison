# backend/main.py
from fastapi import FastAPI, Query, HTTPException
from dotenv import load_dotenv
import os
import requests # Example import
from datetime import datetime, date

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
async def fetch_data(symbols : str = Query(...),
                     initial_investment : float = Query(...),
                     date_from : str = Query(...),
                     date_to : str = Query(...)
                     ):
    if not MARKETSTACK_API_KEY:
        return {"error": "API key not configured"}
    
    symbol_list = []

    for s in symbols.split(','):
        if s.split():
            symbol_list.append(s.split()[0])
    
    if not symbol_list:
        raise HTTPException(status_code=400, detail="No valid symbols provided.")

    if initial_investment < 0:
        if initial_investment <= 0:
            raise HTTPException(status_code=400, detail="Initial investment must be positive.")
    
    try:
        start_date_obj = datetime.strptime(date_from, "%Y-%m-%d").date()
        end_date_obj = datetime.strptime().date(date_to, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

    num_symbol = len(symbol_list)
    
    
    marketstack_url = "https://api.marketstack.com/v2/eod?"

    query_params = {
        "access_key" : MARKETSTACK_API_KEY,
        "symbols" : symbols.upper(),
        "date_from": date_from,
        "date_to": date_to,
        "limit": 365,
    }

    try:
        response = requests.get(marketstack_url, params=query_params)
        response.raise_for_status()
        market_data = response.json()

        if "error" in market_data:
            error_info = market_data["error"]
            error_message = error_info.get("message", "Unknown Marketstack API error")
            status_code = 502
            if error_info.get("code") in ["validation_error", "invalid_access_key", "invalid_date_format"]:
                status_code = 400
            raise HTTPException(status_code=status_code, detail=f"Marketstack Error: {error_message}")
        api_data = market_data.get("data")
        if not api_data:
            return {"market_data": market_data, "portfolio_performance": []} # no data available
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=502, detail=f"API request failed: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error during data fetching.")
    
    


#def calculate_daily_portfolio_val():
    
