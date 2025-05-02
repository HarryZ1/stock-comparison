# backend/main.py
from fastapi import FastAPI
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
    url = f"http://api.marketstack.com/v2/eod/latest?access_key={MARKETSTACK_API_KEY}&symbols=AAPL"
    try:
        response = requests.get(url)
        response.raise_for_status() # Raise an exception for bad status codes
        return response.json()
    except requests.exceptions.RequestException as e:
        return {"error": f"API request failed: {e}"}