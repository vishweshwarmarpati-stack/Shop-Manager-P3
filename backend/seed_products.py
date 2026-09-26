from decimal import Decimal

from app.database import SessionLocal
from app.models.shop import Shop
from app.models.product import Product


MENU = [
    # IDLY
    {
        "name": "Idly",
        "price": 40,
        "category": "Idly",
    },
    {
        "name": "Sambar Idly",
        "price": 60,
        "category": "Idly",
    },
    {
        "name": "Ghee Karam Idly",
        "price": 60,
        "category": "Idly",
    },
    {
        "name": "Tawa Idly",
        "price": 60,
        "category": "Idly",
    },

    # DOSA
    {
        "name": "Plain Dosa",
        "price": 40,
        "category": "Dosa",
    },
    {
        "name": "Masala Dosa",
        "price": 50,
        "category": "Dosa",
    },
    {
        "name": "Onion Dosa",
        "price": 50,
        "category": "Dosa",
    },
    {
        "name": "Ghee Karam Dosa",
        "price": 50,
        "category": "Dosa",
    },
    {
        "name": "Ghee Karam Masala Dosa",
        "price": 60,
        "category": "Dosa",
    },

    # VADA
    {
        "name": "Vada",
        "price": 50,
        "category": "Vada",
    },
    {
        "name": "Chitti Vada",
        "price": 50,
        "category": "Vada",
    },
    {
        "name": "Sambar Vada",
        "price": 60,
        "category": "Vada",
    },
    {
        "name": "Sambar Chitti Vada",
        "price": 60,
        "category": "Vada",
    },
    {
        "name": "Bonda",
        "price": 40,
        "category": "Vada",
    },
    {
        "name": "Tawa Bonda",
        "price": 50,
        "category": "Vada",
    },

    # PURI
    {
        "name": "Veg Puri",
        "price": 50,
        "category": "Puri",
    },
    {
        "name": "Nonveg Puri",
        "price": 110,
        "category": "Puri",
    },
    {
        "name": "Pongal",
        "price": 70,
        "category": "Puri",
    },

    # NON-VEG TIFFINS
    {
        "name": "Mutton Keema Dosa",
        "price": 140,
        "category": "Non-Veg Tiffins",
    },
    {
        "name": "Chicken Keema Dosa",
        "price": 120,
        "category": "Non-Veg Tiffins",
    },
    {
        "name": "Chicken Puri",
        "price": 110,
        "category": "Non-Veg Tiffins",
    },
    {
        "name": "Paya Idly",
        "price": 100,
        "category": "Non-Veg Tiffins",
    },
    {
        "name": "Chitti Vada / Chicken Curry",
        "price": 120,
        "category": "Non-Veg Tiffins",
    },

    # TEA & COFFEE
    {
        "name": "Single Tea",
        "price": 20,
        "category": "Tea & Coffee",
    },
    {
        "name": "Full Tea",
        "price": 30,
        "category": "Tea & Coffee",
    },
    {
        "name": "Filter Coffee",
        "price": 40,
        "category": "Tea & Coffee",
    },
    {
        "name": "Thatibellam Coffee",
        "price": 50,
        "category": "Tea & Coffee",
    },

    # EVENING SNACKS
    {
        "name": "Mirchi",
        "price": 40,
        "category": "Evening Snacks",
    },
    {
        "name": "Punugulu",
        "price": 40,
        "category": "Evening Snacks",
    },
    {
        "name": "Masala Punugulu",
        "price": 50,
        "category": "Evening Snacks",
    },
    {
        "name": "Masala Mirchi",
        "price": 50,
        "category": "Evening Snacks",
    },
    {
        "name": "Sarvapindi",
        "price": 40,
        "category": "Evening Snacks",
    },
    {
        "name": "Makka Garelu",
        "price": 40,
        "category": "Evening Snacks",
    },
    {
        "name": "Samosa (Big)",
        "price": 25,
        "category": "Evening Snacks",
    },
    {
        "name": "Sweet Corn Samosa",
        "price": 15,
        "category": "Evening Snacks",
    },
    {
        "name": "Onion Samosa",
        "price": 15,
        "category": "Evening Snacks",
    },
    {
        "name": "Carrot Samosa",
        "price": 15,
        "category": "Evening Snacks",
    },
]


def seed_products():
    db = SessionLocal()

    try:
        shop = db.query(Shop).first()

        if shop is None:
            print("ERROR: No shop exists in the database.")
            print("Create a shop first from SnackFlow → Shops.")
            return

        print("=" * 60)
        print("SNACKFLOW PRODUCT SEED")
        print("=" * 60)
        print(f"Using shop: {shop.name} (ID: {shop.id})")
        print()

        added = 0
        skipped = 0

        for item in MENU:
            existing = (
                db.query(Product)
                .filter(
                    Product.name == item["name"],
                    Product.shop_id == shop.id,
                )
                .first()
            )

            if existing:
                skipped += 1
                print(
                    f"SKIPPED  {item['name']}"
                    f" - already exists"
                )
                continue

            product = Product(
                name=item["name"],
                price=Decimal(str(item["price"])),
                category=item["category"],
                shop_id=shop.id,
            )

            db.add(product)
            added += 1

            print(
                f"ADDED    {item['name']}"
                f" - ₹{item['price']}"
            )

        db.commit()

        print()
        print("=" * 60)
        print("SEED COMPLETE")
        print("=" * 60)
        print(f"Products added   : {added}")
        print(f"Products skipped : {skipped}")
        print(f"Total menu items : {len(MENU)}")
        print("=" * 60)

    except Exception as error:
        db.rollback()

        print()
        print("=" * 60)
        print("SEED FAILED")
        print("=" * 60)
        print(error)
        print("=" * 60)

        raise

    finally:
        db.close()


if __name__ == "__main__":
    seed_products()