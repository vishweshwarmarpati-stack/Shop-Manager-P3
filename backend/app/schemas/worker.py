from decimal import Decimal

from pydantic import BaseModel, Field


class WorkerCreate(BaseModel):
    name: str = Field(
        min_length=1,
        max_length=100,
    )

    shop_id: int = Field(
        gt=0,
    )

    salary: Decimal = Field(
        gt=0,
        max_digits=10,
        decimal_places=2,
    )

    salary_paid: bool = False


class WorkerUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
    )

    shop_id: int | None = Field(
        default=None,
        gt=0,
    )

    salary: Decimal | None = Field(
        default=None,
        gt=0,
        max_digits=10,
        decimal_places=2,
    )

    salary_paid: bool | None = None


class WorkerResponse(BaseModel):
    id: int
    name: str
    shop_id: int
    shop_name: str
    salary: Decimal
    salary_paid: bool