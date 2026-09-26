from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class SalaryPaymentCreate(BaseModel):
    worker_id: int = Field(gt=0)

    amount: Decimal = Field(
        gt=0,
        max_digits=10,
        decimal_places=2,
    )

    payment_month: str = Field(
        min_length=7,
        max_length=7,
    )

    payment_method: str = Field(
        min_length=1,
        max_length=30,
    )

    notes: str | None = Field(
        default=None,
        max_length=500,
    )


class SalaryPaymentResponse(BaseModel):
    id: int
    worker_id: int
    worker_name: str
    amount: Decimal
    payment_month: str
    payment_date: datetime
    payment_method: str
    notes: str | None