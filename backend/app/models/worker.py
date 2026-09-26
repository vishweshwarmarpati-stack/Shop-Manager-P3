from __future__ import annotations

from decimal import Decimal

from sqlalchemy import Boolean, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Worker(Base):
    __tablename__ = "workers"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    shop_id: Mapped[int] = mapped_column(
        ForeignKey(
            "shops.id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    salary: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False,
    )

    salary_paid: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    shop: Mapped["Shop"] = relationship(
        "Shop",
        backref="workers",
    )

    salary_payments: Mapped[list["SalaryPayment"]] = relationship(
        "SalaryPayment",
        back_populates="worker",
        cascade="all, delete-orphan",
    )