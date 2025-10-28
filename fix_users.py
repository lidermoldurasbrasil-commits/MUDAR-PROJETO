#!/usr/bin/env python3

import asyncio
import os
import bcrypt
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
ROOT_DIR = Path(__file__).parent / "backend"
load_dotenv(ROOT_DIR / '.env')

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

async def fix_users():
    # Connect to MongoDB
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print("🔧 Fixing production users password fields...")
    
    production_users = [
        {"username": "espelho", "expected_password": "123"},
        {"username": "molduras-vidro", "expected_password": "123"},
        {"username": "molduras", "expected_password": "123"},
        {"username": "impressao", "expected_password": "123"},
        {"username": "expedicao", "expected_password": "123"},
        {"username": "embalagem", "expected_password": "123"},
        {"username": "diretor", "expected_password": "123"}
    ]
    
    for user_info in production_users:
        username = user_info["username"]
        expected_password = user_info["expected_password"]
        
        user = await db.users.find_one({"username": username})
        if user:
            print(f"🔍 Processing user: {username}")
            
            # Check current password field
            current_password = user.get('password', '')
            print(f"   Current password field: {current_password}")
            
            # Hash the expected password
            hashed_password = hash_password(expected_password)
            print(f"   Generated password_hash: {hashed_password[:20]}...")
            
            # Update the user with password_hash and remove password field
            update_result = await db.users.update_one(
                {"username": username},
                {
                    "$set": {"password_hash": hashed_password},
                    "$unset": {"password": ""}
                }
            )
            
            if update_result.modified_count > 0:
                print(f"   ✅ Updated user {username} with password_hash")
            else:
                print(f"   ❌ Failed to update user {username}")
        else:
            print(f"❌ User not found: {username}")
        print()
    
    print("🔍 Verifying updates...")
    for user_info in production_users:
        username = user_info["username"]
        user = await db.users.find_one({"username": username})
        if user:
            has_password_hash = 'password_hash' in user
            has_password = 'password' in user
            print(f"   {username}: password_hash={has_password_hash}, password={has_password}")
        else:
            print(f"   {username}: NOT FOUND")

if __name__ == "__main__":
    asyncio.run(fix_users())