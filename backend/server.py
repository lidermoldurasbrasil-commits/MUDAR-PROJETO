from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Security
security = HTTPBearer()

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ============= MODELS =============

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    password_hash: str
    role: str = "manager"  # director, manager, production, logistics, marketing
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserRegister(BaseModel):
    username: str
    password: str
    role: str = "manager"

class UserLogin(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    token: str
    user: dict

# Production Board
class ProductionItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_name: str
    order_number: str = ""
    sku: str
    quantity: int
    client_name: str
    frame_color: str
    delivery_date: str
    status: str = "Designing"
    priority: str = "Média"
    assigned_to: str = ""
    budget: float = 0
    platform: str = "Shopee"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProductionItemCreate(BaseModel):
    project_name: str
    order_number: str = ""
    sku: str
    quantity: int
    client_name: str
    frame_color: str
    delivery_date: str
    status: str = "Designing"
    priority: str = "Média"
    assigned_to: str = ""
    budget: float = 0
    platform: str = "Shopee"

# Returns
class ReturnItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_id: str
    platform: str
    product: str
    return_reason: str
    cost: float
    responsible_department: str
    resolution_status: str = "Pending"  # Pending, Under Review, Approved for Refund, Resolved
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ReturnItemCreate(BaseModel):
    order_id: str
    platform: str
    product: str
    return_reason: str
    cost: float
    responsible_department: str
    resolution_status: str = "Pending"

# Marketing Tasks
class MarketingTask(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    task_name: str
    project: str
    deadline: str
    assigned_member: str
    status: str = "To Do"  # To Do, In Progress, Review, Published
    description: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MarketingTaskCreate(BaseModel):
    task_name: str
    project: str
    deadline: str
    assigned_member: str
    status: str = "To Do"
    description: str = ""

# Purchase Requests
class PurchaseRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    item_name: str
    description: str
    quantity: int
    supplier: str
    estimated_cost: float
    requested_by: str
    approval_status: str = "Pending"  # Pending, Approved, Rejected
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PurchaseRequestCreate(BaseModel):
    item_name: str
    description: str
    quantity: int
    supplier: str
    estimated_cost: float
    requested_by: str

# Purchase Orders
class PurchaseOrder(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    request_id: str
    supplier: str
    status: str = "Sent to Supplier"  # Sent to Supplier, In Production, In Transit, Delivered
    order_date: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PurchaseOrderCreate(BaseModel):
    request_id: str
    supplier: str
    order_date: str
    status: str = "Sent to Supplier"

# Accounts Payable
class AccountPayable(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    supplier: str
    invoice_number: str
    due_date: str
    value: float
    cost_center: str
    status: str = "Pending"  # Pending, Paid, Overdue
    entity: str = "Factory"  # Factory, Store 1, Store 2, Store 3
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AccountPayableCreate(BaseModel):
    supplier: str
    invoice_number: str
    due_date: str
    value: float
    cost_center: str
    status: str = "Pending"
    entity: str = "Factory"

# Sales
class Sale(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    channel: str  # Marketplace, Store 1, Store 2, Store 3
    product: str
    quantity: int
    revenue: float
    sale_date: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SaleCreate(BaseModel):
    channel: str
    product: str
    quantity: int
    revenue: float
    sale_date: str

# Cost Center
class CostCenter(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    department: str
    salaries: float
    taxes: float
    vacation: float
    thirteenth_salary: float
    depreciation: float
    equipment_costs: float
    rent: float
    accounting: float
    systems: float
    other_expenses: float
    month: str
    year: int
    entity: str = "Factory"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CostCenterCreate(BaseModel):
    department: str
    salaries: float = 0
    taxes: float = 0
    vacation: float = 0
    thirteenth_salary: float = 0
    depreciation: float = 0
    equipment_costs: float = 0
    rent: float = 0
    accounting: float = 0
    systems: float = 0
    other_expenses: float = 0
    month: str
    year: int
    entity: str = "Factory"

# Store Production Tasks
class StoreProduction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    store: str  # Store 1, Store 2, Store 3, Factory
    customer_name: str
    order_id: str
    project_name: str = ""
    responsible: str = ""
    status: str = "Artwork Creation"  # Artwork Creation, Client Approval, Printing, Production, Ready, Delivered
    delivery_deadline: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StoreProductionCreate(BaseModel):
    store: str
    customer_name: str
    order_id: str
    project_name: str = ""
    responsible: str = ""
    status: str = "Artwork Creation"
    delivery_deadline: str

# Complaints
class Complaint(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_name: str
    order_id: str
    problem_description: str
    status: str = "Created"  # Created, Under Analysis, Resolved, Not Resolved
    manager: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ComplaintCreate(BaseModel):
    customer_name: str
    order_id: str
    problem_description: str
    manager: str
    status: str = "Created"

# CRM Leads
class Lead(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    contact_info: str
    interest: str
    store: str
    follow_up_date: str
    status: str = "New Lead"  # New Lead, In Contact, Proposal Sent, Converted, Lost
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LeadCreate(BaseModel):
    client_name: str
    contact_info: str
    interest: str
    store: str
    follow_up_date: str
    status: str = "New Lead"

# ============= HELPER FUNCTIONS =============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, username: str, role: str) -> str:
    payload = {
        "user_id": user_id,
        "username": username,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_token(token)
    return payload

# ============= AUTH ROUTES =============

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserRegister):
    # Check if user exists
    existing = await db.users.find_one({"username": user_data.username})
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    user = User(
        username=user_data.username,
        password_hash=hash_password(user_data.password),
        role=user_data.role
    )
    
    doc = user.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.users.insert_one(doc)
    
    token = create_token(user.id, user.username, user.role)
    return TokenResponse(
        token=token,
        user={"id": user.id, "username": user.username, "role": user.role}
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"username": credentials.username})
    if not user or not verify_password(credentials.password, user['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user['id'], user['username'], user['role'])
    return TokenResponse(
        token=token,
        user={"id": user['id'], "username": user['username'], "role": user['role']}
    )

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user

# ============= DASHBOARD =============

@api_router.get("/dashboard/metrics")
async def get_dashboard_metrics(current_user: dict = Depends(get_current_user)):
    total_sales = await db.sales.count_documents({})
    in_production = await db.production_items.count_documents({"status": {"$in": ["Designing", "Printing", "In Production"]}})
    shipped = await db.production_items.count_documents({"status": "Shipped"})
    returns = await db.returns.count_documents({})
    complaints = await db.complaints.count_documents({"status": {"$ne": "Resolved"}})
    
    # Calculate total revenue
    sales_pipeline = [
        {"$group": {"_id": None, "total": {"$sum": "$revenue"}}}
    ]
    revenue_result = await db.sales.aggregate(sales_pipeline).to_list(1)
    total_revenue = revenue_result[0]['total'] if revenue_result else 0
    
    return {
        "total_sales": total_sales,
        "total_revenue": total_revenue,
        "orders_in_production": in_production,
        "orders_shipped": shipped,
        "returns": returns,
        "pending_complaints": complaints
    }

@api_router.get("/dashboard/charts")
async def get_dashboard_charts(current_user: dict = Depends(get_current_user)):
    # Sales by channel
    sales_by_channel = await db.sales.aggregate([
        {"$group": {"_id": "$channel", "count": {"$sum": 1}, "revenue": {"$sum": "$revenue"}}}
    ]).to_list(100)
    
    # Production status
    production_status = await db.production_items.aggregate([
        {"$group": {"_id": "$status", "count": {"$sum": 1}}}
    ]).to_list(100)
    
    return {
        "sales_by_channel": sales_by_channel,
        "production_status": production_status
    }

# ============= PRODUCTION BOARD =============

@api_router.post("/production", response_model=ProductionItem)
async def create_production_item(item: ProductionItemCreate, current_user: dict = Depends(get_current_user)):
    production_item = ProductionItem(**item.model_dump())
    doc = production_item.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.production_items.insert_one(doc)
    return production_item

@api_router.get("/production", response_model=List[ProductionItem])
async def get_production_items(current_user: dict = Depends(get_current_user)):
    items = await db.production_items.find({}, {"_id": 0}).to_list(1000)
    for item in items:
        if isinstance(item.get('created_at'), str):
            item['created_at'] = datetime.fromisoformat(item['created_at'])
    return items

@api_router.put("/production/{item_id}")
async def update_production_item(item_id: str, item: ProductionItemCreate, current_user: dict = Depends(get_current_user)):
    await db.production_items.update_one({"id": item_id}, {"$set": item.model_dump()})
    return {"message": "Updated successfully"}

@api_router.delete("/production/{item_id}")
async def delete_production_item(item_id: str, current_user: dict = Depends(get_current_user)):
    await db.production_items.delete_one({"id": item_id})
    return {"message": "Deleted successfully"}

# ============= RETURNS =============

@api_router.post("/returns", response_model=ReturnItem)
async def create_return(item: ReturnItemCreate, current_user: dict = Depends(get_current_user)):
    return_item = ReturnItem(**item.model_dump())
    doc = return_item.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.returns.insert_one(doc)
    return return_item

@api_router.get("/returns", response_model=List[ReturnItem])
async def get_returns(current_user: dict = Depends(get_current_user)):
    items = await db.returns.find({}, {"_id": 0}).to_list(1000)
    for item in items:
        if isinstance(item.get('created_at'), str):
            item['created_at'] = datetime.fromisoformat(item['created_at'])
    return items

@api_router.put("/returns/{item_id}")
async def update_return(item_id: str, item: ReturnItemCreate, current_user: dict = Depends(get_current_user)):
    await db.returns.update_one({"id": item_id}, {"$set": item.model_dump()})
    return {"message": "Updated successfully"}

@api_router.delete("/returns/{item_id}")
async def delete_return(item_id: str, current_user: dict = Depends(get_current_user)):
    await db.returns.delete_one({"id": item_id})
    return {"message": "Deleted successfully"}

# ============= MARKETING TASKS =============

@api_router.post("/marketing", response_model=MarketingTask)
async def create_marketing_task(task: MarketingTaskCreate, current_user: dict = Depends(get_current_user)):
    marketing_task = MarketingTask(**task.model_dump())
    doc = marketing_task.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.marketing_tasks.insert_one(doc)
    return marketing_task

@api_router.get("/marketing", response_model=List[MarketingTask])
async def get_marketing_tasks(current_user: dict = Depends(get_current_user)):
    tasks = await db.marketing_tasks.find({}, {"_id": 0}).to_list(1000)
    for task in tasks:
        if isinstance(task.get('created_at'), str):
            task['created_at'] = datetime.fromisoformat(task['created_at'])
    return tasks

@api_router.put("/marketing/{task_id}")
async def update_marketing_task(task_id: str, task: MarketingTaskCreate, current_user: dict = Depends(get_current_user)):
    await db.marketing_tasks.update_one({"id": task_id}, {"$set": task.model_dump()})
    return {"message": "Updated successfully"}

@api_router.delete("/marketing/{task_id}")
async def delete_marketing_task(task_id: str, current_user: dict = Depends(get_current_user)):
    await db.marketing_tasks.delete_one({"id": task_id})
    return {"message": "Deleted successfully"}

# ============= PURCHASE REQUESTS =============

@api_router.post("/purchase-requests", response_model=PurchaseRequest)
async def create_purchase_request(request: PurchaseRequestCreate, current_user: dict = Depends(get_current_user)):
    purchase_request = PurchaseRequest(**request.model_dump())
    doc = purchase_request.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.purchase_requests.insert_one(doc)
    return purchase_request

@api_router.get("/purchase-requests", response_model=List[PurchaseRequest])
async def get_purchase_requests(current_user: dict = Depends(get_current_user)):
    requests = await db.purchase_requests.find({}, {"_id": 0}).to_list(1000)
    for req in requests:
        if isinstance(req.get('created_at'), str):
            req['created_at'] = datetime.fromisoformat(req['created_at'])
    return requests

@api_router.put("/purchase-requests/{request_id}")
async def update_purchase_request(request_id: str, request: PurchaseRequestCreate, current_user: dict = Depends(get_current_user)):
    await db.purchase_requests.update_one({"id": request_id}, {"$set": request.model_dump()})
    return {"message": "Updated successfully"}

@api_router.patch("/purchase-requests/{request_id}/approve")
async def approve_purchase_request(request_id: str, current_user: dict = Depends(get_current_user)):
    await db.purchase_requests.update_one({"id": request_id}, {"$set": {"approval_status": "Approved"}})
    return {"message": "Approved successfully"}

@api_router.patch("/purchase-requests/{request_id}/reject")
async def reject_purchase_request(request_id: str, current_user: dict = Depends(get_current_user)):
    await db.purchase_requests.update_one({"id": request_id}, {"$set": {"approval_status": "Rejected"}})
    return {"message": "Rejected successfully"}

# ============= PURCHASE ORDERS =============

@api_router.post("/purchase-orders", response_model=PurchaseOrder)
async def create_purchase_order(order: PurchaseOrderCreate, current_user: dict = Depends(get_current_user)):
    purchase_order = PurchaseOrder(**order.model_dump())
    doc = purchase_order.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.purchase_orders.insert_one(doc)
    return purchase_order

@api_router.get("/purchase-orders", response_model=List[PurchaseOrder])
async def get_purchase_orders(current_user: dict = Depends(get_current_user)):
    orders = await db.purchase_orders.find({}, {"_id": 0}).to_list(1000)
    for order in orders:
        if isinstance(order.get('created_at'), str):
            order['created_at'] = datetime.fromisoformat(order['created_at'])
    return orders

@api_router.put("/purchase-orders/{order_id}")
async def update_purchase_order(order_id: str, order: PurchaseOrderCreate, current_user: dict = Depends(get_current_user)):
    await db.purchase_orders.update_one({"id": order_id}, {"$set": order.model_dump()})
    return {"message": "Updated successfully"}

# ============= ACCOUNTS PAYABLE =============

@api_router.post("/accounts-payable", response_model=AccountPayable)
async def create_account_payable(account: AccountPayableCreate, current_user: dict = Depends(get_current_user)):
    account_payable = AccountPayable(**account.model_dump())
    doc = account_payable.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.accounts_payable.insert_one(doc)
    return account_payable

@api_router.get("/accounts-payable", response_model=List[AccountPayable])
async def get_accounts_payable(entity: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {"entity": entity} if entity else {}
    accounts = await db.accounts_payable.find(query, {"_id": 0}).to_list(1000)
    for account in accounts:
        if isinstance(account.get('created_at'), str):
            account['created_at'] = datetime.fromisoformat(account['created_at'])
    return accounts

@api_router.put("/accounts-payable/{account_id}")
async def update_account_payable(account_id: str, account: AccountPayableCreate, current_user: dict = Depends(get_current_user)):
    await db.accounts_payable.update_one({"id": account_id}, {"$set": account.model_dump()})
    return {"message": "Updated successfully"}

# ============= SALES =============

@api_router.post("/sales", response_model=Sale)
async def create_sale(sale: SaleCreate, current_user: dict = Depends(get_current_user)):
    sale_item = Sale(**sale.model_dump())
    doc = sale_item.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.sales.insert_one(doc)
    return sale_item

@api_router.get("/sales", response_model=List[Sale])
async def get_sales(current_user: dict = Depends(get_current_user)):
    sales = await db.sales.find({}, {"_id": 0}).to_list(1000)
    for sale in sales:
        if isinstance(sale.get('created_at'), str):
            sale['created_at'] = datetime.fromisoformat(sale['created_at'])
    return sales

# ============= COST CENTER =============

@api_router.post("/cost-center", response_model=CostCenter)
async def create_cost_center(cost: CostCenterCreate, current_user: dict = Depends(get_current_user)):
    cost_center = CostCenter(**cost.model_dump())
    doc = cost_center.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.cost_centers.insert_one(doc)
    return cost_center

@api_router.get("/cost-center", response_model=List[CostCenter])
async def get_cost_centers(entity: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {"entity": entity} if entity else {}
    centers = await db.cost_centers.find(query, {"_id": 0}).to_list(1000)
    for center in centers:
        if isinstance(center.get('created_at'), str):
            center['created_at'] = datetime.fromisoformat(center['created_at'])
    return centers

@api_router.put("/cost-center/{cost_id}")
async def update_cost_center(cost_id: str, cost: CostCenterCreate, current_user: dict = Depends(get_current_user)):
    await db.cost_centers.update_one({"id": cost_id}, {"$set": cost.model_dump()})
    return {"message": "Updated successfully"}

# ============= BREAKEVEN =============

@api_router.get("/breakeven/calculate")
async def calculate_breakeven(month: str, year: int, current_user: dict = Depends(get_current_user)):
    # Get total costs for the month
    costs_pipeline = [
        {"$match": {"month": month, "year": year}},
        {"$group": {
            "_id": None,
            "total": {"$sum": {
                "$add": [
                    "$salaries", "$taxes", "$vacation", "$thirteenth_salary",
                    "$depreciation", "$equipment_costs", "$rent", "$accounting",
                    "$systems", "$other_expenses"
                ]
            }}
        }}
    ]
    cost_result = await db.cost_centers.aggregate(costs_pipeline).to_list(1)
    total_costs = cost_result[0]['total'] if cost_result else 0
    
    # Get accounts payable for the month
    payable_pipeline = [
        {"$match": {"due_date": {"$regex": f"{month}.*{year}"}}},
        {"$group": {"_id": None, "total": {"$sum": "$value"}}}
    ]
    payable_result = await db.accounts_payable.aggregate(payable_pipeline).to_list(1)
    accounts_payable = payable_result[0]['total'] if payable_result else 0
    
    # Get revenue for the month
    revenue_pipeline = [
        {"$match": {"sale_date": {"$regex": f"{month}.*{year}"}}},
        {"$group": {"_id": None, "total": {"$sum": "$revenue"}}}
    ]
    revenue_result = await db.sales.aggregate(revenue_pipeline).to_list(1)
    total_revenue = revenue_result[0]['total'] if revenue_result else 0
    
    total_expenses = total_costs + accounts_payable
    profit = total_revenue - total_expenses
    
    return {
        "month": month,
        "year": year,
        "total_costs": total_costs,
        "accounts_payable": accounts_payable,
        "total_expenses": total_expenses,
        "total_revenue": total_revenue,
        "profit": profit,
        "breakeven_reached": total_revenue >= total_expenses
    }

# ============= STORE PRODUCTION =============

@api_router.post("/store-production", response_model=StoreProduction)
async def create_store_production(item: StoreProductionCreate, current_user: dict = Depends(get_current_user)):
    store_production = StoreProduction(**item.model_dump())
    doc = store_production.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.store_production.insert_one(doc)
    return store_production

@api_router.get("/store-production", response_model=List[StoreProduction])
async def get_store_production(store: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {"store": store} if store else {}
    items = await db.store_production.find(query, {"_id": 0}).to_list(1000)
    for item in items:
        if isinstance(item.get('created_at'), str):
            item['created_at'] = datetime.fromisoformat(item['created_at'])
    return items

@api_router.put("/store-production/{item_id}")
async def update_store_production(item_id: str, item: StoreProductionCreate, current_user: dict = Depends(get_current_user)):
    await db.store_production.update_one({"id": item_id}, {"$set": item.model_dump()})
    return {"message": "Updated successfully"}

@api_router.delete("/store-production/{item_id}")
async def delete_store_production(item_id: str, current_user: dict = Depends(get_current_user)):
    await db.store_production.delete_one({"id": item_id})
    return {"message": "Deleted successfully"}

# ============= COMPLAINTS =============

@api_router.post("/complaints", response_model=Complaint)
async def create_complaint(complaint: ComplaintCreate, current_user: dict = Depends(get_current_user)):
    complaint_item = Complaint(**complaint.model_dump())
    doc = complaint_item.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.complaints.insert_one(doc)
    return complaint_item

@api_router.get("/complaints", response_model=List[Complaint])
async def get_complaints(current_user: dict = Depends(get_current_user)):
    complaints = await db.complaints.find({}, {"_id": 0}).to_list(1000)
    for complaint in complaints:
        if isinstance(complaint.get('created_at'), str):
            complaint['created_at'] = datetime.fromisoformat(complaint['created_at'])
    return complaints

@api_router.put("/complaints/{complaint_id}")
async def update_complaint(complaint_id: str, complaint: ComplaintCreate, current_user: dict = Depends(get_current_user)):
    await db.complaints.update_one({"id": complaint_id}, {"$set": complaint.model_dump()})
    return {"message": "Updated successfully"}

# ============= LEADS/CRM =============

@api_router.post("/leads", response_model=Lead)
async def create_lead(lead: LeadCreate, current_user: dict = Depends(get_current_user)):
    lead_item = Lead(**lead.model_dump())
    doc = lead_item.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.leads.insert_one(doc)
    return lead_item

@api_router.get("/leads", response_model=List[Lead])
async def get_leads(store: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {"store": store} if store else {}
    leads = await db.leads.find(query, {"_id": 0}).to_list(1000)
    for lead in leads:
        if isinstance(lead.get('created_at'), str):
            lead['created_at'] = datetime.fromisoformat(lead['created_at'])
    return leads

@api_router.put("/leads/{lead_id}")
async def update_lead(lead_id: str, lead: LeadCreate, current_user: dict = Depends(get_current_user)):
    await db.leads.update_one({"id": lead_id}, {"$set": lead.model_dump()})
    return {"message": "Updated successfully"}

@api_router.delete("/leads/{lead_id}")
async def delete_lead(lead_id: str, current_user: dict = Depends(get_current_user)):
    await db.leads.delete_one({"id": lead_id})
    return {"message": "Deleted successfully"}

# ============= SISTEMA DE GESTÃO =============

# Models para Sistema de Gestão
class Produto(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    loja_id: str  # fabrica, loja1, loja2, loja3, loja4, loja5
    
    # Características
    referencia: str
    descricao: str
    codigo: Optional[str] = ""
    fornecedor: Optional[str] = ""
    localizacao: Optional[str] = ""
    familia: Optional[str] = "Molduras"
    tipo_produto: Optional[str] = ""
    ref_loja: Optional[str] = ""
    largura: Optional[float] = 0
    comprimento: Optional[float] = 0
    espessura: Optional[float] = 0
    ncm: Optional[str] = ""
    cfop: Optional[str] = ""
    saldo_estoque: Optional[float] = 0
    ponto_compra: Optional[str] = ""
    ativo: bool = True
    
    # Precificação
    custo_vista: Optional[float] = 0
    custo_30dias: Optional[float] = 0
    custo_60dias: Optional[float] = 0
    custo_90dias: Optional[float] = 0
    custo_120dias: Optional[float] = 0
    custo_150dias: Optional[float] = 0
    desconto_lista: Optional[float] = 0
    custo_base: Optional[float] = 0
    preco_manufatura: Optional[float] = 0
    preco_varejo: Optional[float] = 0
    markup_manufatura: Optional[float] = 0
    markup_varejo: Optional[float] = 0
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Endpoints de Produtos
@api_router.get("/gestao/produtos")
async def get_produtos(loja: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    """Retorna produtos filtrados por loja. Fábrica vê todos."""
    query = {}
    if loja and loja != 'fabrica':
        query['loja_id'] = loja
    
    produtos = await db.produtos_gestao.find(query).to_list(None)
    # Remove _id do MongoDB para evitar problemas de serialização
    for produto in produtos:
        if '_id' in produto:
            del produto['_id']
    return produtos

@api_router.post("/gestao/produtos")
async def create_produto(produto: Produto, current_user: dict = Depends(get_current_user)):
    """Cria um novo produto"""
    produto_dict = produto.model_dump()
    await db.produtos_gestao.insert_one(produto_dict)
    return produto

@api_router.put("/gestao/produtos/{produto_id}")
async def update_produto(produto_id: str, produto: Produto, current_user: dict = Depends(get_current_user)):
    """Atualiza um produto existente"""
    produto_dict = produto.model_dump()
    produto_dict['updated_at'] = datetime.now(timezone.utc).isoformat()
    await db.produtos_gestao.update_one({"id": produto_id}, {"$set": produto_dict})
    return {"message": "Produto atualizado com sucesso"}

@api_router.delete("/gestao/produtos/{produto_id}")
async def delete_produto(produto_id: str, current_user: dict = Depends(get_current_user)):
    """Deleta um produto"""
    await db.produtos_gestao.delete_one({"id": produto_id})
    return {"message": "Produto excluído com sucesso"}

# ============= INSUMOS E ORÇAMENTOS =============

class Insumo(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    loja_id: str  # fabrica, loja1, loja2, loja3, loja4, loja5
    
    codigo: str
    tipo_insumo: str  # Moldura, Vidro, MDF, Espelho, Papel, Adesivo, Acessório, Passe-partout
    descricao: str
    unidade_medida: str  # cm, m², unidade
    custo_unitario: float  # Custo por cm, m² ou unidade
    barra_padrao: Optional[float] = 270.0  # Para molduras
    fornecedor: Optional[str] = ""
    ativo: bool = True
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ItemOrcamento(BaseModel):
    insumo_id: str
    insumo_descricao: str
    tipo_insumo: str
    quantidade: float
    unidade: str
    custo_unitario: float
    subtotal: float

class Orcamento(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    loja_id: str
    
    # Dimensões
    altura: float  # cm
    largura: float  # cm
    quantidade: int = 1
    tipo_produto: str  # Quadro, Espelho, Moldura avulsa, Fine-Art
    
    # Insumos selecionados
    moldura_id: Optional[str] = None
    usar_vidro: bool = False
    vidro_id: Optional[str] = None
    usar_mdf: bool = False
    mdf_id: Optional[str] = None
    usar_papel: bool = False
    papel_id: Optional[str] = None
    usar_acessorios: bool = False
    acessorios_ids: Optional[List[str]] = []
    
    # Cálculos
    area: float = 0  # m²
    perimetro: float = 0  # cm
    barras_necessarias: int = 0
    sobra: float = 0  # cm
    custo_perda: float = 0
    
    # Custos
    itens: List[ItemOrcamento] = []
    custo_total: float = 0
    markup: float = 3.0
    preco_venda: float = 0
    margem_percentual: float = 0
    
    # Metadata
    cliente_nome: Optional[str] = ""
    observacoes: Optional[str] = ""
    status: str = "Rascunho"  # Rascunho, Aprovado, Enviado para Produção
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Endpoints de Insumos
@api_router.get("/gestao/insumos")
async def get_insumos(loja: Optional[str] = None, tipo: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    """Retorna insumos filtrados por loja e tipo"""
    query = {"ativo": True}
    if loja and loja != 'fabrica':
        query['loja_id'] = loja
    if tipo:
        query['tipo_insumo'] = tipo
    
    insumos = await db.insumos.find(query).to_list(None)
    return insumos

@api_router.post("/gestao/insumos")
async def create_insumo(insumo: Insumo, current_user: dict = Depends(get_current_user)):
    """Cria um novo insumo"""
    insumo_dict = insumo.model_dump()
    await db.insumos.insert_one(insumo_dict)
    return insumo

@api_router.put("/gestao/insumos/{insumo_id}")
async def update_insumo(insumo_id: str, insumo: Insumo, current_user: dict = Depends(get_current_user)):
    """Atualiza um insumo existente"""
    insumo_dict = insumo.model_dump()
    insumo_dict['updated_at'] = datetime.now(timezone.utc).isoformat()
    await db.insumos.update_one({"id": insumo_id}, {"$set": insumo_dict})
    return {"message": "Insumo atualizado com sucesso"}

@api_router.delete("/gestao/insumos/{insumo_id}")
async def delete_insumo(insumo_id: str, current_user: dict = Depends(get_current_user)):
    """Deleta um insumo"""
    await db.insumos.delete_one({"id": insumo_id})
    return {"message": "Insumo excluído com sucesso"}

# Endpoints de Orçamentos
@api_router.post("/gestao/orcamentos/calcular")
async def calcular_orcamento(orcamento: Orcamento, current_user: dict = Depends(get_current_user)):
    """Calcula automaticamente o orçamento com base nos insumos selecionados"""
    import math
    
    # 1. Calcular área (m²)
    orcamento.area = (orcamento.altura * orcamento.largura) / 10000
    
    # 2. Calcular perímetro (cm)
    orcamento.perimetro = (2 * orcamento.altura) + (2 * orcamento.largura)
    
    # 3. Buscar insumos e calcular custos
    itens = []
    custo_total = 0
    
    # 3.1 Moldura
    if orcamento.moldura_id:
        moldura = await db.insumos.find_one({"id": orcamento.moldura_id})
        if moldura:
            # Calcular barras necessárias
            barra_padrao = moldura.get('barra_padrao', 270)
            orcamento.barras_necessarias = math.ceil(orcamento.perimetro / barra_padrao)
            
            # Calcular sobra e perda
            orcamento.sobra = (orcamento.barras_necessarias * barra_padrao) - orcamento.perimetro
            
            # Se sobra < 100cm, considerar como perda e cobrar
            perimetro_cobrado = orcamento.perimetro
            if orcamento.sobra < 100:
                orcamento.custo_perda = orcamento.sobra * moldura['custo_unitario']
                perimetro_cobrado += orcamento.sobra
            
            # Custo da moldura
            custo_moldura = perimetro_cobrado * moldura['custo_unitario'] * orcamento.quantidade
            custo_total += custo_moldura
            
            itens.append(ItemOrcamento(
                insumo_id=moldura['id'],
                insumo_descricao=moldura['descricao'],
                tipo_insumo='Moldura',
                quantidade=perimetro_cobrado,
                unidade='cm',
                custo_unitario=moldura['custo_unitario'],
                subtotal=custo_moldura
            ))
    
    # 3.2 Vidro
    if orcamento.usar_vidro and orcamento.vidro_id:
        vidro = await db.insumos.find_one({"id": orcamento.vidro_id})
        if vidro:
            custo_vidro = orcamento.area * vidro['custo_unitario'] * orcamento.quantidade
            custo_total += custo_vidro
            
            itens.append(ItemOrcamento(
                insumo_id=vidro['id'],
                insumo_descricao=vidro['descricao'],
                tipo_insumo='Vidro',
                quantidade=orcamento.area,
                unidade='m²',
                custo_unitario=vidro['custo_unitario'],
                subtotal=custo_vidro
            ))
    
    # 3.3 MDF
    if orcamento.usar_mdf and orcamento.mdf_id:
        mdf = await db.insumos.find_one({"id": orcamento.mdf_id})
        if mdf:
            custo_mdf = orcamento.area * mdf['custo_unitario'] * orcamento.quantidade
            custo_total += custo_mdf
            
            itens.append(ItemOrcamento(
                insumo_id=mdf['id'],
                insumo_descricao=mdf['descricao'],
                tipo_insumo='MDF',
                quantidade=orcamento.area,
                unidade='m²',
                custo_unitario=mdf['custo_unitario'],
                subtotal=custo_mdf
            ))
    
    # 3.4 Papel/Adesivo
    if orcamento.usar_papel and orcamento.papel_id:
        papel = await db.insumos.find_one({"id": orcamento.papel_id})
        if papel:
            custo_papel = orcamento.area * papel['custo_unitario'] * orcamento.quantidade
            custo_total += custo_papel
            
            itens.append(ItemOrcamento(
                insumo_id=papel['id'],
                insumo_descricao=papel['descricao'],
                tipo_insumo='Papel/Adesivo',
                quantidade=orcamento.area,
                unidade='m²',
                custo_unitario=papel['custo_unitario'],
                subtotal=custo_papel
            ))
    
    # 3.5 Acessórios
    if orcamento.usar_acessorios and orcamento.acessorios_ids:
        for acessorio_id in orcamento.acessorios_ids:
            acessorio = await db.insumos.find_one({"id": acessorio_id})
            if acessorio:
                custo_acessorio = acessorio['custo_unitario'] * orcamento.quantidade
                custo_total += custo_acessorio
                
                itens.append(ItemOrcamento(
                    insumo_id=acessorio['id'],
                    insumo_descricao=acessorio['descricao'],
                    tipo_insumo='Acessório',
                    quantidade=orcamento.quantidade,
                    unidade='unidade',
                    custo_unitario=acessorio['custo_unitario'],
                    subtotal=custo_acessorio
                ))
    
    # 4. Calcular totais
    orcamento.itens = itens
    orcamento.custo_total = custo_total
    orcamento.preco_venda = custo_total * orcamento.markup
    orcamento.margem_percentual = ((orcamento.preco_venda - custo_total) / orcamento.preco_venda * 100) if orcamento.preco_venda > 0 else 0
    
    return orcamento

@api_router.post("/gestao/orcamentos")
async def create_orcamento(orcamento: Orcamento, current_user: dict = Depends(get_current_user)):
    """Salva um orçamento"""
    orcamento_dict = orcamento.model_dump()
    await db.orcamentos.insert_one(orcamento_dict)
    return orcamento

@api_router.get("/gestao/orcamentos")
async def get_orcamentos(loja: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    """Retorna orçamentos filtrados por loja"""
    query = {}
    if loja and loja != 'fabrica':
        query['loja_id'] = loja
    
    orcamentos = await db.orcamentos.find(query).to_list(None)
    return orcamentos

@api_router.get("/gestao/orcamentos/{orcamento_id}")
async def get_orcamento(orcamento_id: str, current_user: dict = Depends(get_current_user)):
    """Retorna um orçamento específico"""
    orcamento = await db.orcamentos.find_one({"id": orcamento_id})
    if not orcamento:
        raise HTTPException(status_code=404, detail="Orçamento não encontrado")
    return orcamento

@api_router.put("/gestao/orcamentos/{orcamento_id}")
async def update_orcamento(orcamento_id: str, orcamento: Orcamento, current_user: dict = Depends(get_current_user)):
    """Atualiza um orçamento"""
    orcamento_dict = orcamento.model_dump()
    orcamento_dict['updated_at'] = datetime.now(timezone.utc).isoformat()
    await db.orcamentos.update_one({"id": orcamento_id}, {"$set": orcamento_dict})
    return {"message": "Orçamento atualizado com sucesso"}

@api_router.delete("/gestao/orcamentos/{orcamento_id}")
async def delete_orcamento(orcamento_id: str, current_user: dict = Depends(get_current_user)):
    """Deleta um orçamento"""
    await db.orcamentos.delete_one({"id": orcamento_id})
    return {"message": "Orçamento excluído com sucesso"}
    return {"message": "Produto excluído com sucesso"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()