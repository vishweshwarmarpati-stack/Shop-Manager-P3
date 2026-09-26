from decimal import Decimal

from pydantic import BaseModel, Field


class ProductCreate(BaseModel):
    name: str = Field(
        min_length=1,
        max_length=100,
    )

    price: Decimal = Field(
        gt=0,
        max_digits=10,
        decimal_places=2,
    )

    category: str = Field(
        min_length=1,
        max_length=50,
    )

    shop_id: int = Field(gt=0)

    image: str | None = Field(
        default=None,
        max_length=500,
    )

    is_active: bool = True


class ProductUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
    )

    price: Decimal | None = Field(
        default=None,
        gt=0,
        max_digits=10,
        decimal_places=2,
    )

    category: str | None = Field(
        default=None,
        min_length=1,
        max_length=50,
    )

    shop_id: int | None = Field(
        default=None,
        gt=0,
    )

    image: str | None = Field(
        default=None,
        max_length=500,
    )

    is_active: bool | None = None


class ProductResponse(BaseModel):
    id: int
    name: str
    price: Decimal
    category: str
    shop_id: int
    image: str | None = None
    is_active: bool