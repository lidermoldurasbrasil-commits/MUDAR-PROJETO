#!/usr/bin/env python3

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
ROOT_DIR = Path(__file__).parent / "backend"
load_dotenv(ROOT_DIR / '.env')

async def check_users():
    # Connect to MongoDB
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print("🔍 Checking production users in database...")
    
    production_usernames = [
        "espelho", "molduras-vidro", "molduras", "impressao", 
        "expedicao", "embalagem", "diretor"
    ]
    
    for username in production_usernames:
        user = await db.users.find_one({"username": username})
        if user:
            print(f"✅ Found user: {username}")
            print(f"   ID: {user.get('id', 'N/A')}")
            print(f"   Role: {user.get('role', 'N/A')}")
            print(f"   Has password_hash: {'password_hash' in user}")
            print(f"   Has password: {'password' in user}")
            print(f"   Fields: {list(user.keys())}")
        else:
            print(f"❌ User not found: {username}")
        print()
    
    # Count total users
    total_users = await db.users.count_documents({})
    print(f"📊 Total users in database: {total_users}")
    
    # List all users
    all_users = await db.users.find({}, {"username": 1, "role": 1}).to_list(None)
    print(f"📋 All users:")
    for user in all_users:
        print(f"   - {user.get('username', 'N/A')} ({user.get('role', 'N/A')})")

if __name__ == "__main__":
    asyncio.run(check_users())