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

# Add a simple test endpoint later (Step 6)