from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, File, UploadFile
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

def is_director_or_manager(user: dict) -> bool:
    """Verifica se o usuário é Diretor ou Gerente"""
    role = user.get('role', '').lower()
    return role in ['diretor', 'gerente', 'director', 'manager']

# ============= AUTH ROUTES =============

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Retorna informações do usuário atual incluindo permissões"""
    return {
        "id": current_user.get('id'),
        "username": current_user.get('username'),
        "role": current_user.get('role'),
        "can_view_costs": is_director_or_manager(current_user)
    }

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
    referencia: str  # SKU
    descricao: str
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
    # Remove _id do MongoDB
    for insumo in insumos:
        if '_id' in insumo:
            del insumo['_id']
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
    # Remove _id do MongoDB
    for orcamento in orcamentos:
        if '_id' in orcamento:
            del orcamento['_id']
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

# ============= PEDIDOS DE MANUFATURA =============

class HistoricoStatus(BaseModel):
    status: str
    data: datetime
    usuario: str
    observacao: Optional[str] = ""

# ============= CLIENTES =============

class Cliente(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    loja_id: str  # fabrica, loja1, loja2, etc.
    
    # Dados pessoais
    nome: str
    cpf: Optional[str] = ""
    rg: Optional[str] = ""
    data_nascimento: Optional[str] = ""
    
    # Contato
    telefone: str
    celular: Optional[str] = ""
    email: Optional[str] = ""
    
    # Endereço de entrega
    cep: Optional[str] = ""
    endereco: str = ""
    numero: Optional[str] = ""
    complemento: Optional[str] = ""
    bairro: Optional[str] = ""
    cidade: Optional[str] = ""
    estado: Optional[str] = ""
    
    # Dados adicionais
    observacoes: Optional[str] = ""
    ativo: bool = True
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Endpoints de Clientes
@api_router.get("/gestao/clientes")
async def get_clientes(loja: Optional[str] = None, busca: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    """Retorna clientes filtrados"""
    query = {"ativo": True}
    if loja and loja != 'fabrica':
        query['loja_id'] = loja
    
    if busca:
        query['$or'] = [
            {'nome': {'$regex': busca, '$options': 'i'}},
            {'cpf': {'$regex': busca, '$options': 'i'}},
            {'telefone': {'$regex': busca, '$options': 'i'}}
        ]
    
    clientes = await db.clientes.find(query).sort("nome", 1).to_list(None)
    for cliente in clientes:
        if '_id' in cliente:
            del cliente['_id']
    return clientes

@api_router.post("/gestao/clientes")
async def create_cliente(cliente: Cliente, current_user: dict = Depends(get_current_user)):
    """Cria um novo cliente"""
    cliente_dict = cliente.model_dump()
    await db.clientes.insert_one(cliente_dict)
    if '_id' in cliente_dict:
        del cliente_dict['_id']
    return cliente_dict

@api_router.get("/gestao/clientes/{cliente_id}")
async def get_cliente(cliente_id: str, current_user: dict = Depends(get_current_user)):
    """Retorna um cliente específico"""
    cliente = await db.clientes.find_one({"id": cliente_id})
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    if '_id' in cliente:
        del cliente['_id']
    return cliente

@api_router.put("/gestao/clientes/{cliente_id}")
async def update_cliente(cliente_id: str, cliente: Cliente, current_user: dict = Depends(get_current_user)):
    """Atualiza um cliente existente"""
    cliente_dict = cliente.model_dump()
    cliente_dict['updated_at'] = datetime.now(timezone.utc).isoformat()
    await db.clientes.update_one({"id": cliente_id}, {"$set": cliente_dict})
    return {"message": "Cliente atualizado com sucesso"}

@api_router.delete("/gestao/clientes/{cliente_id}")
async def delete_cliente(cliente_id: str, current_user: dict = Depends(get_current_user)):
    """Desativa um cliente (soft delete)"""
    await db.clientes.update_one({"id": cliente_id}, {"$set": {"ativo": False}})
    return {"message": "Cliente desativado com sucesso"}

# ============= PEDIDOS DE MANUFATURA =============

class HistoricoStatus(BaseModel):
    status: str
    data: datetime
    usuario: str
    observacao: Optional[str] = ""

class PedidoCalculoRequest(BaseModel):
    """Modelo simplificado apenas para cálculo de orçamento"""
    model_config = ConfigDict(extra="ignore")
    
    # Campos mínimos necessários para cálculo
    altura: float  # cm
    largura: float  # cm
    quantidade: int = 1
    
    # Insumos selecionados (todos opcionais)
    moldura_id: Optional[str] = None
    usar_vidro: bool = False
    vidro_id: Optional[str] = None
    usar_mdf: bool = False
    mdf_id: Optional[str] = None
    usar_papel: bool = False
    papel_id: Optional[str] = None
    usar_passepartout: bool = False
    passepartout_id: Optional[str] = None
    usar_acessorios: bool = False
    acessorios_ids: Optional[List[str]] = []
    
    # Campos comerciais
    desconto_percentual: float = 0
    desconto_valor: float = 0
    sobre_preco_percentual: float = 0
    sobre_preco_valor: float = 0

class PedidoManufatura(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    numero_pedido: int = 0  # Auto-incremental
    loja_id: str  # fabrica, loja1, loja2, loja3, loja4, loja5
    
    # Dados básicos
    data_abertura: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    cliente_id: Optional[str] = ""  # ID do cliente cadastrado
    cliente_nome: str
    tipo_produto: str  # Quadro, Espelho, Moldura avulsa, Fine-Art
    quantidade: int = 1
    
    # Anexo do cliente (objeto para emoldurar)
    imagem_anexada: Optional[str] = ""  # URL da imagem
    sku_objeto_cliente: Optional[str] = ""  # SKU do objeto trazido pelo cliente
    
    # Dimensões
    altura: float  # cm
    largura: float  # cm
    
    # Insumos selecionados
    moldura_id: Optional[str] = None
    moldura_descricao: Optional[str] = ""
    usar_vidro: bool = False
    vidro_id: Optional[str] = None
    vidro_descricao: Optional[str] = ""
    usar_mdf: bool = False
    mdf_id: Optional[str] = None
    mdf_descricao: Optional[str] = ""
    usar_papel: bool = False
    papel_id: Optional[str] = None
    papel_descricao: Optional[str] = ""
    usar_passepartout: bool = False
    passepartout_id: Optional[str] = None
    passepartout_descricao: Optional[str] = ""
    usar_acessorios: bool = False
    acessorios_ids: Optional[List[str]] = []
    acessorios_descricoes: Optional[List[str]] = []
    
    # NOVOS CAMPOS
    produto_pronto_id: Optional[str] = None  # Produto pronto
    produto_pronto_descricao: Optional[str] = ""
    promocao_id: Optional[str] = None  # Promoção
    promocao_descricao: Optional[str] = ""
    espelho_organico_id: Optional[str] = None  # Espelho orgânico
    espelho_organico_descricao: Optional[str] = ""
    
    # Cálculos automáticos
    area: float = 0  # m²
    perimetro: float = 0  # cm
    barras_necessarias: int = 0
    sobra: float = 0  # cm
    custo_perda: float = 0
    
    # Composição detalhada
    itens: List[ItemOrcamento] = []
    
    # Custos e valores
    custo_total: float = 0
    markup: float = 3.0
    preco_venda: float = 0
    margem_percentual: float = 0
    
    # Orçamento (campos comerciais)
    forma_pagamento: Optional[str] = ""
    desconto_percentual: float = 0
    desconto_valor: float = 0
    sobre_preco_percentual: float = 0
    sobre_preco_valor: float = 0
    valor_final: float = 0
    descricao_orcamento: Optional[str] = ""
    
    # Controle de produção
    status: str = "Criado"
    vendedor: Optional[str] = ""
    prazo_entrega: Optional[datetime] = None
    observacoes: Optional[str] = ""
    observacoes_loja: Optional[str] = ""
    observacoes_cliente: Optional[str] = ""
    
    # Histórico
    historico_status: List[HistoricoStatus] = []
    
    # Metadata
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_by: Optional[str] = ""

# Contador para número de pedido
async def get_next_numero_pedido():
    """Gera o próximo número de pedido sequencial"""
    ultimo_pedido = await db.pedidos_manufatura.find_one(sort=[("numero_pedido", -1)])
    if ultimo_pedido and 'numero_pedido' in ultimo_pedido:
        return ultimo_pedido['numero_pedido'] + 1
    return 1

# Endpoints de Pedidos de Manufatura
@api_router.get("/gestao/pedidos")
async def get_pedidos(loja: Optional[str] = None, status: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    """Retorna pedidos filtrados por loja e status"""
    query = {}
    if loja and loja != 'fabrica':
        query['loja_id'] = loja
    if status:
        query['status'] = status
    
    pedidos = await db.pedidos_manufatura.find(query).sort("numero_pedido", -1).to_list(None)
    # Remove _id do MongoDB
    for pedido in pedidos:
        if '_id' in pedido:
            del pedido['_id']
    return pedidos

def get_custo_por_prazo(produto, prazo_selecionado):
    """Obtém o custo unitário baseado no prazo selecionado do produto"""
    prazo_map = {
        'vista': 'custo_vista',
        '30dias': 'custo_30dias',
        '60dias': 'custo_60dias',
        '90dias': 'custo_90dias',
        '120dias': 'custo_120dias',
        '150dias': 'custo_150dias'
    }
    campo_custo = prazo_map.get(prazo_selecionado, 'custo_120dias')
    return produto.get(campo_custo, 0)

@api_router.post("/gestao/pedidos/calcular")
async def calcular_pedido(pedido: PedidoCalculoRequest, current_user: dict = Depends(get_current_user)):
    """Calcula automaticamente os custos do pedido com base nos insumos selecionados"""
    import math
    
    # Criar um dicionário para armazenar resultados
    resultado = pedido.model_dump()
    
    # 1. Calcular área (m²)
    resultado['area'] = (pedido.altura * pedido.largura) / 10000
    
    # 2. Calcular perímetro (cm)
    resultado['perimetro'] = (2 * pedido.altura) + (2 * pedido.largura)
    
    # 3. Buscar insumos e calcular custos
    itens = []
    custo_total = 0
    markup_sugerido = 3.0  # Markup padrão
    
    # 3.1 Moldura
    if pedido.moldura_id:
        moldura_produto = await db.produtos_gestao.find_one({"id": pedido.moldura_id})
        moldura = await db.insumos.find_one({"id": pedido.moldura_id})
        
        if moldura_produto:
            # Usar prazo selecionado no produto
            prazo = moldura_produto.get('prazo_selecionado', '120dias')
            custo_unitario_barra = get_custo_por_prazo(moldura_produto, prazo)
            
            # Converter custo de barra para custo por cm
            custo_por_cm = custo_unitario_barra / 270 if custo_unitario_barra > 0 else 0
            
            # Pegar markup do produto (usar markup_manufatura)
            if moldura_produto.get('markup_manufatura'):
                markup_sugerido = (moldura_produto['markup_manufatura'] / 100) + 1  # Converter % para multiplicador
            
            moldura = {
                'id': moldura_produto['id'],
                'descricao': moldura_produto['descricao'],
                'custo_unitario': custo_por_cm,
                'barra_padrao': 270,
                'largura_moldura': moldura_produto.get('largura', 0)  # Largura da frente da moldura
            }
        elif moldura:
            # Usar insumo direto
            pass
        
        if moldura:
            resultado['moldura_descricao'] = moldura['descricao']
            
            # Calcular barras necessárias
            barra_padrao = moldura.get('barra_padrao', 270)
            resultado['barras_necessarias'] = math.ceil(resultado['perimetro'] / barra_padrao)
            
            # Calcular sobra e perda
            resultado['sobra'] = (resultado['barras_necessarias'] * barra_padrao) - resultado['perimetro']
            
            # PERDA TÉCNICA 1: Perda de corte baseada na largura da moldura
            # Largura da moldura × 8 (padrão da indústria para corte de molduras)
            largura_moldura = moldura.get('largura_moldura', 0)
            perda_corte_cm = largura_moldura * 8 if largura_moldura > 0 else 0
            
            # PERDA TÉCNICA 2: Se sobra < 100cm, considerar como perda adicional
            perda_sobra_cm = 0
            if resultado['sobra'] < 100:
                perda_sobra_cm = resultado['sobra']
            
            # Total de perda a cobrar
            perda_total_cm = perda_corte_cm + perda_sobra_cm
            resultado['custo_perda'] = perda_total_cm * moldura['custo_unitario']
            
            # Perímetro cobrado = perímetro + perdas
            perimetro_cobrado = resultado['perimetro'] + perda_total_cm
            
            # Custo da moldura
            custo_moldura = perimetro_cobrado * moldura['custo_unitario'] * pedido.quantidade
            custo_total += custo_moldura
            
            itens.append({
                'insumo_id': moldura['id'],
                'insumo_descricao': f"{moldura['descricao']} (Perda corte: {perda_corte_cm:.0f}cm, Sobra: {perda_sobra_cm:.0f}cm)",
                'tipo_insumo': 'Moldura',
                'quantidade': perimetro_cobrado,
                'unidade': 'cm',
                'custo_unitario': moldura['custo_unitario'],
                'subtotal': custo_moldura
            })
    
    # 3.2 Vidro
    if pedido.usar_vidro and pedido.vidro_id:
        vidro_produto = await db.produtos_gestao.find_one({"id": pedido.vidro_id})
        vidro = await db.insumos.find_one({"id": pedido.vidro_id})
        
        if vidro_produto:
            prazo = vidro_produto.get('prazo_selecionado', '120dias')
            custo_unitario = get_custo_por_prazo(vidro_produto, prazo)
            
            # Pegar markup do produto
            if vidro_produto.get('markup_manufatura'):
                markup_item = (vidro_produto['markup_manufatura'] / 100) + 1
                if markup_item > markup_sugerido:
                    markup_sugerido = markup_item
            
            vidro = {
                'id': vidro_produto['id'],
                'descricao': vidro_produto['descricao'],
                'custo_unitario': custo_unitario
            }
        
        if vidro:
            resultado['vidro_descricao'] = vidro['descricao']
            custo_vidro = resultado['area'] * vidro['custo_unitario'] * pedido.quantidade
            custo_total += custo_vidro
            
            itens.append({
                'insumo_id': vidro['id'],
                'insumo_descricao': vidro['descricao'],
                'tipo_insumo': 'Vidro',
                'quantidade': resultado['area'],
                'unidade': 'm²',
                'custo_unitario': vidro['custo_unitario'],
                'subtotal': custo_vidro
            })
    
    # 3.3 MDF
    if pedido.usar_mdf and pedido.mdf_id:
        mdf_produto = await db.produtos_gestao.find_one({"id": pedido.mdf_id})
        mdf = await db.insumos.find_one({"id": pedido.mdf_id})
        
        if mdf_produto:
            prazo = mdf_produto.get('prazo_selecionado', '120dias')
            custo_unitario = get_custo_por_prazo(mdf_produto, prazo)
            
            if mdf_produto.get('markup_manufatura'):
                markup_item = (mdf_produto['markup_manufatura'] / 100) + 1
                if markup_item > markup_sugerido:
                    markup_sugerido = markup_item
            
            mdf = {
                'id': mdf_produto['id'],
                'descricao': mdf_produto['descricao'],
                'custo_unitario': custo_unitario
            }
        
        if mdf:
            resultado['mdf_descricao'] = mdf['descricao']
            custo_mdf = resultado['area'] * mdf['custo_unitario'] * pedido.quantidade
            custo_total += custo_mdf
            
            itens.append({
                'insumo_id': mdf['id'],
                'insumo_descricao': mdf['descricao'],
                'tipo_insumo': 'MDF',
                'quantidade': resultado['area'],
                'unidade': 'm²',
                'custo_unitario': mdf['custo_unitario'],
                'subtotal': custo_mdf
            })
    
    # 3.4 Papel/Adesivo
    if pedido.usar_papel and pedido.papel_id:
        papel_produto = await db.produtos_gestao.find_one({"id": pedido.papel_id})
        papel = await db.insumos.find_one({"id": pedido.papel_id})
        
        if papel_produto:
            prazo = papel_produto.get('prazo_selecionado', '120dias')
            custo_unitario = get_custo_por_prazo(papel_produto, prazo)
            
            if papel_produto.get('markup_manufatura'):
                markup_item = (papel_produto['markup_manufatura'] / 100) + 1
                if markup_item > markup_sugerido:
                    markup_sugerido = markup_item
            
            papel = {
                'id': papel_produto['id'],
                'descricao': papel_produto['descricao'],
                'custo_unitario': custo_unitario
            }
        
        if papel:
            resultado['papel_descricao'] = papel['descricao']
            custo_papel = resultado['area'] * papel['custo_unitario'] * pedido.quantidade
            custo_total += custo_papel
            
            itens.append({
                'insumo_id': papel['id'],
                'insumo_descricao': papel['descricao'],
                'tipo_insumo': 'Papel/Adesivo',
                'quantidade': resultado['area'],
                'unidade': 'm²',
                'custo_unitario': papel['custo_unitario'],
                'subtotal': custo_papel
            })
    
    # 3.5 Passe-partout
    if pedido.usar_passepartout and pedido.passepartout_id:
        passepartout_produto = await db.produtos_gestao.find_one({"id": pedido.passepartout_id})
        passepartout = await db.insumos.find_one({"id": pedido.passepartout_id})
        
        if passepartout_produto:
            prazo = passepartout_produto.get('prazo_selecionado', '120dias')
            custo_unitario = get_custo_por_prazo(passepartout_produto, prazo)
            
            if passepartout_produto.get('markup_manufatura'):
                markup_item = (passepartout_produto['markup_manufatura'] / 100) + 1
                if markup_item > markup_sugerido:
                    markup_sugerido = markup_item
            
            passepartout = {
                'id': passepartout_produto['id'],
                'descricao': passepartout_produto['descricao'],
                'custo_unitario': custo_unitario
            }
        
        if passepartout:
            resultado['passepartout_descricao'] = passepartout['descricao']
            custo_passepartout = resultado['area'] * passepartout['custo_unitario'] * pedido.quantidade
            custo_total += custo_passepartout
            
            itens.append({
                'insumo_id': passepartout['id'],
                'insumo_descricao': passepartout['descricao'],
                'tipo_insumo': 'Passe-partout',
                'quantidade': resultado['area'],
                'unidade': 'm²',
                'custo_unitario': passepartout['custo_unitario'],
                'subtotal': custo_passepartout
            })
    
    # 3.6 Acessórios
    if pedido.usar_acessorios and pedido.acessorios_ids:
        descricoes = []
        for acessorio_id in pedido.acessorios_ids:
            acessorio_produto = await db.produtos_gestao.find_one({"id": acessorio_id})
            acessorio = await db.insumos.find_one({"id": acessorio_id})
            
            if acessorio_produto:
                prazo = acessorio_produto.get('prazo_selecionado', '120dias')
                custo_unitario = get_custo_por_prazo(acessorio_produto, prazo)
                
                if acessorio_produto.get('markup_manufatura'):
                    markup_item = (acessorio_produto['markup_manufatura'] / 100) + 1
                    if markup_item > markup_sugerido:
                        markup_sugerido = markup_item
                
                acessorio = {
                    'id': acessorio_produto['id'],
                    'descricao': acessorio_produto['descricao'],
                    'custo_unitario': custo_unitario
                }
            
            if acessorio:
                descricoes.append(acessorio['descricao'])
                custo_acessorio = acessorio['custo_unitario'] * pedido.quantidade
                custo_total += custo_acessorio
                
                itens.append({
                    'insumo_id': acessorio['id'],
                    'insumo_descricao': acessorio['descricao'],
                    'tipo_insumo': 'Acessório',
                    'quantidade': pedido.quantidade,
                    'unidade': 'unidade',
                    'custo_unitario': acessorio['custo_unitario'],
                    'subtotal': custo_acessorio
                })
        resultado['acessorios_descricoes'] = descricoes
    
    # 4. Calcular totais com markup do produto
    resultado['itens'] = itens
    resultado['custo_total'] = custo_total
    resultado['markup'] = markup_sugerido
    resultado['preco_venda'] = custo_total * markup_sugerido
    resultado['margem_percentual'] = ((resultado['preco_venda'] - custo_total) / resultado['preco_venda'] * 100) if resultado['preco_venda'] > 0 else 0
    
    # 5. Calcular valor final com desconto/sobre-preço
    valor_base = resultado['preco_venda']
    
    # Aplicar desconto (% ou valor)
    desconto_total = 0
    if pedido.desconto_percentual > 0:
        desconto_total = valor_base * (pedido.desconto_percentual / 100)
        resultado['desconto_valor'] = desconto_total
    elif pedido.desconto_valor > 0:
        desconto_total = pedido.desconto_valor
        resultado['desconto_percentual'] = (desconto_total / valor_base * 100) if valor_base > 0 else 0
    
    # Aplicar sobre-preço (% ou valor)
    sobre_preco_total = 0
    if pedido.sobre_preco_percentual > 0:
        sobre_preco_total = valor_base * (pedido.sobre_preco_percentual / 100)
        resultado['sobre_preco_valor'] = sobre_preco_total
    elif pedido.sobre_preco_valor > 0:
        sobre_preco_total = pedido.sobre_preco_valor
        resultado['sobre_preco_percentual'] = (sobre_preco_total / valor_base * 100) if valor_base > 0 else 0
    
    # Valor final
    resultado['valor_final'] = valor_base - desconto_total + sobre_preco_total
    
    return resultado

@api_router.post("/gestao/pedidos")
async def create_pedido(pedido: PedidoManufatura, current_user: dict = Depends(get_current_user)):
    """Cria um novo pedido de manufatura"""
    # Gerar número do pedido
    pedido.numero_pedido = await get_next_numero_pedido()
    pedido.created_by = current_user.get('username', '')
    
    # Adicionar primeiro histórico
    pedido.historico_status = [
        HistoricoStatus(
            status="Criado",
            data=datetime.now(timezone.utc),
            usuario=current_user.get('username', ''),
            observacao="Pedido criado"
        )
    ]
    
    pedido_dict = pedido.model_dump()
    await db.pedidos_manufatura.insert_one(pedido_dict)
    
    # Remove _id
    if '_id' in pedido_dict:
        del pedido_dict['_id']
    
    return pedido_dict

@api_router.get("/gestao/pedidos/{pedido_id}")
async def get_pedido(pedido_id: str, current_user: dict = Depends(get_current_user)):
    """Retorna um pedido específico"""
    pedido = await db.pedidos_manufatura.find_one({"id": pedido_id})
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    if '_id' in pedido:
        del pedido['_id']
    return pedido

@api_router.put("/gestao/pedidos/{pedido_id}")
async def update_pedido(pedido_id: str, pedido: PedidoManufatura, current_user: dict = Depends(get_current_user)):
    """Atualiza um pedido existente"""
    pedido_dict = pedido.model_dump()
    pedido_dict['updated_at'] = datetime.now(timezone.utc).isoformat()
    await db.pedidos_manufatura.update_one({"id": pedido_id}, {"$set": pedido_dict})
    return {"message": "Pedido atualizado com sucesso"}

@api_router.put("/gestao/pedidos/{pedido_id}/status")
async def update_status_pedido(pedido_id: str, novo_status: str, observacao: Optional[str] = "", current_user: dict = Depends(get_current_user)):
    """Atualiza o status de um pedido e registra no histórico"""
    pedido = await db.pedidos_manufatura.find_one({"id": pedido_id})
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    
    # Adicionar ao histórico
    historico = pedido.get('historico_status', [])
    historico.append({
        'status': novo_status,
        'data': datetime.now(timezone.utc).isoformat(),
        'usuario': current_user.get('username', ''),
        'observacao': observacao
    })
    
    # Atualizar pedido
    await db.pedidos_manufatura.update_one(
        {"id": pedido_id},
        {
            "$set": {
                "status": novo_status,
                "historico_status": historico,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    # Se status for "Pronto" ou "Entregue", gerar lançamento financeiro
    if novo_status in ["Pronto", "Entregue"]:
        try:
            lancamento = {
                'id': str(uuid.uuid4()),
                'pedido_id': pedido_id,
                'numero_pedido': pedido['numero_pedido'],
                'tipo': 'Receita',
                'categoria': 'Venda de Manufatura',
                'descricao': f"Pedido #{pedido['numero_pedido']} - {pedido.get('cliente_nome', 'Cliente')}",
                'valor_custo': pedido.get('custo_total', 0),
                'valor_venda': pedido.get('preco_venda', 0),
                'margem_percentual': pedido.get('margem_percentual', 0),
                'loja_id': pedido.get('loja_id', 'fabrica'),
                'data': datetime.now(timezone.utc).isoformat(),
                'status': 'Concluído' if novo_status == 'Entregue' else 'Pendente',
                'created_at': datetime.now(timezone.utc).isoformat(),
                'created_by': current_user.get('username', '')
            }
            await db.lancamentos_financeiros.insert_one(lancamento)
        except Exception as e:
            print(f"Erro ao criar lançamento financeiro: {e}")
    
    return {"message": f"Status atualizado para {novo_status}"}

@api_router.delete("/gestao/pedidos/{pedido_id}")
async def delete_pedido(pedido_id: str, current_user: dict = Depends(get_current_user)):
    """Deleta um pedido"""
    await db.pedidos_manufatura.delete_one({"id": pedido_id})
    return {"message": "Pedido excluído com sucesso"}

@api_router.post("/gestao/pedidos/upload-imagem")
async def upload_imagem_pedido(file: UploadFile, current_user: dict = Depends(get_current_user)):
    """Upload de imagem do objeto do cliente"""
    import base64
    from datetime import datetime
    
    # Ler arquivo
    contents = await file.read()
    
    # Converter para base64
    image_base64 = base64.b64encode(contents).decode('utf-8')
    
    # Retornar URL data
    return {
        "url": f"data:image/jpeg;base64,{image_base64}",
        "filename": file.filename,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

# ============= LANÇAMENTOS FINANCEIROS =============

class LancamentoFinanceiro(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    pedido_id: Optional[str] = ""
    numero_pedido: Optional[int] = 0
    tipo: str  # Receita, Despesa
    categoria: str  # Venda de Manufatura, Compra de Insumos, etc.
    descricao: str
    valor_custo: float = 0
    valor_venda: float = 0
    margem_percentual: float = 0
    loja_id: str
    data: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: str = "Pendente"  # Pendente, Concluído, Cancelado
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_by: str = ""

@api_router.get("/gestao/financeiro/lancamentos")
async def get_lancamentos(loja: Optional[str] = None, tipo: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    """Retorna lançamentos financeiros filtrados"""
    query = {}
    if loja and loja != 'fabrica':
        query['loja_id'] = loja
    if tipo:
        query['tipo'] = tipo
    
    lancamentos = await db.lancamentos_financeiros.find(query).sort("data", -1).to_list(None)
    for lancamento in lancamentos:
        if '_id' in lancamento:
            del lancamento['_id']
    return lancamentos

@api_router.get("/gestao/financeiro/resumo")
async def get_resumo_financeiro(loja: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    """Retorna resumo financeiro consolidado"""
    query = {}
    if loja and loja != 'fabrica':
        query['loja_id'] = loja
    
    lancamentos = await db.lancamentos_financeiros.find(query).to_list(None)
    
    total_receitas = sum(l.get('valor_venda', 0) for l in lancamentos if l.get('tipo') == 'Receita')
    total_custos = sum(l.get('valor_custo', 0) for l in lancamentos if l.get('tipo') == 'Receita')
    total_despesas = sum(l.get('valor_venda', 0) for l in lancamentos if l.get('tipo') == 'Despesa')
    lucro_bruto = total_receitas - total_custos - total_despesas
    margem_media = ((lucro_bruto / total_receitas) * 100) if total_receitas > 0 else 0
    
    return {
        'total_receitas': total_receitas,
        'total_custos': total_custos,
        'total_despesas': total_despesas,
        'lucro_bruto': lucro_bruto,
        'margem_media': margem_media,
        'quantidade_lancamentos': len(lancamentos)
    }

# ============= DASHBOARD E RELATÓRIOS =============

@api_router.get("/gestao/pedidos/estatisticas")
async def get_estatisticas_pedidos(loja: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    """Retorna estatísticas consolidadas dos pedidos"""
    from datetime import timedelta
    
    query = {}
    if loja and loja != 'fabrica':
        query['loja_id'] = loja
    
    # Buscar todos os pedidos
    pedidos = await db.pedidos_manufatura.find(query).to_list(None)
    
    # Contadores por status
    status_count = {}
    for status in ["Criado", "Em Análise", "Corte", "Montagem", "Acabamento", "Pronto", "Entregue", "Cancelado"]:
        status_count[status] = len([p for p in pedidos if p.get('status') == status])
    
    # Pedidos em produção (todos exceto Entregue e Cancelado)
    em_producao = len([p for p in pedidos if p.get('status') not in ['Entregue', 'Cancelado']])
    
    # Pedidos em atraso (prazo vencido e não entregue)
    hoje = datetime.now(timezone.utc)
    em_atraso = 0
    for p in pedidos:
        if p.get('status') not in ['Entregue', 'Cancelado'] and p.get('prazo_entrega'):
            prazo = p['prazo_entrega']
            if isinstance(prazo, str):
                prazo = datetime.fromisoformat(prazo.replace('Z', '+00:00'))
            if prazo < hoje:
                em_atraso += 1
    
    # Calcular perdas técnicas do mês
    primeiro_dia_mes = hoje.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    pedidos_mes = [p for p in pedidos if p.get('created_at')]
    
    perda_total_cm = 0
    perda_total_valor = 0
    for p in pedidos_mes:
        created = p.get('created_at')
        if isinstance(created, str):
            created = datetime.fromisoformat(created.replace('Z', '+00:00'))
        if created >= primeiro_dia_mes:
            sobra = p.get('sobra', 0)
            if sobra > 0 and sobra < 100:
                perda_total_cm += sobra
                perda_total_valor += p.get('custo_perda', 0)
    
    # Total de pedidos finalizados
    finalizados = len([p for p in pedidos if p.get('status') in ['Pronto', 'Entregue']])
    
    # Lucro médio
    lucro_total = sum(p.get('preco_venda', 0) - p.get('custo_total', 0) for p in pedidos if p.get('status') == 'Entregue')
    lucro_medio = (lucro_total / finalizados) if finalizados > 0 else 0
    
    # Margem média
    margem_total = sum(p.get('margem_percentual', 0) for p in pedidos if p.get('status') == 'Entregue')
    margem_media = (margem_total / finalizados) if finalizados > 0 else 0
    
    return {
        'cards': {
            'em_producao': em_producao,
            'em_atraso': em_atraso,
            'perdas_tecnicas_cm': round(perda_total_cm, 2),
            'perdas_tecnicas_valor': round(perda_total_valor, 2),
            'finalizados': finalizados,
            'lucro_medio': round(lucro_medio, 2),
            'margem_media': round(margem_media, 2)
        },
        'por_status': status_count,
        'total_pedidos': len(pedidos)
    }

@api_router.get("/gestao/pedidos/consumo-insumos")
async def get_consumo_insumos(loja: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    """Retorna consumo consolidado de insumos por tipo"""
    query = {}
    if loja and loja != 'fabrica':
        query['loja_id'] = loja
    
    pedidos = await db.pedidos_manufatura.find(query).to_list(None)
    
    consumo = {
        'Moldura': {'quantidade': 0, 'unidade': 'cm', 'custo': 0},
        'Vidro': {'quantidade': 0, 'unidade': 'm²', 'custo': 0},
        'MDF': {'quantidade': 0, 'unidade': 'm²', 'custo': 0},
        'Papel/Adesivo': {'quantidade': 0, 'unidade': 'm²', 'custo': 0},
        'Passe-partout': {'quantidade': 0, 'unidade': 'm²', 'custo': 0},
        'Acessório': {'quantidade': 0, 'unidade': 'unidade', 'custo': 0}
    }
    
    for pedido in pedidos:
        if pedido.get('status') in ['Entregue', 'Pronto']:
            for item in pedido.get('itens', []):
                tipo = item.get('tipo_insumo', '')
                if tipo in consumo:
                    consumo[tipo]['quantidade'] += item.get('quantidade', 0)
                    consumo[tipo]['custo'] += item.get('subtotal', 0)
    
    return consumo

@api_router.get("/gestao/pedidos/evolucao-diaria")
async def get_evolucao_diaria(dias: int = 30, loja: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    """Retorna evolução de pedidos criados por dia"""
    from datetime import timedelta
    
    query = {}
    if loja and loja != 'fabrica':
        query['loja_id'] = loja
    
    hoje = datetime.now(timezone.utc)
    inicio = hoje - timedelta(days=dias)
    
    pedidos = await db.pedidos_manufatura.find(query).to_list(None)
    
    # Agrupar por data
    evolucao = {}
    for i in range(dias):
        data = inicio + timedelta(days=i)
        data_str = data.strftime('%Y-%m-%d')
        evolucao[data_str] = 0
    
    for pedido in pedidos:
        created = pedido.get('created_at')
        if created:
            if isinstance(created, str):
                created = datetime.fromisoformat(created.replace('Z', '+00:00'))
            if created >= inicio:
                data_str = created.strftime('%Y-%m-%d')
                if data_str in evolucao:
                    evolucao[data_str] += 1
    
    return {
        'labels': list(evolucao.keys()),
        'valores': list(evolucao.values())
    }

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