import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pwdlib import PasswordHash
from sqlalchemy import select

from app.database import Base, engine, SessionLocal

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


load_dotenv()


Base.metadata.create_all(bind=engine)


def ensure_admin_user():
    """
    Create the initial SnackFlow admin account if it does not exist.

    The admin credentials come from environment variables:
    ADMIN_USERNAME
    ADMIN_PASSWORD

    If the admin already exists, nothing is changed.
    """

    username = os.getenv("ADMIN_USERNAME")
    password = os.getenv("ADMIN_PASSWORD")

    if not username or not password:
        print(
            "ADMIN_USERNAME or ADMIN_PASSWORD is not configured. "
            "Skipping automatic admin creation."
        )
        return

    username = username.strip()

    if not username:
        print(
            "ADMIN_USERNAME is empty. "
            "Skipping automatic admin creation."
        )
        return

    password_hash = PasswordHash.recommended()

    db = SessionLocal()

    try:
        existing_user = db.scalar(
            select(User).where(
                User.username == username
            )
        )

        if existing_user:
            print(
                f"SnackFlow admin '{username}' already exists."
            )
            return

        admin = User(
            username=username,
            password_hash=password_hash.hash(password),
            role="ADMIN",
            shop_id=None,
            is_active=True,
        )

        db.add(admin)
        db.commit()
        db.refresh(admin)

        print("=" * 60)
        print("SNACKFLOW ADMIN CREATED")
        print("=" * 60)
        print(f"User ID  : {admin.id}")
        print(f"Username : {admin.username}")
        print("Role     : ADMIN")
        print("Shop     : ALL SHOPS")
        print("Status   : ACTIVE")
        print("=" * 60)

    finally:
        db.close()


ensure_admin_user()


app = FastAPI(
    title="SnackFlow API",
    description="Backend API for SnackFlow snack shop management system.",
    version="1.0.0",
)


frontend_url = os.getenv(
    "FRONTEND_URL",
    "",
)


allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]


if frontend_url:
    allowed_origins.extend(
        origin.strip()
        for origin in frontend_url.split(",")
        if origin.strip()
    )


app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
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