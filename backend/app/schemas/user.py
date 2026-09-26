from pydantic import BaseModel, Field


class CreateUserRequest(BaseModel):
    username: str = Field(
        min_length=3,
        max_length=100,
    )

    password: str = Field(
        min_length=6,
        max_length=255,
    )

    role: str = "CASHIER"

    shop_id: int | None = None


class UpdateUserRequest(BaseModel):
    username: str | None = Field(
        default=None,
        min_length=3,
        max_length=100,
    )

    password: str | None = Field(
        default=None,
        min_length=6,
        max_length=255,
    )

    role: str | None = None

    shop_id: int | None = None

    is_active: bool | None = None


class UserResponse(BaseModel):
    id: int
    username: str
    role: str
    shop_id: int | None
    shop_name: str | None
    is_active: bool