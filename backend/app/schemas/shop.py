from pydantic import BaseModel, Field
from typing import Literal


class ShopCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    location: str = Field(min_length=1, max_length=200)


class ShopUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
    )

    location: str | None = Field(
        default=None,
        min_length=1,
        max_length=200,
    )

    status: Literal["Open", "Closed"] | None = None


class ShopResponse(BaseModel):
    id: int
    name: str
    location: str
    status: Literal["Open", "Closed"]

