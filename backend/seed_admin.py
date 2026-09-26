import os

from dotenv import load_dotenv
from pwdlib import PasswordHash
from sqlalchemy import select

from app.database import SessionLocal
from app.models.shop import Shop
from app.models.user import User


load_dotenv()


password_hash = PasswordHash.recommended()


def seed_admin():
    username = os.getenv("ADMIN_USERNAME")
    password = os.getenv("ADMIN_PASSWORD")

    if not username or not password:
        raise RuntimeError(
            "ADMIN_USERNAME and ADMIN_PASSWORD must be configured in .env"
        )

    username = username.strip()

    db = SessionLocal()

    try:
        existing_user = db.scalar(
            select(User).where(
                User.username == username
            )
        )

        hashed_password = password_hash.hash(password)

        if existing_user:
            existing_user.password_hash = hashed_password
            existing_user.role = "ADMIN"
            existing_user.shop_id = None
            existing_user.is_active = True

            db.commit()

            print("=" * 60)
            print("SNACKFLOW ADMIN UPDATED")
            print("=" * 60)
            print(f"Username : {username}")
            print("Role     : ADMIN")
            print("Shop     : ALL SHOPS")
            print("Status   : ACTIVE")
            print("=" * 60)

        else:
            admin = User(
                username=username,
                password_hash=hashed_password,
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


if __name__ == "__main__":
    seed_admin()