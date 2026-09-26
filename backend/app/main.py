from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine

from app.models.shop import Shop
from app.models.product import Product
from app.models.order import Order, OrderItem
from app.models.worker import Worker
from app.models.salary_payment import SalaryPayment
from app.models.user import User

from app.routes.shop import router as shops_router
from app.routes.product import router as products_router
from app.routes.order import router as orders_router
from app.routes.worker import router as workers_router
from app.routes.salary_payment import router as salary_payments_router
from app.routes.auth import router as auth_router
from app.routes.user import router as users_router


Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="SnackFlow API",
    description="Backend API for SnackFlow snack shop management system.",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router)
app.include_router(users_router)
app.include_router(shops_router)
app.include_router(products_router)
app.include_router(orders_router)
app.include_router(workers_router)
app.include_router(salary_payments_router)


@app.get("/")
def root():
    return {
        "message": "SnackFlow API is running."
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }