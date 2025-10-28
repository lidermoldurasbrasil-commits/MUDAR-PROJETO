#!/usr/bin/env python3

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
ROOT_DIR = Path(__file__).parent / "backend"
load_dotenv(ROOT_DIR / '.env')

async def check_user_details():
    # Connect to MongoDB
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print("🔍 Checking detailed user data...")
    
    # Check one user in detail
    user = await db.users.find_one({"username": "espelho"})
    if user:
        print(f"📋 User 'espelho' details:")
        for key, value in user.items():
            if key != '_id':  # Skip MongoDB internal ID
                print(f"   {key}: {value}")
    else:
        print("❌ User 'espelho' not found")

if __name__ == "__main__":
    asyncio.run(check_user_details())