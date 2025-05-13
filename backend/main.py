# backend/main.py
from fastapi import FastAPI, Query, HTTPException
from dotenv import load_dotenv
import os
import requests 
from collections import defaultdict
from datetime import datetime, date

load_dotenv() # Load environment variables from .env file

app = FastAPI()

MARKETSTACK_API_KEY = os.getenv("MARKETSTACK_API_KEY_FREE")

def parse_date_minimal(item):
    date_str = item.get("date")
    if not date_str: return None

    try:
        date_part = date_str.split("T")[0]
        return datetime.strptime(date_part, "%Y-%m-%d").date()
    except (ValueError, KeyError, IndexError):
        return None

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
        raise HTTPException(status_code=500, detail="API key not configured.")
    
    symbol_list = []

    for s in symbols.split(','):
        if s.split():
            symbol_list.append(s.split()[0])
    
    if not symbol_list:
        raise HTTPException(status_code=400, detail="No valid symbols provided.")

    if initial_investment <= 0:
        raise HTTPException(status_code=400, detail="Initial investment must be positive.")
    
    try:
        start_date_obj = datetime.strptime(date_from, "%Y-%m-%d").date()
        end_date_obj = datetime.strptime().date(date_to, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

    if start_date_obj > end_date_obj:
        raise HTTPException(status_code=400, detail="Start date cannot be after end date.")

    num_symbol = len(symbol_list)
    
    
    marketstack_url = "https://api.marketstack.com/v2/eod"

    query_params = {
        "access_key" : MARKETSTACK_API_KEY,
        "symbols" : ",".join(symbol_list),
        "date_from": date_from,
        "date_to": date_to,
        "limit": 365,
        "sort": "ASC"
    }

    try:
        response = requests.get(marketstack_url, params=query_params)
        response.raise_for_status()
        market_data = response.json()

        if "error" in market_data:
            error_info = market_data["error"]
            error_message = error_info.get("message", "Unknown Marketstack API error")
            status_code = 502
            if error_info.get("code") in ["validation_error", "invalid_access_key", "invalid_date_format", "missing_symbols"]:
                status_code = 400
            raise HTTPException(status_code=status_code, detail=f"Marketstack Error: {error_message}")
        
        api_data = market_data.get("data")
        if not api_data:
            return {
                "market_data": market_data,
                "individual_stock_performance": {},
                "excluded_symbols": symbol_list
            } # no data available
        
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=502, detail=f"API request failed: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error during data fetching.")
    
    individual_stock_performance = defaultdict(list)
    initial_shares = {} # fixed number of shares
    data_by_date = defaultdict(dict)
    excluded_symbols = []

    api_data.sort(key=lambda item: parse_date_minimal(item) or date.min) # sort by earliest to latest date

    first_valid_date_obj = None
    for item in api_data:
        item_date_obj = parse_date_minimal(item)
        symbol = item.get("symbol")
        if item_date_obj and symbol and start_date_obj <= item_date_obj <= end_date_obj:
            date_str = item_date_obj.strftime("%Y-%m-%d")
            data_by_date[date_str][symbol] = item
            if first_valid_date_obj is None:
                first_valid_date_obj = item_date_obj
    
    if first_valid_date_obj is None:
        return {
                "market_data": market_data,
                "individual_stock_performance": {},
                "excluded_symbols": symbol_list
            }
    
    first_valid_date_str = first_valid_date_obj.strftime("%Y-%m-%d")

    first_day_data = data_by_date.get(first_valid_date_str, {})

    for s in symbols:
        item = first_day_data.get(s)
        if item and item.get("adj_close") is not None and item["adj_close"] > 0:
            initial_price = item["adj_close"]
            initial_shares[s] = initial_investment / initial_price
        else:
            excluded_symbols.append(s)

    if not initial_shares:
        raise HTTPException(status_code=404, detail="Could not find initial market data for any symbol on the start date.")
    
    sorted_date_strings_in_data = sorted(data_by_date.keys())

    for curr_date in sorted_date_strings_in_data:
        curr_date_data = data_by_date[curr_date]

        for symbol_held, shares_amount in initial_shares.items():
            stock_item_for_today = curr_date_data.get(symbol_held)

            curr_stock_value = 0.0

            if stock_item_for_today and stock_item_for_today.get("adj_close") is not None:
                if stock_item_for_today["adj_close"] >= 0:
                    curr_stock_value = shares_amount * stock_item_for_today["adj_close"]
            
            individual_stock_performance[symbol_held].append({
                "date": curr_date,
                "value": round(curr_stock_value, 2)
            })

    return {
            "market_data": market_data,
            "individual_stock_performance": individual_stock_performance,
            "excluded_symbols": excluded_symbols
        }

    
